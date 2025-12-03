CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.7

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'broker',
    'customer'
);


--
-- Name: claim_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.claim_status AS ENUM (
    'Draft',
    'Submitted',
    'Reviewed',
    'Approved',
    'Rejected',
    'Closed'
);


--
-- Name: claim_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.claim_type AS ENUM (
    'Auto',
    'Habitation',
    'Santé'
);


--
-- Name: damage_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.damage_type AS ENUM (
    'Choc',
    'Bris de vitre',
    'Rayure',
    'Feu',
    'Inondation',
    'Vol',
    'Autre'
);


--
-- Name: deployment_channel; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.deployment_channel AS ENUM (
    'B2C',
    'B2B'
);


--
-- Name: form_category; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.form_category AS ENUM (
    'vie',
    'non-vie'
);


--
-- Name: lead_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.lead_status AS ENUM (
    'nouveau',
    'en_cours',
    'relance',
    'converti',
    'perdu'
);


--
-- Name: loyalty_level; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.loyalty_level AS ENUM (
    'bronze',
    'silver',
    'gold',
    'platinum'
);


--
-- Name: mission_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.mission_status AS ENUM (
    'available',
    'in_progress',
    'completed',
    'expired'
);


--
-- Name: mission_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.mission_type AS ENUM (
    'payment',
    'referral',
    'profile_update',
    'quiz',
    'claim_free',
    'social_share',
    'document_upload',
    'subscription',
    'renewal',
    'app_download',
    'survey'
);


--
-- Name: recurrence_period; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.recurrence_period AS ENUM (
    'daily',
    'weekly',
    'monthly',
    'yearly',
    'once'
);


--
-- Name: referral_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.referral_status AS ENUM (
    'pending',
    'completed',
    'rewarded'
);


--
-- Name: reward_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.reward_type AS ENUM (
    'discount',
    'gift_card',
    'premium_reduction',
    'free_option',
    'partner_voucher',
    'lottery_entry',
    'priority_service'
);


--
-- Name: transaction_source; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.transaction_source AS ENUM (
    'mission',
    'referral',
    'bonus',
    'admin',
    'reward'
);


--
-- Name: transaction_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.transaction_type AS ENUM (
    'earned',
    'spent',
    'expired',
    'adjusted'
);


--
-- Name: user_reward_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_reward_status AS ENUM (
    'pending',
    'active',
    'redeemed',
    'expired'
);


