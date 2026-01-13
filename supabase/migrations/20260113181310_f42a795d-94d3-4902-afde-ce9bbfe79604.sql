-- Add phase column and timestamp-based scheduling for learning cards
-- Phase: 'learning' for minute-based intervals, 'review' for day-based intervals

-- Add phase column with default 'review' for existing cards
ALTER TABLE public.memorization_items 
ADD COLUMN IF NOT EXISTS phase text NOT NULL DEFAULT 'review';

-- Add timestamp column for precise scheduling (includes time for learning phase)
ALTER TABLE public.memorization_items 
ADD COLUMN IF NOT EXISTS next_review_at timestamptz NOT NULL DEFAULT now();

-- Migrate existing next_review_date to next_review_at for existing cards
-- Set time to start of day for existing cards (they're in review phase)
UPDATE public.memorization_items 
SET next_review_at = (next_review_date::timestamp AT TIME ZONE 'UTC'),
    phase = CASE 
      WHEN repetitions < 2 THEN 'learning' 
      ELSE 'review' 
    END;

-- Add check constraint to ensure valid phase values
ALTER TABLE public.memorization_items 
ADD CONSTRAINT valid_phase CHECK (phase IN ('learning', 'review'));

-- Create index on phase and next_review_at for efficient querying
CREATE INDEX IF NOT EXISTS idx_memorization_items_phase_review 
ON public.memorization_items (user_id, phase, next_review_at);