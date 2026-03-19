import admin from 'firebase-admin';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('ERRO: Defina VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env');
  process.exit(1);
}

console.log('SUPABASE_URL ok:', !!SUPABASE_URL);
console.log('SUPABASE_SERVICE_KEY ok:', !!SUPABASE_SERVICE_KEY);
console.log('SUPABASE_SERVICE_KEY prefix:', SUPABASE_SERVICE_KEY?.slice(0, 20));

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const testInsert = await supabase.from('categorias').insert({
  nome: 'teste-permissao',
  slug: 'teste-permissao'
});
console.log('Teste insert categorias:', testInsert.error ?? 'ok');


const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.join(__dirname, 'firebase-service-account.json');

if (!fs.existsSync(configPath)) {
  console.error('ERRO: Arquivo firebase-service-account.json não encontrado.');
  process.exit(1);
}

const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(firebaseConfig)
  });
}

const db = admin.firestore();

function toIsoDate(value: any): string {
  try {
    if (value?.toDate && typeof value.toDate === 'function') {
      return value.toDate().toISOString();
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    return new Date().toISOString();
  } catch {
    return new Date().toISOString();
  }
}

function toText(value: any): string {
  if (value === null || value === undefined) return '';
  return String(value);
}

function toCommaText(value: any): string | null {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function migrateCategories() {
  console.log('--- Iniciando Migração de Categorias ---');

  const snapshot = await db.collection('categories').get();

  if (snapshot.empty) {
    console.log('Nenhuma categoria encontrada no Firebase.');
    return new Map<string, string>();
  }

  const categoryMap = new Map<string, string>();

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const firebaseId = doc.id;

    const supabaseCategory = {
      firebase_id: firebaseId,
      nome: toText(data.name),
      slug: toText(data.slug),
      descricao: toText(data.description),
      created_at: toIsoDate(data.createdAt)
    };

    const { data: inserted, error } = await supabase
      .from('categorias')
      .upsert(supabaseCategory, { onConflict: 'firebase_id' })
      .select('id, firebase_id')
      .single();

    if (error) {
      console.error(`Erro ao migrar categoria [${data.name ?? firebaseId}]:`, error.message);
    } else {
      console.log(`Categoria [${data.name ?? firebaseId}] migrada/atualizada com sucesso.`);
      if (inserted?.id) {
        categoryMap.set(firebaseId, inserted.id);
      }
    }
  }

  return categoryMap;
}

async function migrateBooks(categoryMap: Map<string, string>) {
  console.log('\n--- Iniciando Migração de Livros ---');

  const snapshot = await db.collection('books').get();

  if (snapshot.empty) {
    console.log('Nenhum livro encontrado no Firebase.');
    return;
  }

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const firebaseId = doc.id;

    let categoriaId = data.categoryId ?? null;
    if (categoriaId && categoryMap.has(categoriaId)) {
      categoriaId = categoryMap.get(categoriaId) ?? null;
    }

    const supabaseBook = {
      firebase_id: firebaseId,
      titulo: toText(data.title),
      autor: toText(data.author),
      categoria_id: categoriaId,
      editora: toText(data.publisher),
      ano: toText(data.year),
      paginas: toText(data.pages),
      capa_url: data.imageUrl ?? null,
      link_compra: toText(data.buyUrl),
      sinopse: toText(data.synopsis),
      indicacao: toText(data.targetAudience),
      temas: toCommaText(data.themes),
      video_url: data.videoUrl ?? null,
      badge: data.badge ?? null,
      slug: toText(data.slug),
      seo_alt: data.imageAlt ?? null,
      seo_keywords: toCommaText(data.metaKeywords),
      created_at: toIsoDate(data.createdAt)
    };

    const { error } = await supabase
      .from('livros')
      .upsert(supabaseBook, { onConflict: 'firebase_id' });

    if (error) {
      console.error(`Erro ao migrar livro [${data.title ?? firebaseId}]:`, error.message);
    } else {
      console.log(`Livro [${data.title ?? firebaseId}] migrado/atualizado com sucesso.`);
    }
  }
}

async function run() {
  console.log('==============================================');
  console.log(' INICIANDO MIGRAÇÃO DO FIREBASE PARA SUPABASE');
  console.log('==============================================');

  try {
    const categoryMap = await migrateCategories();
    await delay(1000);
    await migrateBooks(categoryMap);

    console.log('\n==============================================');
    console.log(' MIGRAÇÃO CONCLUÍDA COM SUCESSO');
    console.log('==============================================');
  } catch (err) {
    console.error('Erro na execução do script:', err);
    process.exit(1);
  }
}

run();