-- Create enum for item types
CREATE TYPE public.item_type AS ENUM ('hadith', 'quran', 'scholar');

-- Create enum for difficulty levels
CREATE TYPE public.difficulty_level AS ENUM ('easy', 'medium', 'hard');

-- Create profiles table for user data
CREATE TABLE public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    display_name TEXT,
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_review_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

-- Create memorization_items table
CREATE TABLE public.memorization_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    arabic_text TEXT NOT NULL,
    translation TEXT,
    item_type item_type NOT NULL DEFAULT 'hadith',
    source TEXT,
    category TEXT,
    difficulty difficulty_level NOT NULL DEFAULT 'medium',
    -- Spaced repetition fields (SM-2 algorithm)
    repetitions INTEGER NOT NULL DEFAULT 0,
    easiness_factor NUMERIC(4,2) NOT NULL DEFAULT 2.5,
    interval INTEGER NOT NULL DEFAULT 1, -- days
    next_review_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on memorization_items
ALTER TABLE public.memorization_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for memorization_items
CREATE POLICY "Users can view their own items" 
ON public.memorization_items FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own items" 
ON public.memorization_items FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own items" 
ON public.memorization_items FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own items" 
ON public.memorization_items FOR DELETE 
USING (auth.uid() = user_id);

-- Create review_history table
CREATE TABLE public.review_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    item_id UUID REFERENCES public.memorization_items(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 0 AND rating <= 3), -- 0=forgot, 1=hard, 2=good, 3=easy
    reviewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on review_history
ALTER TABLE public.review_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for review_history
CREATE POLICY "Users can view their own review history" 
ON public.review_history FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reviews" 
ON public.review_history FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_memorization_items_updated_at
BEFORE UPDATE ON public.memorization_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-create profile
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for performance
CREATE INDEX idx_memorization_items_user_id ON public.memorization_items(user_id);
CREATE INDEX idx_memorization_items_next_review ON public.memorization_items(user_id, next_review_date);
CREATE INDEX idx_review_history_user_id ON public.review_history(user_id);
CREATE INDEX idx_review_history_item_id ON public.review_history(item_id);