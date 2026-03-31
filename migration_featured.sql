-- 1. ADD COLUMNS FOR HIGHLIGHTS (Destaques e Ofertas) em BOOKS
ALTER TABLE "books" 
ADD COLUMN IF NOT EXISTS "is_featured" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "is_offer" BOOLEAN DEFAULT false;

-- 2. RECRIAR PRODUCTS PARA REFLETIR ESTADO NOVO DE UUID
DROP TABLE IF EXISTS "products" CASCADE;
CREATE TABLE "products" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "description" TEXT,
    "buy_url" TEXT NOT NULL,
    "image_url" TEXT,
    "image_alt" TEXT,
    "video_url" TEXT,
    "characteristics" TEXT, -- Array/String mapeado
    "badge" TEXT,
    "seo_keywords" TEXT,
    "is_featured" BOOLEAN DEFAULT false,
    "is_offer" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. ABERTURA RLS EM PRODUCTS TEMPORÁRIA (Como feito com categories e books para simplificar seu desenvolvimento)
ALTER TABLE "products" DISABLE ROW LEVEL SECURITY;