--
-- Name: calculate_loyalty_level(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_loyalty_level(points integer) RETURNS public.loyalty_level
    LANGUAGE plpgsql STABLE
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


--
-- Name: generate_referral_code(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_referral_code() RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: get_user_role(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_role(_user_id uuid) RETURNS public.app_role
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role
      WHEN 'admin' THEN 1
      WHEN 'broker' THEN 2
      WHEN 'customer' THEN 3
    END
  LIMIT 1
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, phone, display_name, avatar_url, provider)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.phone,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_app_meta_data->>'provider'
  );
  RETURN NEW;
END;
$$;


--
-- Name: handle_new_user_loyalty(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user_loyalty() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.loyalty_profiles (user_id, referral_code)
  VALUES (NEW.id, generate_referral_code());
  RETURN NEW;
END;
$$;


--
-- Name: handle_new_user_role(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user_role() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer');
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: update_loyalty_level(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_loyalty_level() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: broker_clients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.broker_clients (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    broker_id uuid NOT NULL,
    client_id uuid NOT NULL,
    assigned_at timestamp with time zone DEFAULT now() NOT NULL,
    assigned_by uuid,
    notes text
);


--
-- Name: chat_conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_conversations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid NOT NULL,
    role text NOT NULL,
    content text NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chat_messages_role_check CHECK ((role = ANY (ARRAY['user'::text, 'assistant'::text, 'system'::text])))
);


--
-- Name: claims; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.claims (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    policy_id text NOT NULL,
    claim_type public.claim_type NOT NULL,
    ocr_data jsonb,
    damages jsonb,
    photos text[],
    status public.claim_status DEFAULT 'Draft'::public.claim_status NOT NULL,
    cost_estimation numeric(12,2),
    ai_confidence double precision,
    description text,
    location text,
    incident_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    assigned_broker_id uuid,
    broker_notes text,
    reviewed_at timestamp with time zone
);


--
-- Name: competitive_analyses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.competitive_analyses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_by uuid NOT NULL,
    competitor_name text,
    document_type text NOT NULL,
    original_filename text NOT NULL,
    extracted_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    positioning_scores jsonb DEFAULT '{}'::jsonb NOT NULL,
    strengths jsonb DEFAULT '[]'::jsonb,
    weaknesses jsonb DEFAULT '[]'::jsonb,
    commercial_arguments jsonb DEFAULT '[]'::jsonb,
    recommendations jsonb DEFAULT '[]'::jsonb,
    comparison_table jsonb DEFAULT '{}'::jsonb,
    status text DEFAULT 'processing'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    source_urls text[],
    analysis_timestamp timestamp with time zone DEFAULT now(),
    parameters jsonb DEFAULT '{}'::jsonb,
    client_context text,
    company_strengths text
);


--
-- Name: damage_zones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.damage_zones (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    claim_id uuid NOT NULL,
    zone text NOT NULL,
    damage_type public.damage_type NOT NULL,
    image_url text,
    severity integer,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT damage_zones_severity_check CHECK (((severity >= 1) AND (severity <= 5)))
);


--
-- Name: form_deployments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.form_deployments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    form_template_id uuid NOT NULL,
    channel public.deployment_channel NOT NULL,
    is_active boolean DEFAULT false NOT NULL,
    deployed_by uuid,
    deployed_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: form_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.form_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    category public.form_category NOT NULL,
    product_type text NOT NULL,
    description text,
    is_active boolean DEFAULT false NOT NULL,
    target_channels jsonb DEFAULT '["B2C"]'::jsonb NOT NULL,
    steps jsonb DEFAULT '{}'::jsonb NOT NULL,
    premium_calculation jsonb,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: lead_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lead_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lead_id uuid NOT NULL,
    broker_id uuid NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    assigned_broker_id uuid,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text,
    phone text,
    whatsapp text,
    status public.lead_status DEFAULT 'nouveau'::public.lead_status NOT NULL,
    source text,
    product_interest text,
    notes text,
    last_contact_at timestamp with time zone,
    next_followup_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: loyalty_levels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loyalty_levels (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    level_name public.loyalty_level NOT NULL,
    min_points_required integer NOT NULL,
    benefits jsonb DEFAULT '{}'::jsonb NOT NULL,
    color_theme text NOT NULL,
    icon text,
    display_order integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: loyalty_missions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loyalty_missions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    mission_type public.mission_type NOT NULL,
    points_reward integer NOT NULL,
    is_recurring boolean DEFAULT false NOT NULL,
    recurrence_period public.recurrence_period DEFAULT 'once'::public.recurrence_period NOT NULL,
    requirements jsonb DEFAULT '{}'::jsonb NOT NULL,
    badge_reward jsonb,
    is_active boolean DEFAULT true NOT NULL,
    target_audience jsonb DEFAULT '{}'::jsonb NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: loyalty_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loyalty_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    total_points integer DEFAULT 0 NOT NULL,
    current_level public.loyalty_level DEFAULT 'bronze'::public.loyalty_level NOT NULL,
    level_progress integer DEFAULT 0 NOT NULL,
    points_to_next_level integer DEFAULT 1000 NOT NULL,
    badges_earned jsonb DEFAULT '[]'::jsonb NOT NULL,
    lifetime_points integer DEFAULT 0 NOT NULL,
    referral_count integer DEFAULT 0 NOT NULL,
    referral_code text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT loyalty_profiles_level_progress_check CHECK (((level_progress >= 0) AND (level_progress <= 100)))
);


--
-- Name: loyalty_rewards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loyalty_rewards (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    reward_type public.reward_type NOT NULL,
    cost_in_points integer NOT NULL,
    required_level public.loyalty_level DEFAULT 'bronze'::public.loyalty_level NOT NULL,
    reward_value numeric,
    partner_info jsonb,
    stock_available integer,
    is_active boolean DEFAULT true NOT NULL,
    expiry_date timestamp with time zone,
    terms_conditions text,
    image_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: loyalty_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loyalty_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    transaction_type public.transaction_type NOT NULL,
    points_amount integer NOT NULL,
    source_type public.transaction_source NOT NULL,
    source_id uuid,
    description text NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    category text NOT NULL,
    base_premium numeric NOT NULL,
    description text,
    coverages jsonb NOT NULL,
    terms text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text,
    phone text,
    display_name text,
    avatar_url text,
    provider text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: referral_tracking; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.referral_tracking (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    referrer_id uuid NOT NULL,
    referred_user_id uuid,
    referral_code text NOT NULL,
    status public.referral_status DEFAULT 'pending'::public.referral_status NOT NULL,
    reward_earned integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone
);


--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    product_id uuid NOT NULL,
    policy_number text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    monthly_premium numeric NOT NULL,
    start_date timestamp with time zone DEFAULT now() NOT NULL,
    end_date timestamp with time zone NOT NULL,
    selected_coverages jsonb,
    payment_method text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    assigned_broker_id uuid,
    CONSTRAINT subscriptions_status_check CHECK ((status = ANY (ARRAY['active'::text, 'expired'::text, 'cancelled'::text, 'pending'::text])))
);


--
-- Name: user_attributes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_attributes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    age_range text,
    family_status text,
    occupation_category text,
    location text,
    income_range text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_missions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_missions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    mission_id uuid NOT NULL,
    status public.mission_status DEFAULT 'available'::public.mission_status NOT NULL,
    progress integer DEFAULT 0 NOT NULL,
    completion_data jsonb,
    assigned_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone,
    expires_at timestamp with time zone,
    points_earned integer,
    CONSTRAINT user_missions_progress_check CHECK (((progress >= 0) AND (progress <= 100)))
);


--
-- Name: user_rewards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_rewards (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    reward_id uuid NOT NULL,
    claimed_at timestamp with time zone DEFAULT now() NOT NULL,
    redeemed_at timestamp with time zone,
    expires_at timestamp with time zone,
    status public.user_reward_status DEFAULT 'pending'::public.user_reward_status NOT NULL,
    redemption_code text NOT NULL,
    redemption_data jsonb
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: broker_clients broker_clients_broker_id_client_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.broker_clients
    ADD CONSTRAINT broker_clients_broker_id_client_id_key UNIQUE (broker_id, client_id);


--
-- Name: broker_clients broker_clients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.broker_clients
    ADD CONSTRAINT broker_clients_pkey PRIMARY KEY (id);


--
-- Name: chat_conversations chat_conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_conversations
    ADD CONSTRAINT chat_conversations_pkey PRIMARY KEY (id);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: claims claims_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.claims
    ADD CONSTRAINT claims_pkey PRIMARY KEY (id);


--
-- Name: competitive_analyses competitive_analyses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.competitive_analyses
    ADD CONSTRAINT competitive_analyses_pkey PRIMARY KEY (id);


--
-- Name: damage_zones damage_zones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.damage_zones
    ADD CONSTRAINT damage_zones_pkey PRIMARY KEY (id);


--
-- Name: form_deployments form_deployments_form_template_id_channel_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_deployments
    ADD CONSTRAINT form_deployments_form_template_id_channel_key UNIQUE (form_template_id, channel);


--
-- Name: form_deployments form_deployments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_deployments
    ADD CONSTRAINT form_deployments_pkey PRIMARY KEY (id);


--
-- Name: form_templates form_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_templates
    ADD CONSTRAINT form_templates_pkey PRIMARY KEY (id);


--
-- Name: lead_notes lead_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_notes
    ADD CONSTRAINT lead_notes_pkey PRIMARY KEY (id);


--
-- Name: leads leads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);


--
-- Name: loyalty_levels loyalty_levels_level_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loyalty_levels
    ADD CONSTRAINT loyalty_levels_level_name_key UNIQUE (level_name);


--
-- Name: loyalty_levels loyalty_levels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loyalty_levels
    ADD CONSTRAINT loyalty_levels_pkey PRIMARY KEY (id);


--
-- Name: loyalty_missions loyalty_missions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loyalty_missions
    ADD CONSTRAINT loyalty_missions_pkey PRIMARY KEY (id);


--
-- Name: loyalty_profiles loyalty_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loyalty_profiles
    ADD CONSTRAINT loyalty_profiles_pkey PRIMARY KEY (id);


--
-- Name: loyalty_profiles loyalty_profiles_referral_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loyalty_profiles
    ADD CONSTRAINT loyalty_profiles_referral_code_key UNIQUE (referral_code);


--
-- Name: loyalty_profiles loyalty_profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loyalty_profiles
    ADD CONSTRAINT loyalty_profiles_user_id_key UNIQUE (user_id);


--
-- Name: loyalty_rewards loyalty_rewards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loyalty_rewards
    ADD CONSTRAINT loyalty_rewards_pkey PRIMARY KEY (id);


--
-- Name: loyalty_transactions loyalty_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loyalty_transactions
    ADD CONSTRAINT loyalty_transactions_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: referral_tracking referral_tracking_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referral_tracking
    ADD CONSTRAINT referral_tracking_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_policy_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_policy_number_key UNIQUE (policy_number);


--
-- Name: user_attributes user_attributes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_attributes
    ADD CONSTRAINT user_attributes_pkey PRIMARY KEY (id);


--
-- Name: user_attributes user_attributes_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_attributes
    ADD CONSTRAINT user_attributes_user_id_key UNIQUE (user_id);


--
-- Name: user_missions user_missions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_missions
    ADD CONSTRAINT user_missions_pkey PRIMARY KEY (id);


--
-- Name: user_missions user_missions_user_id_mission_id_assigned_at_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_missions
    ADD CONSTRAINT user_missions_user_id_mission_id_assigned_at_key UNIQUE (user_id, mission_id, assigned_at);


--
-- Name: user_rewards user_rewards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_rewards
    ADD CONSTRAINT user_rewards_pkey PRIMARY KEY (id);


--
-- Name: user_rewards user_rewards_redemption_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_rewards
    ADD CONSTRAINT user_rewards_redemption_code_key UNIQUE (redemption_code);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: idx_broker_clients_broker_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_broker_clients_broker_id ON public.broker_clients USING btree (broker_id);


--
-- Name: idx_broker_clients_client_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_broker_clients_client_id ON public.broker_clients USING btree (client_id);


--
-- Name: idx_chat_conversations_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_conversations_user_id ON public.chat_conversations USING btree (user_id);


--
-- Name: idx_chat_messages_conversation_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_messages_conversation_id ON public.chat_messages USING btree (conversation_id);


--
-- Name: idx_claims_assigned_broker; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_claims_assigned_broker ON public.claims USING btree (assigned_broker_id);


--
-- Name: idx_claims_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_claims_status ON public.claims USING btree (status);


--
-- Name: idx_claims_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_claims_user_id ON public.claims USING btree (user_id);


--
-- Name: idx_damage_zones_claim_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_damage_zones_claim_id ON public.damage_zones USING btree (claim_id);


--
-- Name: idx_loyalty_profiles_referral_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loyalty_profiles_referral_code ON public.loyalty_profiles USING btree (referral_code);


--
-- Name: idx_loyalty_profiles_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loyalty_profiles_user_id ON public.loyalty_profiles USING btree (user_id);


--
-- Name: idx_loyalty_transactions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loyalty_transactions_user_id ON public.loyalty_transactions USING btree (user_id);


--
-- Name: idx_referral_tracking_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_referral_tracking_code ON public.referral_tracking USING btree (referral_code);


--
-- Name: idx_referral_tracking_referrer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_referral_tracking_referrer_id ON public.referral_tracking USING btree (referrer_id);


--
-- Name: idx_subscriptions_assigned_broker; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscriptions_assigned_broker ON public.subscriptions USING btree (assigned_broker_id);


--
-- Name: idx_subscriptions_product_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscriptions_product_id ON public.subscriptions USING btree (product_id);


--
-- Name: idx_subscriptions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscriptions_status ON public.subscriptions USING btree (status);


--
-- Name: idx_subscriptions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions USING btree (user_id);


--
-- Name: idx_user_missions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_missions_status ON public.user_missions USING btree (status);


--
-- Name: idx_user_missions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_missions_user_id ON public.user_missions USING btree (user_id);


--
-- Name: idx_user_rewards_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_rewards_user_id ON public.user_rewards USING btree (user_id);


--
-- Name: chat_conversations update_chat_conversations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_chat_conversations_updated_at BEFORE UPDATE ON public.chat_conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: claims update_claims_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_claims_updated_at BEFORE UPDATE ON public.claims FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: competitive_analyses update_competitive_analyses_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_competitive_analyses_updated_at BEFORE UPDATE ON public.competitive_analyses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: form_templates update_form_templates_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_form_templates_updated_at BEFORE UPDATE ON public.form_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: leads update_leads_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: loyalty_profiles update_loyalty_level_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_loyalty_level_trigger BEFORE UPDATE OF total_points ON public.loyalty_profiles FOR EACH ROW EXECUTE FUNCTION public.update_loyalty_level();


--
-- Name: loyalty_missions update_loyalty_missions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_loyalty_missions_updated_at BEFORE UPDATE ON public.loyalty_missions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: loyalty_profiles update_loyalty_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_loyalty_profiles_updated_at BEFORE UPDATE ON public.loyalty_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: loyalty_rewards update_loyalty_rewards_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_loyalty_rewards_updated_at BEFORE UPDATE ON public.loyalty_rewards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: products update_products_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: subscriptions update_subscriptions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_attributes update_user_attributes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_attributes_updated_at BEFORE UPDATE ON public.user_attributes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: broker_clients broker_clients_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.broker_clients
    ADD CONSTRAINT broker_clients_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.profiles(id);


--
-- Name: broker_clients broker_clients_broker_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.broker_clients
    ADD CONSTRAINT broker_clients_broker_id_fkey FOREIGN KEY (broker_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: broker_clients broker_clients_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.broker_clients
    ADD CONSTRAINT broker_clients_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: chat_conversations chat_conversations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_conversations
    ADD CONSTRAINT chat_conversations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: chat_messages chat_messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.chat_conversations(id) ON DELETE CASCADE;


--
-- Name: claims claims_assigned_broker_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.claims
    ADD CONSTRAINT claims_assigned_broker_id_fkey FOREIGN KEY (assigned_broker_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: claims claims_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.claims
    ADD CONSTRAINT claims_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: damage_zones damage_zones_claim_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.damage_zones
    ADD CONSTRAINT damage_zones_claim_id_fkey FOREIGN KEY (claim_id) REFERENCES public.claims(id) ON DELETE CASCADE;


--
-- Name: form_deployments form_deployments_deployed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_deployments
    ADD CONSTRAINT form_deployments_deployed_by_fkey FOREIGN KEY (deployed_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: form_deployments form_deployments_form_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_deployments
    ADD CONSTRAINT form_deployments_form_template_id_fkey FOREIGN KEY (form_template_id) REFERENCES public.form_templates(id) ON DELETE CASCADE;


--
-- Name: form_templates form_templates_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_templates
    ADD CONSTRAINT form_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: lead_notes lead_notes_broker_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_notes
    ADD CONSTRAINT lead_notes_broker_id_fkey FOREIGN KEY (broker_id) REFERENCES public.profiles(id);


--
-- Name: lead_notes lead_notes_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_notes
    ADD CONSTRAINT lead_notes_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- Name: leads leads_assigned_broker_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_assigned_broker_id_fkey FOREIGN KEY (assigned_broker_id) REFERENCES public.profiles(id);


--
-- Name: loyalty_profiles loyalty_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loyalty_profiles
    ADD CONSTRAINT loyalty_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: loyalty_transactions loyalty_transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loyalty_transactions
    ADD CONSTRAINT loyalty_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: referral_tracking referral_tracking_referred_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referral_tracking
    ADD CONSTRAINT referral_tracking_referred_user_id_fkey FOREIGN KEY (referred_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: referral_tracking referral_tracking_referrer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referral_tracking
    ADD CONSTRAINT referral_tracking_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: subscriptions subscriptions_assigned_broker_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_assigned_broker_id_fkey FOREIGN KEY (assigned_broker_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: subscriptions subscriptions_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT;


--
-- Name: subscriptions subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: user_attributes user_attributes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_attributes
    ADD CONSTRAINT user_attributes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_missions user_missions_mission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_missions
    ADD CONSTRAINT user_missions_mission_id_fkey FOREIGN KEY (mission_id) REFERENCES public.loyalty_missions(id) ON DELETE CASCADE;


--
-- Name: user_missions user_missions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_missions
    ADD CONSTRAINT user_missions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_rewards user_rewards_reward_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_rewards
    ADD CONSTRAINT user_rewards_reward_id_fkey FOREIGN KEY (reward_id) REFERENCES public.loyalty_rewards(id) ON DELETE CASCADE;


--
-- Name: user_rewards user_rewards_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_rewards
    ADD CONSTRAINT user_rewards_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: claims Admins can delete all claims; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete all claims" ON public.claims FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: damage_zones Admins can delete all damage zones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete all damage zones" ON public.damage_zones FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profiles Admins can delete all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete all profiles" ON public.profiles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: subscriptions Admins can delete all subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete all subscriptions" ON public.subscriptions FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: broker_clients Admins can delete broker-client relationships; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete broker-client relationships" ON public.broker_clients FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: competitive_analyses Admins can delete competitive analyses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete competitive analyses" ON public.competitive_analyses FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can delete user roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete user roles" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: claims Admins can insert all claims; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert all claims" ON public.claims FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: damage_zones Admins can insert all damage zones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert all damage zones" ON public.damage_zones FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: subscriptions Admins can insert all subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert all subscriptions" ON public.subscriptions FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: broker_clients Admins can insert broker-client relationships; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert broker-client relationships" ON public.broker_clients FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: competitive_analyses Admins can insert competitive analyses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert competitive analyses" ON public.competitive_analyses FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can insert user roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert user roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: form_deployments Admins can manage all form deployments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all form deployments" ON public.form_deployments USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: form_templates Admins can manage all form templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all form templates" ON public.form_templates USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: leads Admins can manage all leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all leads" ON public.leads USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::public.app_role)))));


--
-- Name: loyalty_profiles Admins can manage all loyalty profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all loyalty profiles" ON public.loyalty_profiles USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: loyalty_missions Admins can manage all missions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all missions" ON public.loyalty_missions USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: products Admins can manage all products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all products" ON public.products USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: referral_tracking Admins can manage all referrals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all referrals" ON public.referral_tracking USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: loyalty_rewards Admins can manage all rewards; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all rewards" ON public.loyalty_rewards USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: loyalty_transactions Admins can manage all transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all transactions" ON public.loyalty_transactions USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_missions Admins can manage all user missions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all user missions" ON public.user_missions USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_rewards Admins can manage all user rewards; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all user rewards" ON public.user_rewards USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: loyalty_levels Admins can manage loyalty levels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage loyalty levels" ON public.loyalty_levels USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: claims Admins can update all claims; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update all claims" ON public.claims FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: damage_zones Admins can update all damage zones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update all damage zones" ON public.damage_zones FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profiles Admins can update all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: subscriptions Admins can update all subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update all subscriptions" ON public.subscriptions FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: broker_clients Admins can update broker-client relationships; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update broker-client relationships" ON public.broker_clients FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: competitive_analyses Admins can update competitive analyses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update competitive analyses" ON public.competitive_analyses FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can update user roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update user roles" ON public.user_roles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: broker_clients Admins can view all broker-client relationships; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all broker-client relationships" ON public.broker_clients FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: claims Admins can view all claims; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all claims" ON public.claims FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: competitive_analyses Admins can view all competitive analyses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all competitive analyses" ON public.competitive_analyses FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: damage_zones Admins can view all damage zones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all damage zones" ON public.damage_zones FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: leads Admins can view all leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all leads" ON public.leads FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::public.app_role)))));


--
-- Name: loyalty_profiles Admins can view all loyalty profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all loyalty profiles" ON public.loyalty_profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profiles Admins can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: subscriptions Admins can view all subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all subscriptions" ON public.subscriptions FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can view all user roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all user roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: products Anyone can view active products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view active products" ON public.products FOR SELECT USING ((is_active = true));


--
-- Name: loyalty_levels Anyone can view loyalty levels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view loyalty levels" ON public.loyalty_levels FOR SELECT USING (true);


--
-- Name: form_deployments Authenticated users can view active deployments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view active deployments" ON public.form_deployments FOR SELECT USING ((is_active = true));


--
-- Name: form_templates Authenticated users can view active form templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view active form templates" ON public.form_templates FOR SELECT USING ((is_active = true));


--
-- Name: loyalty_missions Authenticated users can view active missions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view active missions" ON public.loyalty_missions FOR SELECT USING ((is_active = true));


--
-- Name: loyalty_rewards Authenticated users can view active rewards; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view active rewards" ON public.loyalty_rewards FOR SELECT USING ((is_active = true));


--
-- Name: lead_notes Brokers can add notes to their leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Brokers can add notes to their leads" ON public.lead_notes FOR INSERT WITH CHECK ((auth.uid() = broker_id));


--
-- Name: competitive_analyses Brokers can insert competitive analyses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Brokers can insert competitive analyses" ON public.competitive_analyses FOR INSERT WITH CHECK ((public.has_role(auth.uid(), 'broker'::public.app_role) AND (auth.uid() = created_by)));


--
-- Name: leads Brokers can insert leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Brokers can insert leads" ON public.leads FOR INSERT WITH CHECK ((auth.uid() = assigned_broker_id));


--
-- Name: claims Brokers can update their assigned claims; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Brokers can update their assigned claims" ON public.claims FOR UPDATE USING ((public.has_role(auth.uid(), 'broker'::public.app_role) AND (assigned_broker_id = auth.uid())));


--
-- Name: leads Brokers can update their assigned leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Brokers can update their assigned leads" ON public.leads FOR UPDATE USING ((auth.uid() = assigned_broker_id));


--
-- Name: subscriptions Brokers can update their assigned subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Brokers can update their assigned subscriptions" ON public.subscriptions FOR UPDATE USING ((public.has_role(auth.uid(), 'broker'::public.app_role) AND (assigned_broker_id = auth.uid())));


--
-- Name: competitive_analyses Brokers can update their competitive analyses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Brokers can update their competitive analyses" ON public.competitive_analyses FOR UPDATE USING ((public.has_role(auth.uid(), 'broker'::public.app_role) AND (auth.uid() = created_by)));


--
-- Name: competitive_analyses Brokers can view competitive analyses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Brokers can view competitive analyses" ON public.competitive_analyses FOR SELECT USING (public.has_role(auth.uid(), 'broker'::public.app_role));


--
-- Name: lead_notes Brokers can view notes on their leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Brokers can view notes on their leads" ON public.lead_notes FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.leads
  WHERE ((leads.id = lead_notes.lead_id) AND (leads.assigned_broker_id = auth.uid())))));


