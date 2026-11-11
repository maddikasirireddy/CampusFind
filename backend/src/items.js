// backend/src/items.js
// Items CRUD, search, filter, and lookup routes with custom_subcategory and custom_location support.

const express = require('express');
const { body } = require('express-validator');
const { query } = require('./db');
const { authenticate, validate } = require('./auth');
const { runMatching } = require('./matcher');

const router = express.Router();

// GET /api/items/lookup/categories
router.get('/lookup/categories', authenticate, async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM categories ORDER BY name');
    return res.json({ categories: rows });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/items/lookup/locations
router.get('/lookup/locations', authenticate, async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM locations ORDER BY name');
    return res.json({ locations: rows });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/items/user/mine
router.get('/user/mine', authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT i.*,
              c.name AS category_name, c.icon AS category_icon,
              l.name AS location_name
       FROM items i
       LEFT JOIN categories c ON c.id = i.category_id
       LEFT JOIN locations  l ON l.id = i.location_id
       WHERE i.user_id = $1
       ORDER BY i.created_at DESC`,
      [req.user.id]
    );
    return res.json({ items: rows });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/items (search & filter)
router.get('/', authenticate, async (req, res) => {
  const {
    type, category_id, location_id, status,
    subcategory, keyword, date_from, date_to, page = 1, limit = 20
  } = req.query;

  const conditions = [];
  const params = [];
  let p = 1;

  if (type)        { conditions.push(`i.type = $${p++}`);             params.push(type); }
  if (category_id) { conditions.push(`i.category_id = $${p++}`);      params.push(category_id); }
  if (location_id) { conditions.push(`i.location_id = $${p++}`);      params.push(location_id); }
  if (status)      { conditions.push(`i.status = $${p++}`);           params.push(status); }
  if (date_from)   { conditions.push(`i.date_occurred >= $${p++}`);   params.push(date_from); }
  if (date_to)     { conditions.push(`i.date_occurred <= $${p++}`);   params.push(date_to); }
  if (subcategory) {
    conditions.push(`i.custom_subcategory ILIKE $${p++}`);
    params.push(`%${subcategory}%`);
  }
  if (keyword) {
    conditions.push(
      `(to_tsvector('english', i.title || ' ' || i.description || ' ' || COALESCE(i.custom_subcategory,'') || ' ' || COALESCE(i.custom_location,'') || ' ' || COALESCE(i.tags,''))
        @@ plainto_tsquery('english', $${p++})
       OR i.title ILIKE $${p++}
       OR i.description ILIKE $${p++}
       OR i.custom_subcategory ILIKE $${p++}
       OR i.custom_location ILIKE $${p++}
       OR i.tags ILIKE $${p++})`
    );
    params.push(keyword, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  try {
    const countRes = await query(`SELECT COUNT(*) FROM items i ${where}`, params);
    const total = parseInt(countRes.rows[0].count, 10);

    params.push(parseInt(limit, 10), offset);
    const dataRes = await query(
      `SELECT i.*,
              u.name AS reporter_name, u.email AS reporter_email,
              c.name AS category_name, c.icon AS category_icon,
              l.name AS location_name
       FROM items i
       LEFT JOIN users     u ON u.id = i.user_id
       LEFT JOIN categories c ON c.id = i.category_id
       LEFT JOIN locations  l ON l.id = i.location_id
       ${where}
       ORDER BY i.created_at DESC
       LIMIT $${p++} OFFSET $${p++}`,
      params
    );

    return res.json({
      items: dataRes.rows,
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / parseInt(limit, 10)),
    });
  } catch (err) {
    console.error('GET /items error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/items/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT i.*,
              u.name AS reporter_name, u.email AS reporter_email, u.phone AS reporter_phone,
              c.name AS category_name, c.icon AS category_icon,
              l.name AS location_name
       FROM items i
       LEFT JOIN users     u ON u.id = i.user_id
       LEFT JOIN categories c ON c.id = i.category_id
       LEFT JOIN locations  l ON l.id = i.location_id
       WHERE i.id = $1`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Item not found' });
    return res.json({ item: rows[0] });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/items
router.post(
  '/',
  authenticate,
  [
    body('type').isIn(['lost','found']).withMessage('type must be lost or found'),
    body('title').trim().notEmpty().withMessage('Title required'),
    body('description').trim().notEmpty().withMessage('Description required'),
  ],
  validate,
  async (req, res) => {
    const {
      type, title, description, category_id, custom_subcategory,
      location_id, custom_location, date_occurred,
      color, brand, tags, image_url,
    } = req.body;

    try {
      const { rows } = await query(
        `INSERT INTO items
           (user_id, type, title, description, category_id, custom_subcategory,
            location_id, custom_location, date_occurred,
            color, brand, tags, image_url)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
        [
          req.user.id, type, title, description,
          category_id || null,
          custom_subcategory ? custom_subcategory.trim() : null,
          location_id || null,
          custom_location ? custom_location.trim() : null,
          date_occurred || null,
          color || null, brand || null, tags || null, image_url || null,
        ]
      );

      const item = rows[0];

      // Asynchronously trigger matching
      setImmediate(() => runMatching(item.id).catch(console.error));

      await query(
        `INSERT INTO activity_log (user_id, action, details)
         VALUES ($1, 'create_item', $2)`,
        [req.user.id, `Created ${type} report: ${title}`]
      );

      return res.status(201).json({ item });
    } catch (err) {
      console.error('POST /items error:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  }
);

// PUT /api/items/:id
router.put(
  '/:id',
  authenticate,
  [
    body('title').optional().trim().notEmpty(),
    body('description').optional().trim().notEmpty(),
    body('status').optional().isIn(['active','claimed','returned','closed']),
  ],
  validate,
  async (req, res) => {
    try {
      const existing = await query('SELECT * FROM items WHERE id=$1', [req.params.id]);
      if (!existing.rows[0]) return res.status(404).json({ error: 'Item not found' });

      const item = existing.rows[0];
      if (item.user_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorised' });
      }

      const {
        title, description, category_id, custom_subcategory,
        location_id, custom_location,
        date_occurred, color, brand, tags, image_url, status,
      } = req.body;

      const { rows } = await query(
        `UPDATE items SET
           title              = COALESCE($1, title),
           description        = COALESCE($2, description),
           category_id        = $3,
           custom_subcategory = $4,
           location_id        = $5,
           custom_location    = $6,
           date_occurred      = COALESCE($7, date_occurred),
           color              = COALESCE($8, color),
           brand              = COALESCE($9, brand),
           tags               = COALESCE($10, tags),
           image_url          = COALESCE($11, image_url),
           status             = COALESCE($12, status)
         WHERE id = $13 RETURNING *`,
        [
          title || null,
          description || null,
          category_id !== undefined ? (category_id || null) : item.category_id,
          custom_subcategory !== undefined ? (custom_subcategory ? custom_subcategory.trim() : null) : item.custom_subcategory,
          location_id !== undefined ? (location_id || null) : item.location_id,
          custom_location !== undefined ? (custom_location ? custom_location.trim() : null) : item.custom_location,
          date_occurred || null,
          color || null,
          brand || null,
          tags || null,
          image_url || null,
          status || null,
          req.params.id,
        ]
      );

      return res.json({ item: rows[0] });
    } catch (err) {
      console.error('PUT /items/:id error:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  }
);

// DELETE /api/items/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const existing = await query('SELECT * FROM items WHERE id=$1', [req.params.id]);
    if (!existing.rows[0]) return res.status(404).json({ error: 'Item not found' });

    const item = existing.rows[0];
    if (item.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorised' });
    }

    await query('DELETE FROM items WHERE id=$1', [req.params.id]);
    return res.json({ message: 'Item deleted' });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
