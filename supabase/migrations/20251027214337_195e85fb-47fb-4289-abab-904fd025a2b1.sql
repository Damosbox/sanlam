-- Create enum types for loyalty system
CREATE TYPE public.loyalty_level AS ENUM ('bronze', 'silver', 'gold', 'platinum');
CREATE TYPE public.mission_type AS ENUM ('payment', 'referral', 'profile_update', 'quiz', 'claim_free', 'social_share', 'document_upload', 'subscription', 'renewal', 'app_download', 'survey');
CREATE TYPE public.mission_status AS ENUM ('available', 'in_progress', 'completed', 'expired');
CREATE TYPE public.reward_type AS ENUM ('discount', 'gift_card', 'premium_reduction', 'free_option', 'partner_voucher', 'lottery_entry', 'priority_service');
CREATE TYPE public.user_reward_status AS ENUM ('pending', 'active', 'redeemed', 'expired');
CREATE TYPE public.transaction_type AS ENUM ('earned', 'spent', 'expired', 'adjusted');
CREATE TYPE public.transaction_source AS ENUM ('mission', 'referral', 'bonus', 'admin', 'reward');
CREATE TYPE public.referral_status AS ENUM ('pending', 'completed', 'rewarded');
CREATE TYPE public.recurrence_period AS ENUM ('daily', 'weekly', 'monthly', 'yearly', 'once');

-- Table 1: loyalty_profiles - Profil de fidélité de chaque utilisateur
CREATE TABLE public.loyalty_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  total_points INTEGER NOT NULL DEFAULT 0,
  current_level loyalty_level NOT NULL DEFAULT 'bronze',
  level_progress INTEGER NOT NULL DEFAULT 0 CHECK (level_progress >= 0 AND level_progress <= 100),
  points_to_next_level INTEGER NOT NULL DEFAULT 1000,
  badges_earned JSONB NOT NULL DEFAULT '[]'::jsonb,
  lifetime_points INTEGER NOT NULL DEFAULT 0,
  referral_count INTEGER NOT NULL DEFAULT 0,
  referral_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table 2: loyalty_levels - Configuration des niveaux
CREATE TABLE public.loyalty_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_name loyalty_level NOT NULL UNIQUE,
  min_points_required INTEGER NOT NULL,
  benefits JSONB NOT NULL DEFAULT '{}'::jsonb,
  color_theme TEXT NOT NULL,
  icon TEXT,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table 3: loyalty_missions - Catalogue de missions possibles
CREATE TABLE public.loyalty_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  mission_type mission_type NOT NULL,
  points_reward INTEGER NOT NULL,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurrence_period recurrence_period NOT NULL DEFAULT 'once',
  requirements JSONB NOT NULL DEFAULT '{}'::jsonb,
  badge_reward JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  target_audience JSONB NOT NULL DEFAULT '{}'::jsonb,
  priority INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table 4: user_missions - Missions assignées/complétées par utilisateur
CREATE TABLE public.user_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mission_id UUID NOT NULL REFERENCES loyalty_missions(id) ON DELETE CASCADE,
  status mission_status NOT NULL DEFAULT 'available',
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  completion_data JSONB,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  points_earned INTEGER,
  UNIQUE(user_id, mission_id, assigned_at)
);

-- Table 5: loyalty_rewards - Catalogue de récompenses disponibles
CREATE TABLE public.loyalty_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  reward_type reward_type NOT NULL,
  cost_in_points INTEGER NOT NULL,
  required_level loyalty_level NOT NULL DEFAULT 'bronze',
  reward_value NUMERIC,
  partner_info JSONB,
  stock_available INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expiry_date TIMESTAMP WITH TIME ZONE,
  terms_conditions TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table 6: user_rewards - Récompenses réclamées
CREATE TABLE public.user_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES loyalty_rewards(id) ON DELETE CASCADE,
  claimed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  redeemed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  status user_reward_status NOT NULL DEFAULT 'pending',
  redemption_code TEXT NOT NULL UNIQUE,
  redemption_data JSONB
);

-- Table 7: loyalty_transactions - Historique de tous les points
CREATE TABLE public.loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type transaction_type NOT NULL,
  points_amount INTEGER NOT NULL,
  source_type transaction_source NOT NULL,
  source_id UUID,
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table 8: referral_tracking - Suivi des parrainages
CREATE TABLE public.referral_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  status referral_status NOT NULL DEFAULT 'pending',
  reward_earned INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on all tables
ALTER TABLE public.loyalty_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for loyalty_profiles
CREATE POLICY "Users can view their own loyalty profile" ON public.loyalty_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own loyalty profile" ON public.loyalty_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all loyalty profiles" ON public.loyalty_profiles FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage all loyalty profiles" ON public.loyalty_profiles FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "System can insert loyalty profiles" ON public.loyalty_profiles FOR INSERT WITH CHECK (true);