--
-- Name: profiles Brokers can view profiles of users with assigned claims; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Brokers can view profiles of users with assigned claims" ON public.profiles FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.claims
  WHERE ((claims.user_id = profiles.id) AND (claims.assigned_broker_id = auth.uid()) AND public.has_role(auth.uid(), 'broker'::public.app_role)))));


--
-- Name: claims Brokers can view their assigned claims; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Brokers can view their assigned claims" ON public.claims FOR SELECT USING ((public.has_role(auth.uid(), 'broker'::public.app_role) AND (assigned_broker_id = auth.uid())));


--
-- Name: broker_clients Brokers can view their assigned clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Brokers can view their assigned clients" ON public.broker_clients FOR SELECT USING ((public.has_role(auth.uid(), 'broker'::public.app_role) AND (broker_id = auth.uid())));


--
-- Name: profiles Brokers can view their assigned clients profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Brokers can view their assigned clients profiles" ON public.profiles FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.broker_clients
  WHERE ((broker_clients.client_id = profiles.id) AND (broker_clients.broker_id = auth.uid()) AND public.has_role(auth.uid(), 'broker'::public.app_role)))));


--
-- Name: leads Brokers can view their assigned leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Brokers can view their assigned leads" ON public.leads FOR SELECT USING ((auth.uid() = assigned_broker_id));


