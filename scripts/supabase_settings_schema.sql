-- Copie e cole este código INTEIRO na aba "SQL Editor" do seu Supabase.

-- 1. Cria a Tabela Segura de Settings
CREATE TABLE settings (
  id TEXT PRIMARY KEY,
  hero_title TEXT,
  hero_subtitle TEXT,
  hero_image TEXT,
  logo_url TEXT,
  slogan TEXT,
  marquee_items TEXT,
  whatsapp_number TEXT,
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Concede as permissões de acesso público básicas para leitura do frontend
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Settings can be read by anyone."
ON settings FOR SELECT
USING (true);

CREATE POLICY "Admins can insert/update settings"
ON settings FOR ALL
USING (auth.role() = 'authenticated'); -- Ou personalize a sua claim de admin aqui futuramente

-- 3. Insere o registro global obrigatório base da plataforma
INSERT INTO settings (
  id,
  hero_title,
  hero_subtitle,
  hero_image,
  logo_url,
  slogan,
  marquee_items,
  whatsapp_number
) VALUES (
  'global',
  'Livros Cristãos Baseadas No Ensino Reformado Com Fidelidade às Escrituras',
  'Um bom livro cristão é aquele que conduz o leitor de volta à Palavra de Deus e o ajuda a amar mais a Cristo.',
  'https://images.unsplash.com/photo-1507738911748-9c7846274f3d?q=80&w=2070&auto=format&fit=crop',
  '',
  'Tradição Reformada & Sabedoria Bíblica',
  'Teologia Reformada, Clássicos Cristãos, Vida Devocional, Estudo Bíblico, Doutrina Saudável, Amadurecimento Espiritual',
  '5548991709438'
);

-- O frontend depende desta tabela agora.
