-- Create broker_news table for dynamic announcements
CREATE TABLE public.broker_news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  link_url TEXT,
  link_label TEXT,
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  target_roles TEXT[] DEFAULT '{"broker"}',
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.broker_news ENABLE ROW LEVEL SECURITY;

-- Admins can manage all news
CREATE POLICY "Admins can manage all broker news"
  ON public.broker_news FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Brokers can view active news
CREATE POLICY "Brokers can view active news"
  ON public.broker_news FOR SELECT
  USING (
    is_active = true 
    AND (start_date IS NULL OR start_date <= now())
    AND (end_date IS NULL OR end_date >= now())
  );

-- Create trigger for updated_at
CREATE TRIGGER update_broker_news_updated_at
  BEFORE UPDATE ON public.broker_news
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();