-- RLS Policies for loyalty_levels
CREATE POLICY "Anyone can view loyalty levels" ON public.loyalty_levels FOR SELECT USING (true);
CREATE POLICY "Admins can manage loyalty levels" ON public.loyalty_levels FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for loyalty_missions
CREATE POLICY "Authenticated users can view active missions" ON public.loyalty_missions FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage all missions" ON public.loyalty_missions FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for user_missions
CREATE POLICY "Users can view their own missions" ON public.user_missions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own missions" ON public.user_missions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can insert user missions" ON public.user_missions FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage all user missions" ON public.user_missions FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for loyalty_rewards
CREATE POLICY "Authenticated users can view active rewards" ON public.loyalty_rewards FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage all rewards" ON public.loyalty_rewards FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for user_rewards
CREATE POLICY "Users can view their own rewards" ON public.user_rewards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own rewards" ON public.user_rewards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all user rewards" ON public.user_rewards FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for loyalty_transactions
CREATE POLICY "Users can view their own transactions" ON public.loyalty_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert transactions" ON public.loyalty_transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage all transactions" ON public.loyalty_transactions FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for referral_tracking
CREATE POLICY "Users can view their own referrals" ON public.referral_tracking FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);
CREATE POLICY "System can insert referrals" ON public.referral_tracking FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage all referrals" ON public.referral_tracking FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Create indexes for performance
CREATE INDEX idx_loyalty_profiles_user_id ON public.loyalty_profiles(user_id);
CREATE INDEX idx_loyalty_profiles_referral_code ON public.loyalty_profiles(referral_code);
CREATE INDEX idx_user_missions_user_id ON public.user_missions(user_id);
CREATE INDEX idx_user_missions_status ON public.user_missions(status);
CREATE INDEX idx_user_rewards_user_id ON public.user_rewards(user_id);
CREATE INDEX idx_loyalty_transactions_user_id ON public.loyalty_transactions(user_id);
CREATE INDEX idx_referral_tracking_referrer_id ON public.referral_tracking(referrer_id);
CREATE INDEX idx_referral_tracking_code ON public.referral_tracking(referral_code);

-- Trigger for updated_at on loyalty_profiles
CREATE TRIGGER update_loyalty_profiles_updated_at
  BEFORE UPDATE ON public.loyalty_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on loyalty_missions
CREATE TRIGGER update_loyalty_missions_updated_at
  BEFORE UPDATE ON public.loyalty_missions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on loyalty_rewards
CREATE TRIGGER update_loyalty_rewards_updated_at
  BEFORE UPDATE ON public.loyalty_rewards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    code := 'BOX' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    SELECT EXISTS(SELECT 1 FROM loyalty_profiles WHERE referral_code = code) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN code;
END;
$$;

-- Trigger to auto-create loyalty profile when user is created
CREATE OR REPLACE FUNCTION public.handle_new_user_loyalty()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.loyalty_profiles (user_id, referral_code)
  VALUES (NEW.id, generate_referral_code());
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_loyalty
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_loyalty();

-- Insert initial loyalty levels
INSERT INTO public.loyalty_levels (level_name, min_points_required, benefits, color_theme, icon, display_order) VALUES
  ('bronze', 0, '{"discount": 0, "support": "standard", "features": ["Missions de base", "Points de fidélité"]}'::jsonb, '#CD7F32', '🥉', 1),
  ('silver', 1001, '{"discount": 5, "support": "standard", "features": ["Missions avancées", "Réduction 5%", "Bonus mensuels"]}'::jsonb, '#C0C0C0', '🥈', 2),
  ('gold', 3001, '{"discount": 10, "support": "priority", "features": ["Missions exclusives", "Réduction 10%", "Support prioritaire", "Accès VIP"]}'::jsonb, '#FFD700', '🥇', 3),
  ('platinum', 7501, '{"discount": 15, "support": "priority", "features": ["Toutes missions", "Réduction 15%", "Support 24/7", "Avantages exclusifs", "Concierge"]}'::jsonb, '#E5E4E2', '💎', 4);

