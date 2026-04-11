-- Add JSONB columns for flexible nested offline data syncing
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS members JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS comments JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS splits JSONB DEFAULT '{}'::jsonb;
