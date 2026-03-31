import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

console.log("URL:", process.env.VITE_SUPABASE_URL);
console.log("SERVICE KEY PREFIX:", process.env.SUPABASE_SERVICE_ROLE_KEY ? process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 15) + "..." : "undefined");
console.log("SERVICE KEY LENGTH:", process.env.SUPABASE_SERVICE_ROLE_KEY?.length);

const supabase = createClient(
  process.env.VITE_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

async function runTest() {
  console.log("Testing SELECT...");
  const { data: selectData, error: selectError } = await supabase.from('settings').select('id').limit(1);
  console.log("SELECT Error:", selectError || "Success");

  console.log("Testing UPSERT...");
  const { error: upsertError } = await supabase.from('settings').upsert({
    id: 'global_test',
    hero_title: 'test'
  });
  console.log("UPSERT Error:", upsertError || "Success");
}
runTest();
