/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Variáveis de ambiente VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY estão faltando.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);