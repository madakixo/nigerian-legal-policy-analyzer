import express from "express";
import { createServer as createViteServer } from "vite";
import { createProxyMiddleware } from 'http-proxy-middleware';
import Database from 'better-sqlite3';
import path from 'path';

const db = new Database('petitions.db');

// Initialize Database Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS policies (
    id TEXT PRIMARY KEY,
    query TEXT,
    analysis TEXT,
    constitutions TEXT,
    source TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS petitions (
    id TEXT PRIMARY KEY,
    policy_id TEXT,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(policy_id) REFERENCES policies(id)
  );

  CREATE TABLE IF NOT EXISTS petitioners (
    id TEXT PRIMARY KEY,
    petition_id TEXT,
    name TEXT,
    organization TEXT,
    nin TEXT,
    pvc TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(petition_id) REFERENCES petitions(id)
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // 1. Proxy specific routes to Python backend BEFORE body parser
  // This prevents express.json() from consuming the stream
  app.use(['/api/query', '/api/health'], createProxyMiddleware({
    target: 'http://localhost:8000',
    changeOrigin: true
  }));

  app.use(express.json());

  // 2. API Routes for local Node.js Database
  app.post("/api/db/save-petition", (req, res) => {
    const { policy, petition, petitioners } = req.body;
    
    try {
      const transaction = db.transaction(() => {
        // Save Policy
        db.prepare('INSERT INTO policies (id, query, analysis, constitutions, source) VALUES (?, ?, ?, ?, ?)')
          .run(policy.id, policy.query, policy.analysis, JSON.stringify(policy.constitutions), policy.source);

        // Save Petition
        db.prepare('INSERT INTO petitions (id, policy_id, content) VALUES (?, ?, ?)')
          .run(petition.id, policy.id, petition.content);

        // Save Petitioners
        const insertPetitioner = db.prepare('INSERT INTO petitioners (id, petition_id, name, organization, nin, pvc) VALUES (?, ?, ?, ?, ?, ?)');
        for (const p of petitioners) {
          insertPetitioner.run(p.id, petition.id, p.name, p.organization, p.nin, p.pvc);
        }
      });

      transaction();
      res.json({ success: true });
    } catch (error) {
      console.error('Database Error:', error);
      res.status(500).json({ error: 'Failed to save to database' });
    }
  });

  app.get("/api/db/history", (req, res) => {
    try {
      const history = db.prepare(`
        SELECT p.id, pol.query, p.created_at, COUNT(ptr.id) as signatory_count
        FROM petitions p
        JOIN policies pol ON p.policy_id = pol.id
        LEFT JOIN petitioners ptr ON p.id = ptr.petition_id
        GROUP BY p.id
        ORDER BY p.created_at DESC
      `).all();
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch history' });
    }
  });

  // Root proxy for anything else under /api (optional, but keep for robustness)
  // This one might still have body issues, but query/health are handled above
  app.use('/api', createProxyMiddleware({
    target: 'http://localhost:8000',
    changeOrigin: true
  }));

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static('dist'));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Node.js server running on http://localhost:${PORT}`);
    console.log(`Proxying /api requests to http://localhost:8000`);
  });
}

startServer();
