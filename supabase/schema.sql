-- 1. Create custom types
CREATE TYPE trip_member_role AS ENUM ('admin', 'member');
CREATE TYPE expense_type AS ENUM ('deposit', 'hotel', 'flight', 'transport', 'food', 'activity', 'other');

-- 2. Users Table
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  expo_push_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Trips Table
CREATE TABLE public.trips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  cover_image TEXT,
  members JSONB DEFAULT '[]'::jsonb,
  is_private BOOLEAN DEFAULT false,
  total_budget DECIMAL(12, 2) DEFAULT 0,
  cover_url TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Trip Members
CREATE TABLE public.trip_members (
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  role trip_member_role DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (trip_id, user_id)
);

-- 5. Trip Expenses
CREATE TABLE public.trip_expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
  payer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  amount DECIMAL(12, 2) NOT NULL,
  description TEXT NOT NULL,
  category expense_type DEFAULT 'other',
  is_settled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Expense Splits
CREATE TABLE public.expense_splits (
  expense_id UUID REFERENCES public.trip_expenses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  amount_owed DECIMAL(12, 2) NOT NULL,
  is_paid BOOLEAN DEFAULT false,
  PRIMARY KEY (expense_id, user_id)
);

-- 7. Posts (Moments)
CREATE TABLE public.posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  expense_id UUID REFERENCES public.trip_expenses(id) ON DELETE SET NULL,
  content TEXT,
  image_urls TEXT[] DEFAULT '{}',
  is_dual_camera BOOLEAN DEFAULT false,
  likes TEXT[] DEFAULT '{}',
  comments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RPC Functions cho Posts
CREATE OR REPLACE FUNCTION toggle_post_like(p_post_id UUID, p_user_id TEXT)
RETURNS void AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.posts WHERE id = p_post_id AND p_user_id = ANY(likes)) THEN
    UPDATE public.posts SET likes = array_remove(likes, p_user_id) WHERE id = p_post_id;
  ELSE
    UPDATE public.posts SET likes = array_append(likes, p_user_id) WHERE id = p_post_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION add_post_comment(p_post_id UUID, p_comment JSONB)
RETURNS void AS $$
BEGIN
  UPDATE public.posts 
  SET comments = comments || jsonb_build_array(p_comment) 
  WHERE id = p_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Notifications Table
CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  actor_avatar TEXT,
  message TEXT NOT NULL,
  trip_id UUID,
  post_id UUID,
  expense_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Setup basic Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies (SELECT/INSERT/UPDATE) should be added later based on app logic requirements.
