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

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

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
    if (value && typeof value === 'number') {
      return new Date(value).toISOString();
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

function toJsonbOrText(value: any): any {
  if (value === null || value === undefined) return null;
  return Array.isArray(value) ? JSON.stringify(value) : String(value);
}

async function migrateSettings() {
  console.log('--- Migrando Settings ---');
  const snapshot = await db.collection('settings').doc('global').get();
  if (!snapshot.exists) {
    console.log('Documento settings/global não existe.');
    return;
  }
  const data = snapshot.data();
  if (!data) return;

  const supabaseSettings = {
    id: 'global',
    heroTitle: toText(data.heroTitle),
    heroSubtitle: toText(data.heroSubtitle),
    heroImage: toText(data.heroImage),
    logoUrl: toText(data.logoUrl),
    slogan: toText(data.slogan),
    marqueeItems: toJsonbOrText(data.marqueeItems),
    whatsappNumber: toText(data.whatsappNumber),
    metaTitle: toText(data.metaTitle),
    metaDescription: toText(data.metaDescription),
    metaKeywords: toText(data.metaKeywords)
  };

  const { error } = await supabase.from('settings').upsert(supabaseSettings);
  console.log('Settings:', error ? error.message : 'OK');
}

async function migratePosts() {
  console.log('--- Migrando Posts ---');
  const snapshot = await db.collection('posts').get();
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const supabasePost = {
      firebase_id: doc.id,
      title: toText(data.title),
      category: toText(data.category),
      excerpt: toText(data.excerpt),
      content: toText(data.content),
      imageUrl: toText(data.imageUrl),
      imageAlt: toText(data.imageAlt),
      videoUrl: toText(data.videoUrl),
      videoKeywords: toText(data.videoKeywords),
      metaKeywords: toText(data.metaKeywords),
      created_at: toIsoDate(data.createdAt)
    };
    const { error } = await supabase.from('posts').upsert(supabasePost, { onConflict: 'firebase_id' });
    if (error) console.error(`Erro Post [${doc.id}]:`, error.message);
  }
  console.log('Posts OK');
}

async function migrateProducts() {
  console.log('--- Migrando Produtos ---');
  const snapshot = await db.collection('products').get();
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const supabaseProduct = {
      firebase_id: doc.id,
      title: toText(data.title),
      description: toText(data.description),
      characteristics: toJsonbOrText(data.characteristics),
      buyUrl: toText(data.buyUrl),
      images: toJsonbOrText(data.images),
      imageAlt: toText(data.imageAlt),
      videoUrl: toText(data.videoUrl),
      videoKeywords: toText(data.videoKeywords),
      badge: toText(data.badge),
      metaKeywords: toText(data.metaKeywords),
      created_at: toIsoDate(data.createdAt || data.created_at)
    };
    const { error } = await supabase.from('products').upsert(supabaseProduct, { onConflict: 'firebase_id' });
    if (error) console.error(`Erro Produto [${doc.id}]:`, error.message);
  }
  console.log('Produtos OK');
}

async function migrateSubscriptions() {
  console.log('--- Migrando Subscriptions ---');
  const snapshot = await db.collection('subscriptions').get();
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const supabaseSub = {
      firebase_id: doc.id,
      email: toText(data.email),
      subscribedAt: toIsoDate(data.subscribedAt)
    };
    const { error } = await supabase.from('subscriptions').upsert(supabaseSub, { onConflict: 'firebase_id' });
    if (error) console.error(`Erro Subscription [${doc.id}]:`, error.message);
  }
  console.log('Subscriptions OK');
}

async function migrateUsers() {
  console.log('--- Migrando Users ---');
  const snapshot = await db.collection('users').get();
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const supabaseUser = {
      firebase_uid: doc.id,
      email: toText(data.email),
      role: toText(data.role || 'user'),
      displayName: toText(data.displayName),
      photoURL: toText(data.photoURL),
      createdAt: toIsoDate(data.createdAt),
      updatedAt: toIsoDate(data.updatedAt)
    };
    const { error } = await supabase.from('users').upsert(supabaseUser, { onConflict: 'firebase_uid' });
    if (error) console.error(`Erro User [${doc.id}]:`, error.message);
  }
  console.log('Users OK');
}

async function run() {
  console.log('==============================================');
  console.log(' INICIANDO MIGRAÇÃO FASE FINAL (DEMAIS TABELAS)');
  console.log('==============================================');
  try {
    await migrateSettings();

    console.log('\n==============================================');
    console.log(' MIGRAÇÃO SECUNDÁRIA CONCLUÍDA');
    console.log('==============================================');
  } catch (err) {
    console.error('Erro geral:', err);
    process.exit(1);
  }
}

run();