--
-- Name: subscriptions Brokers can view their assigned subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Brokers can view their assigned subscriptions" ON public.subscriptions FOR SELECT USING ((public.has_role(auth.uid(), 'broker'::public.app_role) AND (assigned_broker_id = auth.uid())));


--
-- Name: broker_clients Clients can view their assigned broker; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clients can view their assigned broker" ON public.broker_clients FOR SELECT USING ((public.has_role(auth.uid(), 'customer'::public.app_role) AND (client_id = auth.uid())));


--
-- Name: loyalty_profiles System can insert loyalty profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert loyalty profiles" ON public.loyalty_profiles FOR INSERT WITH CHECK (true);


--
-- Name: referral_tracking System can insert referrals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert referrals" ON public.referral_tracking FOR INSERT WITH CHECK (true);


--
-- Name: loyalty_transactions System can insert transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert transactions" ON public.loyalty_transactions FOR INSERT WITH CHECK (true);


--
-- Name: user_missions System can insert user missions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert user missions" ON public.user_missions FOR INSERT WITH CHECK (true);


--
-- Name: damage_zones Users can create damage zones for their claims; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create damage zones for their claims" ON public.damage_zones FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.claims
  WHERE ((claims.id = damage_zones.claim_id) AND ((claims.user_id)::text = (auth.uid())::text)))));


