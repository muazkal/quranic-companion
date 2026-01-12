// Anki-style SM-2 Spaced Repetition Algorithm Implementation

export type RecallRating = 0 | 1 | 2 | 3; // 0=Again, 1=Hard, 2=Good, 3=Easy

export interface SpacedRepetitionData {
  repetitions: number;
  easinessFactor: number;
  interval: number;
}

export interface SpacedRepetitionResult extends SpacedRepetitionData {
  nextReviewDate: Date;
  requeueInSession: boolean; // True if card should be shown again in same session
}

// Minimum ease factor (Anki default is 1.3)
const MIN_EASE_FACTOR = 1.3;

// Learning phase intervals in minutes (converted to days for storage)
const LEARNING_STEPS = [1, 10]; // 1 min, 10 min (simplified for daily review)

/**
 * Anki-style SM-2 algorithm
 * @param rating - 0: Again, 1: Hard, 2: Good, 3: Easy
 * @param currentData - Current spaced repetition data
 * @returns Updated spaced repetition data with next review date
 */
export function calculateNextReview(
  rating: RecallRating,
  currentData: SpacedRepetitionData
): SpacedRepetitionResult {
  let { repetitions, easinessFactor, interval } = currentData;

  // Ensure easiness factor is at least the minimum
  easinessFactor = Math.max(MIN_EASE_FACTOR, easinessFactor);

  const nextReviewDate = new Date();
  let requeueInSession = false;

  switch (rating) {
    case 0: // Again - Failed recall, must retry in same session
      repetitions = 0;
      interval = 0; // Same day - will be requeued in session
      requeueInSession = true; // Card must reappear in this session
      // Decrease ease factor by 0.2 (Anki behavior)
      easinessFactor = Math.max(MIN_EASE_FACTOR, easinessFactor - 0.2);
      break;

    case 1: // Hard - Increase interval slightly, decrease ease
      if (repetitions === 0) {
        // Still in learning phase
        interval = 1;
      } else {
        // Multiply by 1.2 (Anki hard multiplier)
        interval = Math.max(1, Math.round(interval * 1.2));
      }
      // Decrease ease factor by 0.15 (Anki behavior)
      easinessFactor = Math.max(MIN_EASE_FACTOR, easinessFactor - 0.15);
      repetitions += 1;
      break;

    case 2: // Good - Standard SM-2 progression
      if (repetitions === 0) {
        interval = 1; // First successful review: 1 day
      } else if (repetitions === 1) {
        interval = 6; // Second successful review: 6 days
      } else {
        // Apply ease factor
        interval = Math.round(interval * easinessFactor);
      }
      repetitions += 1;
      break;

    case 3: // Easy - Aggressive interval increase
      if (repetitions === 0) {
        interval = 4; // Skip ahead to 4 days
      } else if (repetitions === 1) {
        interval = 10; // Jump to 10 days
      } else {
        // Apply ease factor with easy bonus (1.3x multiplier like Anki)
        interval = Math.round(interval * easinessFactor * 1.3);
      }
      // Increase ease factor by 0.15 (Anki behavior)
      easinessFactor = easinessFactor + 0.15;
      repetitions += 1;
      break;
  }

  // Set next review date (for Again, keep it today so it stays in queue)
  if (interval > 0) {
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);
  }
  // If interval is 0, nextReviewDate stays as today

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
 * Format interval for display
 */
function formatInterval(days: number, isAgain: boolean = false): string {
  if (isAgain || days === 0) return 'Repeat';
  if (days === 1) return '1d';
  if (days < 30) return `${days}d`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${(days / 365).toFixed(1)}y`;
}
