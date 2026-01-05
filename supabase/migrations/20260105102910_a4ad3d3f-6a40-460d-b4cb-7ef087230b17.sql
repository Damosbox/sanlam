-- Table des modèles d'enquêtes
CREATE TABLE public.survey_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  target_audience TEXT NOT NULL CHECK (target_audience IN ('client', 'broker', 'both')),
  trigger_event TEXT NOT NULL,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table des règles de déclenchement
CREATE TABLE public.survey_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_template_id UUID REFERENCES public.survey_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trigger_delay_hours INTEGER DEFAULT 1,
  reminder_delays INTEGER[] DEFAULT '{24, 72}',
  max_reminders INTEGER DEFAULT 2,
  channels TEXT[] DEFAULT '{email}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table des envois d'enquêtes
CREATE TABLE public.survey_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_template_id UUID REFERENCES public.survey_templates(id),
  rule_id UUID REFERENCES public.survey_rules(id),
  recipient_id UUID NOT NULL,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('client', 'broker')),
  trigger_source_type TEXT,
  trigger_source_id UUID,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'opened', 'completed', 'expired')),
  send_channel TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  reminder_count INTEGER DEFAULT 0,
  next_reminder_at TIMESTAMPTZ,
  unique_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table des réponses aux enquêtes
CREATE TABLE public.survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_send_id UUID REFERENCES public.survey_sends(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  nps_score INTEGER,
  comment TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.survey_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

-- RLS pour survey_templates
CREATE POLICY "Admins can manage all survey templates"
ON public.survey_templates FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view active templates"
ON public.survey_templates FOR SELECT
USING (is_active = true);

-- RLS pour survey_rules
CREATE POLICY "Admins can manage all survey rules"
ON public.survey_rules FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view active rules"
ON public.survey_rules FOR SELECT
USING (is_active = true);

-- RLS pour survey_sends
CREATE POLICY "Admins can manage all survey sends"
ON public.survey_sends FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Recipients can view their own surveys"
ON public.survey_sends FOR SELECT
USING (recipient_id = auth.uid());

CREATE POLICY "System can insert survey sends"
ON public.survey_sends FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public can view by token"
ON public.survey_sends FOR SELECT
USING (unique_token IS NOT NULL);

CREATE POLICY "Public can update by token"
ON public.survey_sends FOR UPDATE
USING (unique_token IS NOT NULL);

-- RLS pour survey_responses
CREATE POLICY "Admins can manage all survey responses"
ON public.survey_responses FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert survey responses"
ON public.survey_responses FOR INSERT
WITH CHECK (true);

CREATE POLICY "Recipients can view their own responses"
ON public.survey_responses FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.survey_sends
  WHERE survey_sends.id = survey_responses.survey_send_id
  AND survey_sends.recipient_id = auth.uid()
));

-- Trigger pour updated_at
CREATE TRIGGER update_survey_templates_updated_at
BEFORE UPDATE ON public.survey_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_survey_rules_updated_at
BEFORE UPDATE ON public.survey_rules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();