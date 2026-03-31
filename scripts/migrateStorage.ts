import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Faltam VITE_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY no .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const BUCKET = 'biblioteca-public';

async function downloadImage(url: string): Promise<Buffer> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Falha ao baixar imagem: ${url} (${response.status})`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

async function uploadToSupabase(fileBuffer: Buffer, storagePath: string, contentType = 'image/jpeg') {
    const { error } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, fileBuffer, {
            contentType,
            upsert: true,
        });

    if (error) throw error;

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
    return data.publicUrl;
}

async function migrateBooks() {
    const { data: livros, error } = await supabase
        .from('livros')
        .select('id, capa_url')
        .not('capa_url', 'is', null);

    if (error) throw error;
    if (!livros) return {};

    const mapping: Record<string, string> = {};

    for (const livro of livros) {
        try {
            if (!livro.capa_url) continue;

            const fileBuffer = await downloadImage(livro.capa_url);
            const storagePath = `books/capas/${livro.id}.jpg`;
            const newUrl = await uploadToSupabase(fileBuffer, storagePath);

            mapping[livro.capa_url] = newUrl;
            console.log(`Livro ${livro.id} migrado com sucesso`);
        } catch (err) {
            console.error(`Erro ao migrar livro ${livro.id}:`, err);
        }
    }

    return mapping;
}

async function main() {
    const booksMap = await migrateBooks();

    const finalMap = {
        livros: booksMap,
    };

    const outputPath = path.join(process.cwd(), 'mapping.json');
    fs.writeFileSync(outputPath, JSON.stringify(finalMap, null, 2), 'utf-8');

    console.log('Migração concluída. Arquivo mapping.json gerado.');
}

main().catch((err) => {
    console.error('Erro geral na migração:', err);
    process.exit(1);
});