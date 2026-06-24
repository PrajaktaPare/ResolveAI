-- ResolveAI Hackathon Migration Script
-- Run this in your Supabase SQL Editor to upgrade the schema.

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 1. Rename existing users table to profiles if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') AND 
     NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
      ALTER TABLE public.users RENAME TO profiles;
      ALTER INDEX IF EXISTS public.users_pkey RENAME TO profiles_pkey;
      ALTER INDEX IF EXISTS public.users_email_key RENAME TO profiles_email_key;
  END IF;
END $$;

-- Ensure profiles table exists with all required columns
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,
  role VARCHAR(20) DEFAULT 'citizen' CHECK (role IN ('citizen', 'moderator', 'admin')),
  reputation_score INTEGER DEFAULT 0,
  bio TEXT,
  location VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ensure RLS is active on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Re-create basic policies for profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 2. Modify issues table
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS canonical_issue_id UUID REFERENCES public.issues(id) ON DELETE SET NULL;

-- 3. Create issue_media table
CREATE TABLE IF NOT EXISTS public.issue_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  media_type VARCHAR(50) NOT NULL,
  public_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_issue_media_issue_id ON public.issue_media(issue_id);
ALTER TABLE public.issue_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Issue media is viewable by everyone" ON public.issue_media;
CREATE POLICY "Issue media is viewable by everyone" ON public.issue_media
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert issue media" ON public.issue_media;
CREATE POLICY "Authenticated users can insert issue media" ON public.issue_media
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 4. Create ai_insights table
CREATE TABLE IF NOT EXISTS public.ai_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  category VARCHAR(50),
  severity INTEGER CHECK (severity >= 0 AND severity <= 100),
  confidence DECIMAL(5,2),
  summary TEXT,
  impact TEXT,
  suggested_resolution TEXT,
  recommended_authority VARCHAR(255),
  recommended_action TEXT,
  estimated_urgency VARCHAR(50),
  mitigation_suggestions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_insights_issue_id ON public.ai_insights(issue_id);
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "AI insights are viewable by everyone" ON public.ai_insights;
CREATE POLICY "AI insights are viewable by everyone" ON public.ai_insights
  FOR SELECT USING (true);

-- 5. Create issue_verifications table
CREATE TABLE IF NOT EXISTS public.issue_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type VARCHAR(30) NOT NULL CHECK (type IN ('verify', 'support', 'duplicate', 'reject')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(issue_id, user_id, type)
);

CREATE INDEX IF NOT EXISTS idx_verifications_issue_id ON public.issue_verifications(issue_id);
CREATE INDEX IF NOT EXISTS idx_verifications_user_id ON public.issue_verifications(user_id);
ALTER TABLE public.issue_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Verifications are viewable by everyone" ON public.issue_verifications;
CREATE POLICY "Verifications are viewable by everyone" ON public.issue_verifications
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can verify" ON public.issue_verifications;
CREATE POLICY "Authenticated users can verify" ON public.issue_verifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. Trigger to automatically sync auth.users to public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, reputation_score)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'citizen',
    0
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Trigger to auto-update reputation_score on verifications
CREATE OR REPLACE FUNCTION public.update_user_reputation()
RETURNS TRIGGER AS $$
DECLARE
  issue_owner_id UUID;
  score_delta INTEGER := 0;
BEGIN
  -- Find the owner of the issue
  SELECT user_id INTO issue_owner_id FROM public.issues WHERE id = NEW.issue_id;
  
  IF issue_owner_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Determine score adjustments
  IF NEW.type = 'verify' THEN
    score_delta := 5;
  ELSIF NEW.type = 'support' THEN
    score_delta := 2;
  ELSIF NEW.type = 'duplicate' THEN
    score_delta := -2;
  ELSIF NEW.type = 'reject' THEN
    score_delta := -5;
  END IF;

  -- Apply delta to the creator's reputation score
  UPDATE public.profiles
  SET reputation_score = GREATEST(0, reputation_score + score_delta)
  WHERE id = issue_owner_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_user_reputation ON public.issue_verifications;
CREATE TRIGGER trg_update_user_reputation
  AFTER INSERT ON public.issue_verifications
  FOR EACH ROW EXECUTE FUNCTION public.update_user_reputation();

-- 8. Enable profiles trigger for timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- RPC Helper Function
-- Increments upvote count on issues and boosts priority score value.
CREATE OR REPLACE FUNCTION public.increment_upvotes(issue_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.issues
  SET upvotes = upvotes + 1,
      priority = LEAST(100, priority + 2)
  WHERE id = issue_id;
END;
$$ LANGUAGE plpgsql;


-- RPC helper for duplicate detection within a radius
CREATE OR REPLACE FUNCTION public.find_nearby_issues(lat double precision, lng double precision, max_dist_meters double precision)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  description TEXT,
  category VARCHAR,
  status VARCHAR,
  distance double precision
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id, 
    i.title, 
    i.description, 
    i.category, 
    i.status,
    ST_Distance(i.location_geom, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography) as distance
  FROM public.issues i
  WHERE ST_DWithin(i.location_geom, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography, max_dist_meters)
  ORDER BY distance ASC;
END;
$$ LANGUAGE plpgsql;


DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Supabase Realtime replication for dynamic updates
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.issues;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.issue_verifications;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN OTHERS THEN
  -- publication configuration is handled via Supabase dashboard in some environments
  RAISE NOTICE 'publication tables configuration skipped';
END $$;

