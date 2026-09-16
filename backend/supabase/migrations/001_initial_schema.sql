-- ============================================================================
-- ORBITAL: Space Debris Collision Risk Estimator
-- Database Migration 001: Initial Schema & Row-Level Security
-- Target Database: Supabase PostgreSQL
-- Host Organization: Department of Space — ISRO
-- ============================================================================

-- 1. Profiles Table (operator / analyst profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    organization TEXT DEFAULT 'Department of Space — ISRO',
    role TEXT DEFAULT 'Flight Dynamics Officer',
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Satellites Table (primary monitored assets)
CREATE TABLE IF NOT EXISTS public.satellites (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    altitude_km DOUBLE PRECISION NOT NULL CHECK (altitude_km > 100 AND altitude_km < 40000),
    inclination_deg DOUBLE PRECISION NOT NULL CHECK (inclination_deg >= 0 AND inclination_deg <= 180),
    period_min DOUBLE PRECISION NOT NULL CHECK (period_min > 0),
    phase_deg DOUBLE PRECISION DEFAULT 0.0 CHECK (phase_deg >= 0 AND phase_deg < 360),
    raan_deg DOUBLE PRECISION DEFAULT 0.0 CHECK (raan_deg >= 0 AND raan_deg < 360),
    source TEXT DEFAULT 'ISRO Telemetry / Ephemeris',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Debris Objects Table (tracked space debris catalog)
CREATE TABLE IF NOT EXISTS public.debris_objects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    altitude_km DOUBLE PRECISION NOT NULL CHECK (altitude_km > 100 AND altitude_km < 40000),
    inclination_deg DOUBLE PRECISION NOT NULL CHECK (inclination_deg >= 0 AND inclination_deg <= 180),
    period_min DOUBLE PRECISION NOT NULL CHECK (period_min > 0),
    phase_deg DOUBLE PRECISION DEFAULT 0.0,
    raan_deg DOUBLE PRECISION DEFAULT 0.0,
    source TEXT DEFAULT 'Space-Track / USSPACECOM',
    rcs_size TEXT DEFAULT 'MEDIUM',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Datasets Table (collections of debris or simulation catalogs)
CREATE TABLE IF NOT EXISTS public.datasets (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    object_count INT DEFAULT 0,
    is_demo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Analyses Table (screening execution records)
CREATE TABLE IF NOT EXISTS public.analyses (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    satellite_id TEXT REFERENCES public.satellites(id) ON DELETE CASCADE,
    dataset_id TEXT REFERENCES public.datasets(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED')),
    objects_analyzed INT NOT NULL DEFAULT 0,
    potential_encounters INT NOT NULL DEFAULT 0,
    closest_approach_km DOUBLE PRECISION,
    high_risk_count INT DEFAULT 0,
    duration_hours DOUBLE PRECISION DEFAULT 24.0,
    timestep_seconds DOUBLE PRECISION DEFAULT 60.0,
    model_label TEXT DEFAULT 'SIMPLIFIED KEPLERIAN MODEL · APPROXIMATE RESULTS',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Encounters Table (computed conjunction events)
CREATE TABLE IF NOT EXISTS public.encounters (
    id TEXT PRIMARY KEY,
    analysis_id TEXT REFERENCES public.analyses(id) ON DELETE CASCADE,
    rank INT NOT NULL,
    satellite_id TEXT NOT NULL,
    satellite_name TEXT NOT NULL,
    debris_id TEXT NOT NULL,
    debris_name TEXT NOT NULL,
    min_distance_km DOUBLE PRECISION NOT NULL,
    tca_seconds DOUBLE PRECISION NOT NULL,
    tca_utc TEXT NOT NULL,
    relative_velocity_kms DOUBLE PRECISION NOT NULL,
    risk_level TEXT NOT NULL CHECK (risk_level IN ('CRITICAL', 'HIGH', 'MODERATE', 'LOW')),
    model TEXT DEFAULT 'Simplified Keplerian Propagation',
    trajectory_sample JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. AI Conversations Table
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    analysis_id TEXT REFERENCES public.analyses(id) ON DELETE SET NULL,
    title TEXT DEFAULT 'Orbital Conjunction Query',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. AI Messages Table
CREATE TABLE IF NOT EXISTS public.ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id TEXT REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    computed_facts JSONB,
    operational_interpretation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Row Level Security (RLS) Configuration
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.satellites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debris_objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

-- Read policies for public demo data
CREATE POLICY "Public read for demo debris" ON public.debris_objects FOR SELECT USING (true);
CREATE POLICY "Public read for satellites" ON public.satellites FOR SELECT USING (true);
CREATE POLICY "Public read for analyses" ON public.analyses FOR SELECT USING (true);
CREATE POLICY "Public read for encounters" ON public.encounters FOR SELECT USING (true);

-- Authenticated user policies
CREATE POLICY "Users can manage their own profile" ON public.profiles
    FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can manage own satellites" ON public.satellites
    FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can manage own analyses" ON public.analyses
    FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view and manage their AI conversations" ON public.ai_conversations
    FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view and manage AI messages" ON public.ai_messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.ai_conversations
            WHERE public.ai_conversations.id = public.ai_messages.conversation_id
            AND (public.ai_conversations.user_id = auth.uid() OR public.ai_conversations.user_id IS NULL)
        )
    );
