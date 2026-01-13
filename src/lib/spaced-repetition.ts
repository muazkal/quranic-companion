// Anki-style SM-2 Spaced Repetition Algorithm Implementation

export type RecallRating = 0 | 1 | 2 | 3; // 0=Again, 1=Hard, 2=Good, 3=Easy

export interface SpacedRepetitionData {
  repetitions: number;
  easinessFactor: number;
  interval: number; // In days (can be fractional for sub-day intervals)
}

export interface SpacedRepetitionResult extends SpacedRepetitionData {
  nextReviewDate: Date;
  requeueInSession: boolean; // True if card should be shown again in same session
}

// Minimum ease factor (Anki default is 1.3)
const MIN_EASE_FACTOR = 1.3;

// Learning steps in minutes - cards must pass through these before graduating
const LEARNING_STEPS_MINUTES = [1, 10]; // 1 min, 10 min

// Convert minutes to fractional days
const minutesToDays = (minutes: number): number => minutes / 1440;

// Graduation interval (first review interval after learning phase)
const GRADUATING_INTERVAL = 1; // 1 day

// Easy bonus for graduating immediately
const EASY_GRADUATING_INTERVAL = 4; // 4 days

/**
 * Determine if a card is in learning phase
 * Cards are in learning phase if repetitions < learning steps count
 */
function isLearningPhase(repetitions: number): boolean {
  return repetitions < LEARNING_STEPS_MINUTES.length;
}

/**
 * Anki-style SM-2 algorithm with proper learning steps and mature card intervals
 * @param rating - 0: Again, 1: Hard, 2: Good, 3: Easy
 * @param currentData - Current spaced repetition data
 * @returns Updated spaced repetition data with next review date
 */
export function calculateNextReview(
  rating: RecallRating,
  currentData: SpacedRepetitionData
): SpacedRepetitionResult {
  let { repetitions, easinessFactor, interval } = currentData;

  // DEFENSIVE: Ensure all values are valid numbers with sensible defaults
  if (!Number.isFinite(repetitions) || repetitions < 0) {
    repetitions = 0;
  }
  if (!Number.isFinite(easinessFactor) || easinessFactor < MIN_EASE_FACTOR) {
    easinessFactor = 2.5; // Default Anki ease factor
  }
  if (!Number.isFinite(interval) || interval < 0) {
    interval = 0;
  }

  const nextReviewDate = new Date();
  let requeueInSession = false;

  const inLearningPhase = isLearningPhase(repetitions);

  switch (rating) {
    case 0: // Again - Failed recall, must retry in same session
      repetitions = 0;
      interval = 0; // Will be requeued in session
      requeueInSession = true;
      // Decrease ease factor by 0.2 (Anki behavior)
      easinessFactor = Math.max(MIN_EASE_FACTOR, easinessFactor - 0.2);
      break;

    case 1: // Hard
      if (inLearningPhase) {
        // In learning: repeat current step (slightly longer)
        const currentStep = LEARNING_STEPS_MINUTES[repetitions] || LEARNING_STEPS_MINUTES[0];
        interval = minutesToDays(currentStep * 1.5); // 1.5x current step
        // Don't advance repetitions for hard in learning
      } else {
        // Review phase: multiply by hard multiplier (1.2)
        // DEFENSIVE: Ensure previous interval is at least 1 day for mature cards
        const safeInterval = Math.max(1, interval);
        interval = Math.max(1, Math.round(safeInterval * 1.2));
        repetitions += 1;
      }
      // Decrease ease factor by 0.15
      easinessFactor = Math.max(MIN_EASE_FACTOR, easinessFactor - 0.15);
      break;

    case 2: // Good - Standard progression
      if (inLearningPhase) {
        // Advance to next learning step
        const nextStep = repetitions + 1;
        if (nextStep >= LEARNING_STEPS_MINUTES.length) {
          // Graduate to review phase
          interval = GRADUATING_INTERVAL;
        } else {
          // Next learning step
          interval = minutesToDays(LEARNING_STEPS_MINUTES[nextStep]);
        }
        repetitions += 1;
      } else {
        // Review phase: apply ease factor
        // DEFENSIVE: Ensure previous interval is at least 1 day for mature cards
        const safeInterval = Math.max(1, interval);
        const safeEaseFactor = Math.max(MIN_EASE_FACTOR, easinessFactor);
        interval = Math.max(1, Math.round(safeInterval * safeEaseFactor));
        repetitions += 1;
      }
      break;

    case 3: // Easy - Aggressive interval increase
      if (inLearningPhase) {
        // Graduate immediately with bonus
        interval = EASY_GRADUATING_INTERVAL;
        repetitions = LEARNING_STEPS_MINUTES.length; // Mark as graduated
      } else {
        // Review phase: apply ease factor with easy bonus (1.3x)
        // DEFENSIVE: Ensure previous interval is at least 1 day for mature cards
        const safeInterval = Math.max(1, interval);
        const safeEaseFactor = Math.max(MIN_EASE_FACTOR, easinessFactor);
        interval = Math.max(1, Math.round(safeInterval * safeEaseFactor * 1.3));
        repetitions += 1;
      }
      // Increase ease factor by 0.15
      easinessFactor = easinessFactor + 0.15;
      break;
  }

  // DEFENSIVE: Ensure interval is a valid number before date calculation
  const safeIntervalForDate = Number.isFinite(interval) ? interval : 0;
  
  // Set next review date based on interval
  if (safeIntervalForDate > 0) {
    if (safeIntervalForDate < 1) {
      // Sub-day interval: add minutes
      const minutes = Math.max(1, Math.round(safeIntervalForDate * 1440));
      nextReviewDate.setMinutes(nextReviewDate.getMinutes() + minutes);
    } else {
      // Full day interval
      const daysToAdd = Math.max(1, Math.round(safeIntervalForDate));
      nextReviewDate.setDate(nextReviewDate.getDate() + daysToAdd);
    }
  }
  // If interval is 0, nextReviewDate stays as now (requeued in session)

  return {
    repetitions,
    easinessFactor: Number(easinessFactor.toFixed(2)),
    interval,
    nextReviewDate,
    requeueInSession,
  };
}

