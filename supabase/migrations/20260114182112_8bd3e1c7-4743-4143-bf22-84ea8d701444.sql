-- Add learning_step column to track consecutive successful recalls in learning phase
-- This tracks how many consecutive Good responses have occurred
-- NULL or 0 = no consecutive goods, 1 = one good, 2+ = should graduate
ALTER TABLE public.memorization_items 
ADD COLUMN IF NOT EXISTS learning_step integer NOT NULL DEFAULT 0;

-- Add index for efficient learning phase queries
CREATE INDEX IF NOT EXISTS idx_memorization_items_learning 
ON public.memorization_items (user_id, phase, learning_step);