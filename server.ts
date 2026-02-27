import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Database from "better-sqlite3";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "arogyamitra-secret-key-2026";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

console.log("AROMI: Gemini API Key present:", !!GEMINI_API_KEY);

app.use(express.json());

// Database Initialization
const db = new Database("arogyamitra.db");
db.pragma('foreign_keys = ON');
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS profiles (
    user_id INTEGER PRIMARY KEY,
    age INTEGER,
    gender TEXT,
    weight REAL,
    height REAL,
    goal TEXT,
    activity_level TEXT,
    dietary_preferences TEXT,
    medications TEXT,
    health_conditions TEXT,
    allergies TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS workouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    plan_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS meals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    plan_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS chat_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    role TEXT,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Migration: Add columns if they don't exist
const columns = db.prepare("PRAGMA table_info(profiles)").all() as any[];
const columnNames = columns.map(c => c.name);

if (!columnNames.includes("medications")) {
  db.prepare("ALTER TABLE profiles ADD COLUMN medications TEXT").run();
}
if (!columnNames.includes("health_conditions")) {
  db.prepare("ALTER TABLE profiles ADD COLUMN health_conditions TEXT").run();
}
if (!columnNames.includes("allergies")) {
  db.prepare("ALTER TABLE profiles ADD COLUMN allergies TEXT").run();
}

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log("Database tables:", tables);

// Auth Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    
    // Verify user still exists in DB to prevent FK constraint errors with stale tokens
    const userExists = db.prepare("SELECT id FROM users WHERE id = ?").get(user.id);
    if (!userExists) {
      return res.status(401).json({ error: "User no longer exists. Please log in again." });
    }
    
    req.user = user;
    next();
  });
};

const cleanJson = (text: string) => {
  return text.replace(/```json\n?|```/g, "").trim();
};

// --- API Routes ---

// Auth
app.post("/api/auth/signup", async (req, res) => {
  const { email, password, name } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const stmt = db.prepare("INSERT INTO users (email, password, name) VALUES (?, ?, ?)");
    const info = stmt.run(email, hashedPassword, name);
    
    // Create default profile
    db.prepare(`
      INSERT INTO profiles (user_id, age, gender, weight, height, goal, activity_level, dietary_preferences)
      VALUES (?, 25, 'Male', 70, 175, 'General Fitness', 'Moderate', 'None')
    `).run(info.lastInsertRowid);

    const token = jwt.sign({ id: info.lastInsertRowid, email }, JWT_SECRET);
    res.json({ token, user: { id: info.lastInsertRowid, email, name } });
  } catch (e) {
    res.status(400).json({ error: "User already exists" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user: any = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

// Profile
app.get("/api/profile", authenticateToken, (req: any, res) => {
  const profile = db.prepare("SELECT * FROM profiles WHERE user_id = ?").get(req.user.id);
  res.json(profile || {});
});

app.post("/api/profile", authenticateToken, (req: any, res) => {
  const { age, gender, weight, height, goal, activity_level, dietary_preferences, medications, health_conditions, allergies } = req.body;
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO profiles (user_id, age, gender, weight, height, goal, activity_level, dietary_preferences, medications, health_conditions, allergies)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(req.user.id, age, gender, weight, height, goal, activity_level, dietary_preferences, medications, health_conditions, allergies);
  res.json({ success: true });
});

// AI Services (Gemini) - Moved to frontend as per guidelines
// Backend now only handles saving and retrieving plans

app.get("/api/ai/workout", authenticateToken, (req: any, res) => {
  const workout: any = db.prepare("SELECT plan_json FROM workouts WHERE user_id = ? ORDER BY created_at DESC LIMIT 1").get(req.user.id);
  res.json(workout ? JSON.parse(workout.plan_json) : []);
});

app.post("/api/ai/save-workout", authenticateToken, (req: any, res) => {
  const { plan } = req.body;
  db.prepare("INSERT INTO workouts (user_id, plan_json) VALUES (?, ?)").run(req.user.id, JSON.stringify(plan));
  res.json({ success: true });
});

app.get("/api/ai/nutrition", authenticateToken, (req: any, res) => {
  const meal: any = db.prepare("SELECT plan_json FROM meals WHERE user_id = ? ORDER BY created_at DESC LIMIT 1").get(req.user.id);
  res.json(meal ? JSON.parse(meal.plan_json) : []);
});

app.post("/api/ai/save-nutrition", authenticateToken, (req: any, res) => {
  const { plan } = req.body;
  db.prepare("INSERT INTO meals (user_id, plan_json) VALUES (?, ?)").run(req.user.id, JSON.stringify(plan));
  res.json({ success: true });
});

app.post("/api/ai/chat-history", authenticateToken, (req: any, res) => {
  try {
    const { role, content } = req.body;
    db.prepare("INSERT INTO chat_history (user_id, role, content) VALUES (?, ?, ?)").run(req.user.id, role, content);
    res.json({ success: true });
  } catch (error: any) {
    console.error("Error saving chat history:", error);
    res.status(500).json({ error: error.message || "Failed to save chat history" });
  }
});

app.get("/api/ai/chat-history", authenticateToken, (req: any, res) => {
  try {
    const history = db.prepare("SELECT role, content FROM chat_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 20").all(req.user.id);
    res.json(history.reverse());
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({ error: "Failed to fetch chat history" });
  }
});

app.delete("/api/ai/chat-history", authenticateToken, (req: any, res) => {
  try {
    db.prepare("DELETE FROM chat_history WHERE user_id = ?").run(req.user.id);
    res.json({ success: true });
  } catch (error) {
    console.error("Error clearing chat history:", error);
    res.status(500).json({ error: "Failed to clear chat history" });
  }
});

// --- Vite Integration ---
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(__dirname, "dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Global error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({ error: err.message || "Internal Server Error" });
});