--
-- Name: chat_messages Users can create messages in their conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create messages in their conversations" ON public.chat_messages FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.chat_conversations
  WHERE ((chat_conversations.id = chat_messages.conversation_id) AND (chat_conversations.user_id = auth.uid())))));


--
-- Name: claims Users can create their own claims; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own claims" ON public.claims FOR INSERT WITH CHECK (((auth.uid())::text = (user_id)::text));


--
-- Name: chat_conversations Users can create their own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own conversations" ON public.chat_conversations FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: subscriptions Users can create their own subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own subscriptions" ON public.subscriptions FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: damage_zones Users can delete damage zones for their claims; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete damage zones for their claims" ON public.damage_zones FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.claims
  WHERE ((claims.id = damage_zones.claim_id) AND ((claims.user_id)::text = (auth.uid())::text)))));


--
-- Name: chat_conversations Users can delete their own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own conversations" ON public.chat_conversations FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: claims Users can delete their own draft claims; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own draft claims" ON public.claims FOR DELETE USING ((((auth.uid())::text = (user_id)::text) AND (status = 'Draft'::public.claim_status)));


--
-- Name: user_attributes Users can insert their own attributes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own attributes" ON public.user_attributes FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: user_rewards Users can insert their own rewards; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own rewards" ON public.user_rewards FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: damage_zones Users can update damage zones for their claims; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update damage zones for their claims" ON public.damage_zones FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.claims
  WHERE ((claims.id = damage_zones.claim_id) AND ((claims.user_id)::text = (auth.uid())::text)))));


