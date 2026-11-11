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

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*', credentials: true }));
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
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CampusFind API running on http://0.0.0.0:${PORT}`);
  });
}

module.exports = app;
