/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('URL:', supabaseUrl);

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("ERRO CRÍTICO: Chaves do Supabase não encontradas no .env");
}

export const supabase = createClient(
    supabaseUrl,
    supabaseAnonKey
);