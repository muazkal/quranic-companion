-- Add new fields for structured item input
ALTER TABLE public.memorization_items
ADD COLUMN IF NOT EXISTS narrator TEXT,
ADD COLUMN IF NOT EXISTS speaker_name TEXT,
ADD COLUMN IF NOT EXISTS surah_name TEXT,
ADD COLUMN IF NOT EXISTS ayah_reference TEXT;

-- Create index for faster filtering (only if not exists)
CREATE INDEX IF NOT EXISTS idx_memorization_items_item_type ON public.memorization_items(item_type);