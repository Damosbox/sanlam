-- Create user_attributes table for personalization
CREATE TABLE IF NOT EXISTS public.user_attributes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  age_range TEXT,
  family_status TEXT,
  occupation_category TEXT,
  location TEXT,
  income_range TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_attributes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_attributes
CREATE POLICY "Users can view their own attributes"
  ON public.user_attributes
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own attributes"
  ON public.user_attributes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attributes"
  ON public.user_attributes
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_attributes_updated_at
  BEFORE UPDATE ON public.user_attributes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();