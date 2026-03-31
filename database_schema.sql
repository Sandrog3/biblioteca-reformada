-- Tabela POSTS (Postagens do Blog)
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  excerpt TEXT,
  content TEXT,
  image_url TEXT,
  image_alt TEXT,
  video_url TEXT,
  video_keywords TEXT,
  meta_keywords TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para Posts (Leitura anônima liberada, edição restrita)
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura pública de posts aberta" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Acesso total aos posts" ON public.posts FOR ALL USING (auth.role() = 'authenticated');

-- Tabela PRODUCTS (Loja de Afiliados)
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  characteristics TEXT[],
  buy_url TEXT NOT NULL,
  images TEXT[],
  image_alt TEXT,
  video_url TEXT,
  video_keywords TEXT,
  meta_keywords TEXT,
  badge TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para Products (Leitura anônima liberada, edição restrita)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura pública de produtos aberta" ON public.products FOR SELECT USING (true);
CREATE POLICY "Acesso total aos produtos" ON public.products FOR ALL USING (auth.role() = 'authenticated');