/**
 * Get the status of an item based on its repetition data
 */
export function getItemStatus(
  repetitions: number,
  easinessFactor: number
): 'new' | 'learning' | 'memorized' | 'struggling' {
  if (repetitions === 0) return 'new';
  if (repetitions < 3) return 'learning';
  if (easinessFactor < 1.8) return 'struggling';
  return 'memorized';
}

/**
 * Get rating label - Anki-style naming
 */
export function getRatingLabel(rating: RecallRating): string {
  switch (rating) {
    case 0: return 'Again';
    case 1: return 'Hard';
    case 2: return 'Good';
    case 3: return 'Easy';
  }
}

/**
 * Get estimated next interval for each rating option (for UI display)
 */
export function getEstimatedIntervals(currentData: SpacedRepetitionData): Record<RecallRating, string> {
  const results: Record<RecallRating, string> = {} as Record<RecallRating, string>;
  
  for (let rating = 0; rating <= 3; rating++) {
    const result = calculateNextReview(rating as RecallRating, currentData);
    // For "Again" (rating 0), show "Repeat" instead of interval
    results[rating as RecallRating] = formatInterval(result.interval, rating === 0);
  }
  
  return results;
}

/**
 * Format interval for display - supports sub-day intervals
 */
function formatInterval(days: number, isAgain: boolean = false): string {
  if (isAgain || days === 0) return 'Repeat';
  
  // Sub-day intervals (less than 1 day)
  if (days < 1) {
    const minutes = Math.round(days * 1440);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.round(minutes / 60);
    return `${hours}h`;
  }
  
  // Full day intervals
  const roundedDays = Math.round(days);
  if (roundedDays === 1) return '1d';
  if (roundedDays < 30) return `${roundedDays}d`;
  if (roundedDays < 365) return `${Math.round(roundedDays / 30)}mo`;
  return `${(roundedDays / 365).toFixed(1)}y`;
}
