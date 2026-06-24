-- ResolveAI Database Schema
-- Run this script against your Supabase PostgreSQL database to initialize tables, policies, views, functions, and triggers.

-- =========================================================================
-- EXTENSIONS CONFIGURATION
-- =========================================================================

-- Enable uuid-ossp to support generating random unique keys (UUIDs)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable postgis extension to support spatial location objects (geography, geometry)
CREATE EXTENSION IF NOT EXISTS "postgis";

-- =========================================================================
-- TABLES DEFINITIONS & SECURITY POLICIES
-- =========================================================================

-- Users Profile Table
-- Tracks custom citizen profile parameters and role metadata.
-- Inherits authentication keys from Supabase's internal auth.users table.
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,
  role VARCHAR(20) DEFAULT 'citizen' CHECK (role IN ('citizen', 'moderator', 'admin')),
  bio TEXT,
  location VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row-Level Security (RLS) to enforce authorization constraints
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow users to inspect only their own profile details
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Allow users to modify only their own profile details
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);


-- Civic Issues Table
-- Stores geolocated issue tickets reported by users.
CREATE TABLE IF NOT EXISTS public.issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL CHECK (category IN ('pothole', 'garbage', 'water_leakage', 'broken_streetlight', 'open_manhole', 'road_damage', 'public_infrastructure_damage', 'other')),
  status VARCHAR(30) DEFAULT 'reported' CHECK (status IN ('reported', 'verified', 'prioritized', 'assigned', 'in_progress', 'resolved', 'rejected', 'duplicate')),
  risk_level VARCHAR(20) DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  priority INTEGER DEFAULT 50 CHECK (priority >= 0 AND priority <= 100),
  location VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  location_geom GEOGRAPHY(POINT, 4326), -- PostGIS Geography Point matching (lon, lat) under WGS84 projection
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  resolution_notes TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Speed up filtering queries using indexes
CREATE INDEX idx_issues_category ON public.issues(category);
CREATE INDEX idx_issues_status ON public.issues(status);
CREATE INDEX idx_issues_user_id ON public.issues(user_id);
CREATE INDEX idx_issues_location_geom ON public.issues USING GIST (location_geom); -- Spatial Index for bounding queries
CREATE INDEX idx_issues_created_at ON public.issues(created_at DESC);
CREATE INDEX idx_issues_priority ON public.issues(priority DESC);

-- Enable Row-Level Security
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;

-- Issues are visible to all users (citizens, moderators, guest profiles)
CREATE POLICY "Issues are viewable by everyone" ON public.issues
  FOR SELECT USING (true);

-- Allow authenticated users to file new civic issue tickets under their user ID
CREATE POLICY "Users can create issues" ON public.issues
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow creators to modify details on issues they reported
CREATE POLICY "Users can update own issues" ON public.issues
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow moderators and admins to edit details, assign workers, and resolve tickets on any issue
CREATE POLICY "Admins can update any issue" ON public.issues
  FOR UPDATE USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'moderator')
  );


-- Comments Table
-- Holds messages posted by users under specific issues.
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_comments_issue_id ON public.comments(issue_id);
CREATE INDEX idx_comments_user_id ON public.comments(user_id);

-- Enable Row-Level Security
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Allow comments to be visible to all users
CREATE POLICY "Comments are viewable by everyone" ON public.comments
  FOR SELECT USING (true);

-- Allow users to comment under issues
CREATE POLICY "Users can create comments" ON public.comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow authors to modify their own comments
CREATE POLICY "Users can update own comments" ON public.comments
  FOR UPDATE USING (auth.uid() = user_id);


-- Issue Votes Table
-- Tracks upvote/downvote operations by users. Enforces single votes via UNIQUE indexing.
CREATE TABLE IF NOT EXISTS public.issue_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  vote_type VARCHAR(10) CHECK (vote_type IN ('upvote', 'downvote')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(issue_id, user_id)
);

CREATE INDEX idx_issue_votes_issue_id ON public.issue_votes(issue_id);
CREATE INDEX idx_issue_votes_user_id ON public.issue_votes(user_id);

-- Enable Row-Level Security
ALTER TABLE public.issue_votes ENABLE ROW LEVEL SECURITY;

-- Allow votes to be read by all users to compile metrics
CREATE POLICY "Votes are viewable by everyone" ON public.issue_votes
  FOR SELECT USING (true);

-- Allow users to record a vote
CREATE POLICY "Users can create votes" ON public.issue_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);


-- Activity Log Table
-- Audit trail tracking changes to issues.
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID REFERENCES public.issues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_logs_issue_id ON public.activity_logs(issue_id);
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_action ON public.activity_logs(action);


-- Notifications Table
-- System notifications generated when an issue is resolved, assigned, or modified.
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  issue_id UUID REFERENCES public.issues(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255),
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);

-- =========================================================================
-- DATABASE TRIGGERS & UTILITY FUNCTIONS
-- =========================================================================

-- Trigger function to automatically update 'updated_at' columns on row updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_issues_updated_at BEFORE UPDATE ON public.issues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- =========================================================================
-- ANALYTICS VIEWS
-- =========================================================================

-- Dashboard Stats View
-- Compiles total reported, resolved, in progress, pending issues, and resolution speeds.
CREATE OR REPLACE VIEW public.dashboard_stats AS
SELECT
  COUNT(*) as total_issues,
  COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved,
  COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
  COUNT(CASE WHEN status = 'reported' THEN 1 END) as pending,
  COUNT(DISTINCT user_id) as active_citizens,
  ROUND(
    COUNT(CASE WHEN status = 'resolved' THEN 1 END)::numeric / 
    NULLIF(COUNT(*), 0) * 100, 2
  ) as resolution_rate,
  ROUND(AVG(EXTRACT(DAY FROM (COALESCE(resolved_at, NOW()) - created_at)))::numeric, 1) as avg_resolution_days
FROM public.issues;

-- Issues count by Category view
CREATE OR REPLACE VIEW public.issues_by_category AS
SELECT category, COUNT(*) as count
FROM public.issues
GROUP BY category
ORDER BY count DESC;

-- Issues count by Status view
CREATE OR REPLACE VIEW public.issues_by_status AS
SELECT status, COUNT(*) as count
FROM public.issues
GROUP BY status
ORDER BY count DESC;


-- =========================================================================
-- AUTOMATION & SYNCHRONIZATION TRIGGERS
-- =========================================================================

-- Automatically synchronize Supabase's auth.users table with our public.users profile table.
-- Fires when a user completes registration/sign up.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'citizen'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- Automatically synchronize PostGIS location geography marker fields when latitude/longitude values are set.
CREATE OR REPLACE FUNCTION public.update_issue_geom()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.location_geom = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_update_issue_geom
  BEFORE INSERT OR UPDATE ON public.issues
  FOR EACH ROW EXECUTE FUNCTION public.update_issue_geom();


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




