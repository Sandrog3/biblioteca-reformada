import * as dotenv from 'dotenv';
dotenv.config();

function decodeJWT(token: string) {
  if (!token) return 'No token';
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return 'Not a valid JWT format';
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch(e) {
    return 'Failed to decode: ' + e;
  }
}

console.log("=== VITE_SUPABASE_ANON_KEY ===");
console.log(decodeJWT(process.env.VITE_SUPABASE_ANON_KEY || ''));

console.log("\n=== SUPABASE_SERVICE_ROLE_KEY ===");
console.log(decodeJWT(process.env.SUPABASE_SERVICE_ROLE_KEY || ''));
