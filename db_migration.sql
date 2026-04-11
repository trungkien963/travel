-- Add JSONB columns for flexible nested offline data syncing
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS members JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS comments JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS splits JSONB DEFAULT '{}'::jsonb;
-- Add Missing Columns to Trips
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS location_name TEXT;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS location_city TEXT;

-- Update Enum for expenses
-- Note: Altering ENUM type requires adding values or recreating. Since this is an architectural rebuild, we update values:
ALTER TYPE expense_type ADD VALUE IF NOT EXISTS 'FOOD';
ALTER TYPE expense_type ADD VALUE IF NOT EXISTS 'TRANSPORT';
ALTER TYPE expense_type ADD VALUE IF NOT EXISTS 'HOTEL';
ALTER TYPE expense_type ADD VALUE IF NOT EXISTS 'ACTIVITIES';
ALTER TYPE expense_type ADD VALUE IF NOT EXISTS 'SHOPPING';
ALTER TYPE expense_type ADD VALUE IF NOT EXISTS 'OTHER';

-- Update the default value
ALTER TABLE public.expenses ALTER COLUMN category SET DEFAULT 'OTHER'::expense_type;

-- 5. Bảo mật User Data bằng Database Trigger (Chống giả mạo từ Frontend)
-- Function này sẽ tự động catch sự kiện từ auth.users và lưu vào public.users 
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), 
    COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', null)
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Gắn Trigger vào Auth API
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
