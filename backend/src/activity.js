// backend/src/activity.js
// Activity endpoints: Dashboard metrics, Matches, Notifications, and Admin management.

const express = require('express');
const { query } = require('./db');
const { authenticate, requireAdmin } = require('./auth');
const { getUserMatches, runMatching } = require('./matcher');

const router = express.Router();

// ── Dashboard Metrics ────────────────────────────────────────────────────────
router.get('/dashboard', authenticate, async (req, res) => {
  const uid = req.user.id;
  try {
    const myItems = await query(
      `SELECT type, status, COUNT(*) AS count
       FROM items WHERE user_id=$1 GROUP BY type, status`,
      [uid]
    );

    const myMatches = await query(
      `SELECT COUNT(*) AS count FROM matches m
       JOIN items li ON li.id = m.lost_id
       JOIN items fi ON fi.id = m.found_id
       WHERE (li.user_id=$1 OR fi.user_id=$1) AND m.status='pending'`,
      [uid]
    );

    const myClaims = await query(
      `SELECT status, COUNT(*) AS count FROM claims
       WHERE claimant_id=$1 GROUP BY status`,
      [uid]
    );

    const recentActivity = await query(
      `SELECT action, details, created_at FROM activity_log
       WHERE user_id=$1 ORDER BY created_at DESC LIMIT 5`,
      [uid]
    );

    const globalStats = await query(
      `SELECT
         (SELECT COUNT(*) FROM items WHERE type='lost'  AND status='active')  AS total_lost,
         (SELECT COUNT(*) FROM items WHERE type='found' AND status='active')  AS total_found,
         (SELECT COUNT(*) FROM items WHERE status='returned')                  AS total_returned,
         (SELECT COUNT(*) FROM matches WHERE status='pending')                 AS total_matches,
         (SELECT COUNT(*) FROM claims  WHERE status='pending')                 AS pending_claims,
         (SELECT COUNT(*) FROM users   WHERE role='student')                   AS total_students`
    );

    const recentItems = await query(
      `SELECT i.id, i.type, i.title, i.status, i.created_at,
              c.name AS category_name, c.icon AS category_icon,
              u.name AS reporter_name
       FROM items i
       LEFT JOIN categories c ON c.id = i.category_id
       LEFT JOIN users u ON u.id = i.user_id
       ORDER BY i.created_at DESC LIMIT 8`
    );

    return res.json({
      myItems:        myItems.rows,
      myMatches:      parseInt(myMatches.rows[0]?.count || 0, 10),
      myClaims:       myClaims.rows,
      recentActivity: recentActivity.rows,
      globalStats:    globalStats.rows[0],
      recentItems:    recentItems.rows,
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── Matches Endpoints ────────────────────────────────────────────────────────
// GET /api/matches
router.get('/matches', authenticate, async (req, res) => {
  try {
    const matches = await getUserMatches(req.user.id);
    return res.json({ matches });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/matches/item/:id
router.get('/matches/item/:id', authenticate, async (req, res) => {
  try {
    const itemId = req.params.id;
    const { rows: [item] } = await query('SELECT user_id FROM items WHERE id=$1', [itemId]);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (item.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorised' });
    }

    const { rows } = await query(
      `SELECT m.*,
              li.title AS lost_title, li.description AS lost_desc,
              li.color AS lost_color, li.brand AS lost_brand,
              lu.name AS lost_reporter, lu.email AS lost_email,
              fi.title AS found_title, fi.description AS found_desc,
              fi.color AS found_color, fi.brand AS found_brand,
              fu.name AS found_reporter, fu.email AS found_email,
              cl.name AS lost_cat, cf.name AS found_cat,
              ll.name AS lost_loc, lf.name AS found_loc
       FROM matches m
       JOIN items li ON li.id = m.lost_id
       JOIN items fi ON fi.id = m.found_id
       JOIN users lu ON lu.id = li.user_id
       JOIN users fu ON fu.id = fi.user_id
       LEFT JOIN categories cl ON cl.id = li.category_id
       LEFT JOIN categories cf ON cf.id = fi.category_id
       LEFT JOIN locations  ll ON ll.id = li.location_id
       LEFT JOIN locations  lf ON lf.id = fi.location_id
       WHERE (m.lost_id=$1 OR m.found_id=$1)
       ORDER BY m.score DESC`,
      [itemId]
    );
    return res.json({ matches: rows });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/matches/run/:itemId
router.post('/matches/run/:itemId', authenticate, async (req, res) => {
  try {
    await runMatching(req.params.itemId);
    return res.json({ message: 'Matching complete' });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/matches/all (admin only)
router.get('/matches/all', authenticate, requireAdmin, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT m.*, li.title AS lost_title, fi.title AS found_title, m.score
       FROM matches m
       JOIN items li ON li.id = m.lost_id
       JOIN items fi ON fi.id = m.found_id
       ORDER BY m.score DESC, m.created_at DESC
       LIMIT 100`
    );
    return res.json({ matches: rows });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── Notifications Endpoints ──────────────────────────────────────────────────
// GET /api/notifications
router.get('/notifications', authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    const unread = rows.filter(n => !n.is_read).length;
    return res.json({ notifications: rows, unread });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/notifications/:id/read
router.put('/notifications/:id/read', authenticate, async (req, res) => {
  try {
    await query(
      'UPDATE notifications SET is_read=TRUE WHERE id=$1 AND user_id=$2',
      [req.params.id, req.user.id]
    );
    return res.json({ message: 'Marked read' });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/notifications/read-all
router.put('/notifications/read-all', authenticate, async (req, res) => {
  try {
    await query(
      'UPDATE notifications SET is_read=TRUE WHERE user_id=$1',
      [req.user.id]
    );
    return res.json({ message: 'All marked read' });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── Admin Endpoints ──────────────────────────────────────────────────────────
// GET /api/admin/users
router.get('/admin/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT id, name, email, student_id, phone, role, created_at FROM users ORDER BY created_at DESC'
    );
    return res.json({ users: rows });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/admin/users/:id/role
router.put('/admin/users/:id/role', authenticate, requireAdmin, async (req, res) => {
  const { role } = req.body;
  if (!['student', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  try {
    const { rows } = await query(
      'UPDATE users SET role=$1 WHERE id=$2 RETURNING id, name, email, role',
      [role, req.params.id]
    );
    return res.json({ user: rows[0] });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/admin/users/:id
router.delete('/admin/users/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await query('DELETE FROM users WHERE id=$1', [req.params.id]);
    return res.json({ message: 'User deleted' });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/stats
router.get('/admin/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT
         (SELECT COUNT(*) FROM users)                          AS total_users,
         (SELECT COUNT(*) FROM items)                          AS total_items,
         (SELECT COUNT(*) FROM items WHERE type='lost')         AS lost_items,
         (SELECT COUNT(*) FROM items WHERE type='found')        AS found_items,
         (SELECT COUNT(*) FROM items WHERE status='returned')   AS returned_items,
         (SELECT COUNT(*) FROM matches)                        AS total_matches,
         (SELECT COUNT(*) FROM claims)                         AS total_claims,
         (SELECT COUNT(*) FROM claims WHERE status='approved') AS approved_claims`
    );
    return res.json({ stats: rows[0] });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
