// backend/src/server.js
// Main entry point for the Express REST API.

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { router: authRouter } = require('./auth');
const itemsRouter = require('./items');
const claimsRouter = require('./claims');
const activityRouter = require('./activity');

const app = express();
const PORT = process.env.PORT || 3001;

// Helmet for security headers
app.use(helmet({ contentSecurityPolicy: false }));

// ── Strict CORS Configuration ───────────────────────────────────────────────
// Allow approved development origins + explicitly configured production frontend origin(s)
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

if (process.env.FRONTEND_URL) {
  // Can be comma-separated list of origins
  process.env.FRONTEND_URL.split(',').forEach((url) => {
    const trimmed = url.trim();
    if (trimmed && !allowedOrigins.includes(trimmed)) {
      allowedOrigins.push(trimmed);
    }
  });
}

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. mobile apps, Electron file://, curl, server-to-server)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // In development mode, allow matching localhost subdomains or tunnel testing
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '5mb' }));
app.use(morgan(process.env.NODE_ENV === 'test' ? 'silent' : 'dev'));

// ── Mounted Routes ───────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/items', itemsRouter);
app.use('/api/claims', claimsRouter);
app.use('/api', activityRouter);

// Backward-compatibility aliases for lookup routes
app.use('/api/lookup', itemsRouter);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// 404 handler
app.use((req, res) => res.status(404).json({ error: `Route ${req.path} not found` }));

// Error handler
app.use((err, req, res, _next) => {
  if (err.message && err.message.startsWith('CORS blocked')) {
    return res.status(403).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CampusFind API running on http://0.0.0.0:${PORT}`);
  });
}

module.exports = app;
