-- Arquivo de Reset Absoluto: Executar no SQL Editor do Supabase

-- 1. Apagar tabelas existentes (CUIDADO: isso apagará todos os dados de livros e categorias)
DROP TABLE IF EXISTS "books" CASCADE;
DROP TABLE IF EXISTS "categories" CASCADE;

-- 2. Recriar Tabela: Categories
CREATE TABLE "categories" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL UNIQUE,
    "descricao" TEXT,
    "image_url" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Recriar Tabela: Books
CREATE TABLE "books" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "category" UUID REFERENCES categories(id) ON DELETE SET NULL, -- FK real
    "slug" TEXT NOT NULL UNIQUE,
    "cover_url" TEXT,
    "cover_alt" TEXT,
    "video_url" TEXT,
    "amazon_url" TEXT,
    "publisher" TEXT,
    "year" TEXT,
    "pages" TEXT,
    "synopsis" TEXT,
    "target_audience" TEXT,
    "main_themes" TEXT,
    "badge" TEXT,
    "seo_keywords" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Desativar RLS nas tabelas (Completamente abertas para qualquer operação via painel sem token complexo)
ALTER TABLE "categories" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "books" DISABLE ROW LEVEL SECURITY;

-- Nota: Como o RLS está desativado para essas tabelas, as Policies não são mais respeitadas nem necessárias. Tudo está aberto ao uso anônimo ou do App.
