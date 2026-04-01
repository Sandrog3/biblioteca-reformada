import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { google } from "googleapis";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";

dotenv.config();



const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.APP_URL}/api/auth/google/callback`
);

// Auth URL endpoint
app.get("/api/auth/google/url", (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/drive.file"],
    prompt: "consent",
  });
  res.json({ url });
});

// OAuth Callback
app.get("/api/auth/google/callback", async (req, res) => {
  const { code } = req.query;
  try {
    const { tokens } = await oauth2Client.getToken(code as string);
    // In a real app, we'd store this in a database. 
    // For this demo, we'll pass it back to the opener via postMessage
    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'GOOGLE_AUTH_SUCCESS', 
                tokens: ${JSON.stringify(tokens)} 
              }, '*');
              window.close();
            } else {
              window.location.href = '/admin';
            }
          </script>
          <p>Autenticação concluída. Esta janela fechará automaticamente.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Error exchanging code:", error);
    res.status(500).send("Authentication failed");
  }
});

// Middleware to verify Admin - DISABLED for Supabase Migration
const verifyAdmin = async (req: any, res: any, next: any) => {
  return next();
};

// Export to Sheets endpoint
app.post("/api/export/sheets", async (req, res) => {
  const { tokens, data } = req.body;
  if (!tokens || !data) return res.status(400).json({ error: "Missing tokens or data" });

  try {
    const auth = new google.auth.OAuth2();
    auth.setCredentials(tokens);
    const sheets = google.sheets({ version: "v4", auth });

    // 1. Create Spreadsheet
    const spreadsheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: `Inscritos Newsletter - ${new Date().toLocaleDateString()}`,
        },
      },
    });

    const spreadsheetId = spreadsheet.data.spreadsheetId;

    // 2. Prepare data (Header + Rows)
    const values = [
      ["E-mail", "Data de Inscrição"],
      ...data.map((sub: any) => [
        sub.email,
        sub.subscribedAt ? new Date(sub.subscribedAt.seconds * 1000).toLocaleString('pt-BR') : 'N/A'
      ])
    ];

    // 3. Append data
    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId!,
      range: "Sheet1!A1",
      valueInputOption: "RAW",
      requestBody: {
        values,
      },
    });

    res.json({ url: spreadsheet.data.spreadsheetUrl });
  } catch (error) {
    console.error("Error exporting to sheets:", error);
    res.status(500).json({ error: "Failed to export to sheets" });
  }
});

// ----------------------------------------------------------------------
// Rotas de Bypass do Funcional do Administrador via Supabase Authenticated
// ----------------------------------------------------------------------

app.get('/api/users', async (req: any, res: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized: Missing Token" });
    }
    const token = authHeader.split("Bearer ")[1];

    const serverSupabase = createClient(
      process.env.VITE_SUPABASE_URL as string,
      process.env.SUPABASE_SERVICE_ROLE_KEY as string
    );

    const { data: { user: adminUser }, error: verifyError } = await serverSupabase.auth.getUser(token);
    
    if (verifyError || adminUser?.email?.toLowerCase() !== 'sandrog3@gmail.com') {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { data: listData, error } = await serverSupabase.auth.admin.listUsers();
    if (error) throw error;
    
    // Map to the shape Admin.tsx expects
    const mappedUsers = listData.users.map(u => ({
      uid: u.id,
      id: u.id,
      email: u.email,
      displayName: u.user_metadata?.full_name || u.user_metadata?.displayName || '',
      role: u.user_metadata?.role || 'user',
      createdAt: u.created_at,
      lastLogin: u.last_sign_in_at
    }));

    res.json(mappedUsers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/settings', verifyAdmin, async (req: any, res: any) => {
  try {
    console.log("API /api/settings chamada");
    console.log("SERVICE ROLE EXISTS:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    console.log("SERVICE ROLE PREFIX:", process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 12));
    console.log("SERVICE ROLE LENGTH:", process.env.SUPABASE_SERVICE_ROLE_KEY?.length);
    
    // Usando client dedicado restrito assegurando Bypass explícito na rota conforme pedido
    const serverSupabase = createClient(
      process.env.VITE_SUPABASE_URL as string,
      process.env.SUPABASE_SERVICE_ROLE_KEY as string
    );

    // Teste simples para checar permissão RLS com este client
    const { error: testError } = await serverSupabase.from('settings').select('id').limit(1);
    if (testError) {
      console.error("ERRO TESTE DE SELECT MESTRE:", testError);
    } else {
      console.log("TESTE DE SELECT MESTRE: SUCESSO (RLS BYPASS OK)");
    }

    const settingsData = req.body;
    const { error } = await serverSupabase.from('settings').upsert({
      id: 'global',
      hero_title: settingsData.heroTitle,
      hero_subtitle: settingsData.heroSubtitle,
      hero_image: settingsData.heroImage,
      logo_url: settingsData.logoUrl,
      footer_logo_url: settingsData.footerLogoUrl,
      slogan: settingsData.slogan,
      marquee_items: settingsData.marqueeItems,
      whatsapp_number: settingsData.whatsappNumber,
      meta_title: settingsData.metaTitle,
      meta_description: settingsData.metaDescription,
      meta_keywords: settingsData.metaKeywords,
      updated_at: new Date().toISOString()
    });

    if (error) {
      console.error("Supabase UPSERT Error:", error);
      throw error;
    }
    
    res.json({ success: true });
  } catch (error: any) {
    console.error("Settings proxy routing error:", error);
    res.status(500).json({ error: error.message || 'Save failed' });
  }
});

// ----------------------------------------------------------------------
// Rota de Super Admin para promoção de papéis de usuários (Role Management)
// ----------------------------------------------------------------------
app.post('/api/users/:id/role', async (req: any, res: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized: Missing Token" });
    }
    const token = authHeader.split("Bearer ")[1];

    const { id } = req.params;
    const { role, displayName } = req.body;

    const serverSupabase = createClient(
      process.env.VITE_SUPABASE_URL as string,
      process.env.SUPABASE_SERVICE_ROLE_KEY as string
    );

    // Validate Super Admin Token
    const { data: { user: superAdminUser }, error: getUserError } = await serverSupabase.auth.getUser(token);
    if (getUserError || superAdminUser?.email?.toLowerCase() !== 'sandrog3@gmail.com') {
      return res.status(403).json({ error: "Forbidden: Super Admin access required." });
    }

    // Update metadata directly in Supabase Auth via Admin API
    const { error: authError } = await serverSupabase.auth.admin.updateUserById(id, {
      user_metadata: { role, full_name: displayName }
    });
    if (authError) throw authError;

    // Tentativa otimista de atualizar a tabela pública users (se ela existir)
    try {
      await serverSupabase.from('users').update({
        role,
        displayName,
        updatedAt: new Date().toISOString()
      }).eq("id", id);
    } catch(e) { /* Ignore - public users table may not exist */ }

    res.json({ success: true });
  } catch (error: any) {
    console.error("Role assignment error:", error);
    res.status(500).json({ error: error.message || 'Falha ao atualizar papel' });
  }
});

// ----------------------------------------------------------------------
// Rota para Criar/Convidar Usuário via Admin API (Sem public.users fallback)
// ----------------------------------------------------------------------
app.post('/api/users', async (req: any, res: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized: Missing Token" });
    }
    const token = authHeader.split("Bearer ")[1];

    const { email, role, displayName, password } = req.body;

    const serverSupabase = createClient(
      process.env.VITE_SUPABASE_URL as string,
      process.env.SUPABASE_SERVICE_ROLE_KEY as string
    );

    const { data: { user: adminUser }, error: verifyError } = await serverSupabase.auth.getUser(token);
    if (verifyError || adminUser?.email?.toLowerCase() !== 'sandrog3@gmail.com') {
      return res.status(403).json({ error: "Forbidden: Super Admin access required." });
    }

    const { data, error } = await serverSupabase.auth.admin.createUser({
      email,
      password: password || 'SenhaTemporaria123!', // fallback if no password
      email_confirm: true,
      user_metadata: { role, full_name: displayName }
    });

    if (error) throw error;
    res.json({ success: true, user: data.user });
  } catch (error: any) {
    console.error("User creation error:", error);
    res.status(500).json({ error: error.message || 'Falha ao criar usuário' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
