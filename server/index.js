import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import { initDatabase, getDatabaseStatus } from './db.js';
import dashboardRoutes from './routes/dashboard.js';
import interactionRoutes from './routes/interactions.js';
import journeyRoutes from './routes/journey.js';
import knowledgeBaseRoutes from './routes/knowledgeBase.js';
import settingsRoutes from './routes/settings.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// 1. Security & Headers
app.use(helmet({
  contentSecurityPolicy: false, // Allows flexible script & style injection for Vite in dev/demo
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 2. Rate Limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 mins
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests from this IP. Please try again later.'
  }
});
app.use('/api', limiter);

// 3. Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 4. API Health Check Route
app.get('/api/health', (req, res) => {
  const dbStatus = getDatabaseStatus();
  res.json({
    status: 'healthy',
    service: 'OmniX-AI Core Engine',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: dbStatus,
    geminiStatus: process.env.GEMINI_API_KEY ? 'Configured' : 'Offline Heuristic Fallback Ready',
    environment: process.env.NODE_ENV || 'development'
  });
});

// 5. Mount API Modules
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/interactions', interactionRoutes);
app.use('/api', journeyRoutes);
app.use('/api/knowledge-base', knowledgeBaseRoutes);
app.use('/api/settings', settingsRoutes);

// 6. Production Static Assets Serving
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// 7. Error Handling Middleware
app.use(notFoundHandler);
app.use(errorHandler);

// 8. Server Boot
async function startServer() {
  try {
    console.log('[OmniX-AI] Booting Enterprise Engine...');
    await initDatabase();

    app.listen(PORT, HOST, () => {
      console.log('========================================================');
      console.log(`🚀 OmniX-AI Server running on http://${HOST}:${PORT}`);
      console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`🤖 Gemini Model: ${process.env.GEMINI_MODEL || 'gemini-2.5-flash'}`);
      console.log(`🛡️ Rate Limiting & Helmet Security Active`);
      console.log('========================================================');
    });
  } catch (err) {
    console.error('[OmniX-AI] Fatal Boot Error:', err);
    process.exit(1);
  }
}

startServer();