-- Insert initial missions
INSERT INTO public.loyalty_missions (name, description, mission_type, points_reward, is_recurring, recurrence_period, requirements, is_active, priority) VALUES
  ('Bienvenue chez Box Africa', 'Complétez votre profil pour commencer votre aventure fidélité', 'profile_update', 50, false, 'once', '{"fields": ["display_name", "phone"]}'::jsonb, true, 100),
  ('Premier Paiement', 'Effectuez votre premier paiement de prime à temps', 'payment', 100, false, 'once', '{"on_time": true}'::jsonb, true, 90),
  ('Paiement Ponctuel', 'Payez votre prime avant la date d''échéance', 'payment', 50, true, 'monthly', '{"on_time": true}'::jsonb, true, 80),
  ('Téléchargez l''Application', 'Téléchargez notre application mobile', 'app_download', 30, false, 'once', '{}'::jsonb, true, 85),
  ('Partagez sur les Réseaux', 'Partagez Box Africa sur vos réseaux sociaux', 'social_share', 20, true, 'weekly', '{}'::jsonb, true, 40),
  ('Ambassadeur Box', 'Parrainez 3 amis qui souscrivent', 'referral', 150, false, 'once', '{"count": 3}'::jsonb, true, 70),
  ('Parrainage Simple', 'Parrainez un ami', 'referral', 100, true, 'monthly', '{"count": 1}'::jsonb, true, 60),
  ('Sans Sinistre 12 Mois', 'Passez 12 mois sans déclarer de sinistre', 'claim_free', 300, true, 'yearly', '{"months": 12}'::jsonb, true, 95),
  ('Expert Prévention', 'Répondez correctement au quiz de prévention', 'quiz', 30, true, 'monthly', '{"min_score": 80}'::jsonb, true, 50),
  ('Première Souscription', 'Souscrivez à votre premier contrat', 'subscription', 150, false, 'once', '{}'::jsonb, true, 100);

-- Insert initial rewards
INSERT INTO public.loyalty_rewards (name, description, reward_type, cost_in_points, required_level, reward_value, is_active, terms_conditions) VALUES
  ('Réduction 5% sur Prime', 'Bénéficiez de 5% de réduction sur votre prochaine prime', 'premium_reduction', 500, 'bronze', 5, true, 'Valable sur le prochain renouvellement'),
  ('Réduction 10% sur Prime', 'Bénéficiez de 10% de réduction sur votre prochaine prime', 'premium_reduction', 1000, 'silver', 10, true, 'Valable sur le prochain renouvellement'),
  ('Bon Mobile Money 2000 FCFA', 'Recevez 2000 FCFA de crédit mobile money', 'gift_card', 800, 'bronze', 2000, true, 'Crédit transféré sous 48h'),
  ('Bon Mobile Money 5000 FCFA', 'Recevez 5000 FCFA de crédit mobile money', 'gift_card', 1800, 'silver', 5000, true, 'Crédit transféré sous 48h'),
  ('Consultation Gratuite', 'Consultation personnalisée avec un expert', 'free_option', 1200, 'silver', 0, true, 'À utiliser dans les 3 mois'),
  ('Assistance 24/7 VIP', 'Service d''assistance prioritaire 24/7 pendant 6 mois', 'priority_service', 2000, 'gold', 0, true, 'Activation immédiate'),
  ('Option Protection Plus', 'Option supplémentaire gratuite pendant 1 an', 'free_option', 1500, 'gold', 0, true, 'Selon éligibilité du contrat'),
  ('Tirage au Sort Platinum', 'Participation au tirage mensuel (smartphone, tablette)', 'lottery_entry', 500, 'platinum', 0, true, 'Tirage le 1er de chaque mois');

-- Function to calculate level from points
CREATE OR REPLACE FUNCTION public.calculate_loyalty_level(points INTEGER)
RETURNS loyalty_level
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  new_level loyalty_level;
BEGIN
  IF points >= 7501 THEN
    new_level := 'platinum';
  ELSIF points >= 3001 THEN
    new_level := 'gold';
  ELSIF points >= 1001 THEN
    new_level := 'silver';
  ELSE
    new_level := 'bronze';
  END IF;
  RETURN new_level;
END;
$$;

-- Function to update loyalty profile after points change
CREATE OR REPLACE FUNCTION public.update_loyalty_level()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_level loyalty_level;
  next_level_points INTEGER;
  current_level_points INTEGER;
BEGIN
  -- Calculate new level
  new_level := calculate_loyalty_level(NEW.total_points);
  
  -- Get points thresholds
  SELECT min_points_required INTO current_level_points
  FROM loyalty_levels
  WHERE level_name = new_level;
  
  SELECT min_points_required INTO next_level_points
  FROM loyalty_levels
  WHERE display_order = (SELECT display_order + 1 FROM loyalty_levels WHERE level_name = new_level)
  LIMIT 1;
  
  -- If no next level, set to max
  IF next_level_points IS NULL THEN
    next_level_points := current_level_points;
  END IF;
  
  -- Update level and progress
  NEW.current_level := new_level;
  NEW.points_to_next_level := next_level_points - NEW.total_points;
  
  -- Calculate progress percentage
  IF next_level_points > current_level_points THEN
    NEW.level_progress := LEAST(100, GREATEST(0, 
      ((NEW.total_points - current_level_points)::NUMERIC / (next_level_points - current_level_points) * 100)::INTEGER
    ));
  ELSE
    NEW.level_progress := 100;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_loyalty_level_trigger
  BEFORE UPDATE OF total_points ON public.loyalty_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_loyalty_level();