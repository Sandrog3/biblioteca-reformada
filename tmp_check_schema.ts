import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  const url = process.env.VITE_SUPABASE_URL + '/rest/v1/?apikey=' + process.env.VITE_SUPABASE_ANON_KEY;
  const response = await fetch(url);
  const data = await response.json();
  if (data.definitions && data.definitions.books) {
    console.log(JSON.stringify(data.definitions.books.properties, null, 2));
  } else {
    console.log("Books table not found in OpenAPI spec");
  }
}
main();
