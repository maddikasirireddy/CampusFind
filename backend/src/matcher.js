// backend/src/matcher.js
// Rule-based relevance matching engine with synonym mapping and match factors explanation.

const { query } = require('./db');

// Small synonym dictionary mapping terms to their canonical form
const SYNONYMS = {
  earbuds: 'earphones',
  earphones: 'earphones',
  airpods: 'earphones',
  headphones: 'earphones',
  headset: 'earphones',
  earpiece: 'earphones',
  mobile: 'phone',
  cellphone: 'phone',
  smartphone: 'phone',
  iphone: 'phone',
  phone: 'phone',
  laptop: 'laptop',
  notebook: 'laptop',
  macbook: 'laptop',
  computer: 'laptop',
  calculator: 'calculator',
  specs: 'glasses',
  spectacles: 'glasses',
  sunglasses: 'glasses',
  eyeglasses: 'glasses',
  bottle: 'bottle',
  flask: 'bottle',
  backpack: 'bag',
  bag: 'bag',
  handbag: 'bag',
  purse: 'wallet',
  wallet: 'wallet',
  charger: 'charger',
  cable: 'charger',
  cord: 'charger',
  adapter: 'charger',
  card: 'idcard',
  id: 'idcard',
  idcard: 'idcard',
  keys: 'keys',
  keychain: 'keys'
};

function normaliseWord(word) {
  const clean = word.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!clean || clean.length < 2) return null;
  return SYNONYMS[clean] || clean;
}

function tokenise(str) {
  if (!str) return new Set();
  const words = str.toLowerCase().split(/[\s,._\-/\\()]+/);
  const set = new Set();
  for (const w of words) {
    const norm = normaliseWord(w);
    if (norm && norm.length >= 2) set.add(norm);
  }
  return set;
}

function textSimilarity(a, b) {
  const setA = tokenise(a);
  const setB = tokenise(b);
  if (!setA.size || !setB.size) return 0;

  let shared = 0;
  for (const t of setA) {
    if (setB.has(t)) {
      shared++;
    } else {
      // Partial prefix/contains match for terms >= 4 chars
      for (const target of setB) {
        if ((t.length >= 4 && target.startsWith(t)) || (target.length >= 4 && t.startsWith(target))) {
          shared += 0.5;
          break;
        }
      }
    }
  }

  const union = setA.size + setB.size - shared;
  return union > 0 ? Math.min(1, shared / union) : 0;
}

function dateSimilarity(d1, d2) {
  if (!d1 || !d2) return 0.2;
  const diff = Math.abs(new Date(d1) - new Date(d2)) / 86400000;
  if (diff <= 1)  return 1.0;
  if (diff <= 3)  return 0.8;
  if (diff <= 7)  return 0.6;
  if (diff <= 14) return 0.4;
  if (diff <= 30) return 0.2;
  return 0;
}

/**
 * Calculates a 0–100 Match Relevance score:
 * - Main Category: 20 points
 * - Custom Subcategory similarity: 20 points
 * - Title & Description similarity: 30 points
 * - Main and Specific Location similarity: 20 points
 * - Date proximity: 10 points
 */
