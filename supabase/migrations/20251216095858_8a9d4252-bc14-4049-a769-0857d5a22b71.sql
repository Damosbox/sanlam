-- Create broker_settings table for OTP and other broker-specific settings
CREATE TABLE public.broker_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  broker_id UUID NOT NULL UNIQUE,
  otp_verification_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.broker_settings ENABLE ROW LEVEL SECURITY;

-- Admins can view and manage all broker settings
CREATE POLICY "Admins can manage all broker settings"
ON public.broker_settings
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Brokers can view their own settings
CREATE POLICY "Brokers can view own settings"
ON public.broker_settings
FOR SELECT
USING (auth.uid() = broker_id);

-- Create trigger for updated_at
CREATE TRIGGER update_broker_settings_updated_at
BEFORE UPDATE ON public.broker_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create otp_verifications table to store pending OTP codes
CREATE TABLE public.otp_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  broker_id UUID NOT NULL,
  phone_number TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- Brokers can manage their own OTP verifications
CREATE POLICY "Brokers can manage own OTP verifications"
ON public.otp_verifications
FOR ALL
USING (auth.uid() = broker_id);

-- Create index for faster lookups
CREATE INDEX idx_otp_verifications_phone_code ON public.otp_verifications(phone_number, otp_code);
CREATE INDEX idx_otp_verifications_broker ON public.otp_verifications(broker_id);