--
-- Name: user_attributes Users can update their own attributes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own attributes" ON public.user_attributes FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: claims Users can update their own claims; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own claims" ON public.claims FOR UPDATE USING (((auth.uid())::text = (user_id)::text));


--
-- Name: chat_conversations Users can update their own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own conversations" ON public.chat_conversations FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: loyalty_profiles Users can update their own loyalty profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own loyalty profile" ON public.loyalty_profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: user_missions Users can update their own missions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own missions" ON public.user_missions FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: subscriptions Users can update their own subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own subscriptions" ON public.subscriptions FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: damage_zones Users can view damage zones for their claims; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view damage zones for their claims" ON public.damage_zones FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.claims
  WHERE ((claims.id = damage_zones.claim_id) AND ((claims.user_id)::text = (auth.uid())::text)))));


--
-- Name: chat_messages Users can view messages from their conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view messages from their conversations" ON public.chat_messages FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.chat_conversations
  WHERE ((chat_conversations.id = chat_messages.conversation_id) AND (chat_conversations.user_id = auth.uid())))));


--
-- Name: user_attributes Users can view their own attributes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own attributes" ON public.user_attributes FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: claims Users can view their own claims; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own claims" ON public.claims FOR SELECT USING (((auth.uid())::text = (user_id)::text));