function scoreItems(a, b) {
  let score = 0;
  const factors = [];

  // 1. Main Category: 20 points
  if (a.category_id && b.category_id && a.category_id === b.category_id) {
    score += 20;
    factors.push('Same category');
  }

  // 2. Custom Subcategory similarity: 20 points
  // If either is missing, score is 0 for this dimension (no inflation for empty fields)
  if (a.custom_subcategory && b.custom_subcategory) {
    const subcatSim = textSimilarity(a.custom_subcategory, b.custom_subcategory);
    const subcatPoints = Math.round(subcatSim * 20);
    score += subcatPoints;
    if (subcatPoints >= 6) factors.push('Matching subcategory');
  }

  // 3. Title & Description similarity: 30 points
  const textA = `${a.title || ''} ${a.description || ''} ${a.tags || ''} ${a.color || ''} ${a.brand || ''}`;
  const textB = `${b.title || ''} ${b.description || ''} ${b.tags || ''} ${b.color || ''} ${b.brand || ''}`;
  const descSim = textSimilarity(textA, textB);
  const descPoints = Math.round(descSim * 30);
  score += descPoints;
  if (descPoints >= 12) factors.push('Similar description');

  // 4. Main and Specific Location similarity: 20 points
  // Main location: up to 12 points
  let locPoints = 0;
  if (a.location_id && b.location_id && a.location_id === b.location_id) {
    locPoints += 12;
    // Specific location: up to 8 points if both provided
    if (a.custom_location && b.custom_location) {
      const specLocSim = textSimilarity(a.custom_location, b.custom_location);
      locPoints += Math.round(specLocSim * 8);
    }
  } else if (a.custom_location && b.custom_location) {
    // Both specified custom locations without matching campus location
    const specLocSim = textSimilarity(a.custom_location, b.custom_location);
    locPoints += Math.round(specLocSim * 12);
  }
  score += locPoints;
  if (locPoints >= 10) factors.push('Nearby location');

  // 5. Date proximity: 10 points
  const ds = dateSimilarity(a.date_occurred, b.date_occurred);
  const datePoints = Math.round(ds * 10);
  score += datePoints;
  if (datePoints >= 8) factors.push('Close date');

  return {
    score: Math.min(score, 100),
    factors: factors.join(', ') || 'Partial keyword match'
  };
}

async function runMatching(itemId) {
  const { rows: [item] } = await query(
    "SELECT * FROM items WHERE id=$1 AND status='active'",
    [itemId]
  );
  if (!item) return;

  const oppositeType = item.type === 'lost' ? 'found' : 'lost';

  // Only compare active lost reports with active found reports within last 60 days
  const { rows: candidates } = await query(
    `SELECT * FROM items
     WHERE type=$1 AND status='active' AND id != $2
       AND (date_occurred IS NULL OR date_occurred >= NOW() - INTERVAL '60 days')`,
    [oppositeType, itemId]
  );

  for (const candidate of candidates) {
    const { score, factors } = scoreItems(item, candidate);
    if (score < 30) continue;

    const lostId  = item.type === 'lost' ? item.id : candidate.id;
    const foundId = item.type === 'lost' ? candidate.id : item.id;

    await query(
      `INSERT INTO matches (lost_id, found_id, score, factors)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (lost_id, found_id)
       DO UPDATE SET score = GREATEST(matches.score, EXCLUDED.score),
                     factors = EXCLUDED.factors`,
      [lostId, foundId, score, factors]
    );

    const msgA = `Match Relevance: ${score}%. Factors: ${factors}`;
    await query(
      `INSERT INTO notifications (user_id, type, title, message, ref_id, ref_type)
       VALUES ($1, 'match', $2, $3, $4, 'item')`,
      [item.user_id, `Match relevance for "${item.title}"`, msgA, candidate.id]
    );

    const msgB = `Match Relevance: ${score}%. Factors: ${factors}`;
    await query(
      `INSERT INTO notifications (user_id, type, title, message, ref_id, ref_type)
       VALUES ($1, 'match', $2, $3, $4, 'item')`,
      [candidate.user_id, `Match relevance for "${candidate.title}"`, msgB, item.id]
    );
  }
}

async function getUserMatches(userId) {
  const { rows } = await query(
    `SELECT m.*,
            li.title AS lost_title,  li.description AS lost_desc,
            li.type  AS lost_type,   li.status AS lost_status,
            li.custom_subcategory AS lost_subcategory,
            li.custom_location AS lost_specific_location,
            lu.name  AS lost_reporter,
            fi.title AS found_title, fi.description AS found_desc,
            fi.type  AS found_type,  fi.status AS found_status,
            fi.custom_subcategory AS found_subcategory,
            fi.custom_location AS found_specific_location,
            fu.name  AS found_reporter
     FROM matches m
     JOIN items li ON li.id = m.lost_id
     JOIN items fi ON fi.id = m.found_id
     JOIN users lu ON lu.id = li.user_id
     JOIN users fu ON fu.id = fi.user_id
     WHERE (li.user_id = $1 OR fi.user_id = $1)
       AND m.status = 'pending'
       AND li.status = 'active'
       AND fi.status = 'active'
     ORDER BY m.score DESC, m.created_at DESC`,
    [userId]
  );
  return rows;
}

module.exports = { scoreItems, runMatching, getUserMatches, textSimilarity, SYNONYMS };
