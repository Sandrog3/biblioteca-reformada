ALTER TABLE public.posts 
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS image_alt TEXT,
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS video_keywords TEXT,
  ADD COLUMN IF NOT EXISTS meta_keywords TEXT;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS characteristics TEXT[],
  ADD COLUMN IF NOT EXISTS buy_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS images TEXT[],
  ADD COLUMN IF NOT EXISTS image_alt TEXT,
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS video_keywords TEXT,
  ADD COLUMN IF NOT EXISTS meta_keywords TEXT,
  ADD COLUMN IF NOT EXISTS badge TEXT;

-- Enable RLS on all tables to ensure policies are applied correctly
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts when re-running
DROP POLICY IF EXISTS "Public read access to posts" ON public.posts;
DROP POLICY IF EXISTS "Public read access to products" ON public.products;
DROP POLICY IF EXISTS "Public read access to books" ON public.books;
DROP POLICY IF EXISTS "Public read access to categories" ON public.categories;
DROP POLICY IF EXISTS "Public read access to settings" ON public.settings;

-- Create RLS Policies to allow public read access so LandingPage can display data
CREATE POLICY "Public read access to posts" ON public.posts FOR SELECT TO public USING (true);
CREATE POLICY "Public read access to products" ON public.products FOR SELECT TO public USING (true);
CREATE POLICY "Public read access to books" ON public.books FOR SELECT TO public USING (true);
CREATE POLICY "Public read access to categories" ON public.categories FOR SELECT TO public USING (true);
CREATE POLICY "Public read access to settings" ON public.settings FOR SELECT TO public USING (true);
