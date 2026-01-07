// SM-2 Spaced Repetition Algorithm Implementation

export type RecallRating = 0 | 1 | 2 | 3; // 0=forgot, 1=hard, 2=good, 3=easy

export interface SpacedRepetitionData {
  repetitions: number;
  easinessFactor: number;
  interval: number;
}

export interface SpacedRepetitionResult extends SpacedRepetitionData {
  nextReviewDate: Date;
}

/**
 * Calculate the next review date based on the SM-2 algorithm
 * @param rating - 0: forgot, 1: hard, 2: good, 3: easy
 * @param currentData - Current spaced repetition data
 * @returns Updated spaced repetition data with next review date
 */
export function calculateNextReview(
  rating: RecallRating,
  currentData: SpacedRepetitionData
): SpacedRepetitionResult {
  let { repetitions, easinessFactor, interval } = currentData;

  // Minimum easiness factor is 1.3
  const minEF = 1.3;

  if (rating < 2) {
    // If forgot or hard, reset repetitions
    repetitions = 0;
    interval = 1;
  } else {
    // Calculate new interval
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easinessFactor);
    }
    repetitions += 1;
  }

  // Update easiness factor based on rating
  // EF' = EF + (0.1 - (3 - rating) * (0.08 + (3 - rating) * 0.02))
  const efChange = 0.1 - (3 - rating) * (0.08 + (3 - rating) * 0.02);
  easinessFactor = Math.max(minEF, easinessFactor + efChange);

  // Apply rating-specific modifiers
  if (rating === 3) {
    // Easy - increase interval by 1.5x
    interval = Math.round(interval * 1.3);
  } else if (rating === 1) {
    // Hard - reduce interval
    interval = Math.max(1, Math.round(interval * 0.5));
  } else if (rating === 0) {
    // Forgot - reset to 1 day
    interval = 1;
  }

  // Calculate next review date
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);

  return {
    repetitions,
    easinessFactor: Number(easinessFactor.toFixed(2)),
    interval,
    nextReviewDate,
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
 * Get rating label
 */
export function getRatingLabel(rating: RecallRating): string {
  switch (rating) {
    case 0: return 'Forgot';
    case 1: return 'Hard';
    case 2: return 'Good';
    case 3: return 'Easy';
  }
}