--
-- Name: chat_conversations Users can view their own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own conversations" ON public.chat_conversations FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: loyalty_profiles Users can view their own loyalty profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own loyalty profile" ON public.loyalty_profiles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_missions Users can view their own missions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own missions" ON public.user_missions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: referral_tracking Users can view their own referrals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own referrals" ON public.referral_tracking FOR SELECT USING (((auth.uid() = referrer_id) OR (auth.uid() = referred_user_id)));


--
-- Name: user_rewards Users can view their own rewards; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own rewards" ON public.user_rewards FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_roles Users can view their own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: subscriptions Users can view their own subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own subscriptions" ON public.subscriptions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: loyalty_transactions Users can view their own transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own transactions" ON public.loyalty_transactions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: broker_clients; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.broker_clients ENABLE ROW LEVEL SECURITY;

--
-- Name: chat_conversations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

--
-- Name: chat_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: claims; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;

--
-- Name: competitive_analyses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.competitive_analyses ENABLE ROW LEVEL SECURITY;

--
-- Name: damage_zones; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.damage_zones ENABLE ROW LEVEL SECURITY;

--
-- Name: form_deployments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.form_deployments ENABLE ROW LEVEL SECURITY;

--
-- Name: form_templates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.form_templates ENABLE ROW LEVEL SECURITY;

--
-- Name: lead_notes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;

--
-- Name: leads; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

--
-- Name: loyalty_levels; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loyalty_levels ENABLE ROW LEVEL SECURITY;

--
-- Name: loyalty_missions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loyalty_missions ENABLE ROW LEVEL SECURITY;

--
-- Name: loyalty_profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loyalty_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: loyalty_rewards; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loyalty_rewards ENABLE ROW LEVEL SECURITY;

--
-- Name: loyalty_transactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

--
-- Name: products; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: referral_tracking; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.referral_tracking ENABLE ROW LEVEL SECURITY;

--
-- Name: subscriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: user_attributes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_attributes ENABLE ROW LEVEL SECURITY;

--
-- Name: user_missions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_missions ENABLE ROW LEVEL SECURITY;

--
-- Name: user_rewards; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


