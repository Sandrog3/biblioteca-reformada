-- =======================================================
-- ADMIN FIX & RLS POLICIES FOR SUPABASE
-- =======================================================

-- 1. Sincronização e Reparo de Colunas (Tipagem UUID)
-- Garante que o ID na tabela categories seja UUID
ALTER TABLE public.categories 
  ALTER COLUMN id SET DATA TYPE UUID USING (id::text::uuid),
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Na tabela livros (ou books, a depender da sua estrutura), 
-- garantimos que a coluna de categoria seja UUID também. 
-- Como o Admin.tsx envia 'category' como o UUID da categoria:
ALTER TABLE public.books 
  ALTER COLUMN category SET DATA TYPE UUID USING (category::text::uuid);

-- E adicionamos Foreign Key (caso ainda não exista)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_books_category' AND table_name = 'books'
  ) THEN
    ALTER TABLE public.books 
      ADD CONSTRAINT fk_books_category 
      FOREIGN KEY (category) REFERENCES public.categories(id) 
      ON DELETE SET NULL;
  END IF;
END $$;

-- 2. Habilitar RLS em todas as tabelas afetadas
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- 3. Renovar as Políticas de RLS para Admin (auth.uid() is not null)
-- Dropando existentes caso tenham conflito
DROP POLICY IF EXISTS "Admin Full Access Books" ON public.books;
DROP POLICY IF EXISTS "Admin Full Access Categories" ON public.categories;
DROP POLICY IF EXISTS "Admin Full Access Posts" ON public.posts;
DROP POLICY IF EXISTS "Admin Full Access Products" ON public.products;
DROP POLICY IF EXISTS "Admin Full Access Settings" ON public.settings;

-- Criando as novas (Acesso Total para qualquer usuário autenticado)
CREATE POLICY "Admin Full Access Books" ON public.books
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admin Full Access Categories" ON public.categories
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admin Full Access Posts" ON public.posts
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admin Full Access Products" ON public.products
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admin Full Access Settings" ON public.settings
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 4. Garantir Grants de Permissão
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.books TO authenticated, service_role;
GRANT ALL ON TABLE public.categories TO authenticated, service_role;
GRANT ALL ON TABLE public.posts TO authenticated, service_role;
GRANT ALL ON TABLE public.products TO authenticated, service_role;
GRANT ALL ON TABLE public.settings TO authenticated, service_role;

-- Dar leitura pública aos anônimos (já deve estar no migration_fix, mas apenas reforçando)
GRANT SELECT ON TABLE public.books TO anon;
GRANT SELECT ON TABLE public.categories TO anon;
GRANT SELECT ON TABLE public.posts TO anon;
GRANT SELECT ON TABLE public.products TO anon;
GRANT SELECT ON TABLE public.settings TO anon;

-- 5. Restaurar Leitura Pública para Visitantes (Corrige Erro 403 Padrão no Front)
DROP POLICY IF EXISTS "Public Read Access Books" ON public.books;
DROP POLICY IF EXISTS "Public Read Access Categories" ON public.categories;
DROP POLICY IF EXISTS "Public Read Access Posts" ON public.posts;
DROP POLICY IF EXISTS "Public Read Access Products" ON public.products;
DROP POLICY IF EXISTS "Public Read Access Settings" ON public.settings;

CREATE POLICY "Public Read Access Books" ON public.books FOR SELECT USING (true);
CREATE POLICY "Public Read Access Categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public Read Access Posts" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Public Read Access Products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public Read Access Settings" ON public.settings FOR SELECT USING (true);
