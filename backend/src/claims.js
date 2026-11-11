// backend/src/claims.js
// Ownership claim lifecycle: submit claim, view filed/received claims, approve or reject.

const express = require('express');
const { body } = require('express-validator');
const { query } = require('./db');
const { authenticate, validate } = require('./auth');

const router = express.Router();

// POST /api/claims – submit ownership claim
router.post(
  '/',
  authenticate,
  [
    body('item_id').isInt().withMessage('item_id must be an integer'),
    body('message').optional().trim(),
    body('proof').optional().trim(),
  ],
  validate,
  async (req, res) => {
    const { item_id, message, proof } = req.body;
    try {
      const { rows: [item] } = await query('SELECT * FROM items WHERE id=$1', [item_id]);
      if (!item) return res.status(404).json({ error: 'Item not found' });
      if (item.type !== 'found') {
        return res.status(400).json({ error: 'Can only claim found items' });
      }
      if (item.status === 'returned') {
        return res.status(400).json({ error: 'Item already returned' });
      }
      if (item.user_id === req.user.id) {
        return res.status(400).json({ error: 'Cannot claim your own report' });
      }

      const { rows } = await query(
        `INSERT INTO claims (item_id, claimant_id, message, proof)
         VALUES ($1,$2,$3,$4) RETURNING *`,
        [item_id, req.user.id, message || null, proof || null]
      );
      const claim = rows[0];

      await query("UPDATE items SET status='claimed' WHERE id=$1", [item_id]);

      await query(
        `INSERT INTO notifications (user_id, type, title, message, ref_id, ref_type)
         VALUES ($1,'claim',$2,$3,$4,'claim')`,
        [
          item.user_id,
          `Claim received for "${item.title}"`,
          'A student has claimed ownership. Review and respond.',
          claim.id,
        ]
      );

      return res.status(201).json({ claim });
    } catch (err) {
      if (err.code === '23505') {
        return res.status(409).json({ error: 'You have already filed a claim for this item' });
      }
      console.error('POST /claims error:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  }
);

// GET /api/claims/mine – claims filed by current user
router.get('/mine', authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT cl.*, i.title AS item_title, i.type AS item_type, i.status AS item_status,
              i.description AS item_desc
       FROM claims cl
       JOIN items i ON i.id = cl.item_id
       WHERE cl.claimant_id = $1
       ORDER BY cl.created_at DESC`,
      [req.user.id]
    );
    return res.json({ claims: rows });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/claims/received – claims received on items reported by current user
router.get('/received', authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT cl.*, i.title AS item_title, i.description AS item_desc,
              u.name AS claimant_name, u.email AS claimant_email,
              u.student_id AS claimant_student_id
       FROM claims cl
       JOIN items i ON i.id = cl.item_id
       JOIN users u ON u.id = cl.claimant_id
       WHERE i.user_id = $1
       ORDER BY cl.created_at DESC`,
      [req.user.id]
    );
    return res.json({ claims: rows });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/claims/:id – approve or reject claim
router.put(
  '/:id',
  authenticate,
  [
    body('status').isIn(['approved','rejected']).withMessage('Status must be approved or rejected'),
    body('admin_note').optional().trim(),
  ],
  validate,
  async (req, res) => {
    const { status, admin_note } = req.body;
    try {
      const { rows: [claim] } = await query(
        `SELECT cl.*, i.user_id AS item_owner_id, i.title AS item_title
         FROM claims cl
         JOIN items i ON i.id = cl.item_id
         WHERE cl.id = $1`,
        [req.params.id]
      );
      if (!claim) return res.status(404).json({ error: 'Claim not found' });

      if (claim.item_owner_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorised' });
      }

      const { rows } = await query(
        `UPDATE claims SET status=$1, admin_note=$2, resolved_at=NOW()
         WHERE id=$3 RETURNING *`,
        [status, admin_note || null, req.params.id]
      );

      if (status === 'approved') {
        await query("UPDATE items SET status='returned' WHERE id=$1", [claim.item_id]);

        await query(
          `INSERT INTO notifications (user_id, type, title, message, ref_id, ref_type)
           VALUES ($1,'approved',$2,$3,$4,'claim')`,
          [
            claim.claimant_id,
            `Claim approved for "${claim.item_title}"`,
            'Your ownership claim has been approved. Please collect your item.',
            claim.id,
          ]
        );
      } else {
        await query(
          `INSERT INTO notifications (user_id, type, title, message, ref_id, ref_type)
           VALUES ($1,'rejected',$2,$3,$4,'claim')`,
          [
            claim.claimant_id,
            `Claim rejected for "${claim.item_title}"`,
            admin_note || 'Your claim was not approved.',
            claim.id,
          ]
        );
        await query("UPDATE items SET status='active' WHERE id=$1 AND status='claimed'", [claim.item_id]);
      }

      return res.json({ claim: rows[0] });
    } catch (err) {
      console.error('PUT /claims/:id error:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  }
);

// GET /api/claims/all (admin only)
router.get('/all', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  try {
    const { rows } = await query(
      `SELECT cl.*, i.title AS item_title, i.type AS item_type,
              u.name AS claimant_name, u.email AS claimant_email
       FROM claims cl
       JOIN items i ON i.id = cl.item_id
       JOIN users u ON u.id = cl.claimant_id
       ORDER BY cl.created_at DESC`
    );
    return res.json({ claims: rows });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
