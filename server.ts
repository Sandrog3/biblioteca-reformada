import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { google } from "googleapis";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import admin from "firebase-admin";
import fs from "fs";

dotenv.config();

// Initialize Firebase Admin
const configPath = path.join(process.cwd(), "firebase-applet-config.json");
if (fs.existsSync(configPath)) {
  const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  admin.initializeApp({
    projectId: config.projectId,
  });
} else {
  admin.initializeApp();
}

const db = admin.firestore();
const auth = admin.auth();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cookieParser());

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

// Middleware to verify Firebase Admin
const verifyAdmin = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const idToken = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    
    // Check if user is admin in Firestore or is the default admin
    const adminEmail = "sandrog3@gmail.com";
    if (decodedToken.email === adminEmail) {
      req.user = decodedToken;
      return next();
    }

    const userDoc = await db.collection("users").doc(decodedToken.uid).get();
    if (userDoc.exists && userDoc.data()?.role === "admin") {
      req.user = decodedToken;
      return next();
    }

    res.status(403).json({ error: "Forbidden: Admin access required" });
  } catch (error) {
    console.error("Error verifying token:", error);
    res.status(401).json({ error: "Invalid token" });
  }
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
