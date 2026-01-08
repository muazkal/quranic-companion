-- Change category column from text to text array
ALTER TABLE public.memorization_items 
ALTER COLUMN category TYPE text[] 
USING CASE 
  WHEN category IS NULL THEN NULL 
  WHEN category = '' THEN NULL 
  ELSE ARRAY[category] 
END;