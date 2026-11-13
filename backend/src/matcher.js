// backend/src/matcher.js
// Rule-based relevance matching engine with synonym mapping, overlap scoring, and match factors explanation.

const { query } = require('./db');

const STOPWORDS = new Set([
  'the', 'a', 'an', 'in', 'on', 'at', 'near', 'with', 'and', 'of',
  'my', 'is', 'was', 'lost', 'found', 'item', 'has', 'have', 'from',
  'by', 'to', 'for', 'it', 'its', 'this', 'that', 'these', 'those',
  'there', 'here', 'or', 'as', 'be', 'been', 'are', 'were', 'so',
  'no', 'not', 'but', 'some', 'any', 'i', 'me', 'our', 'your', 'his',
  'her', 'their', 'all', 'into', 'out', 'up', 'down', 'about'
]);

// Synonym dictionary mapping terms to their canonical form
const SYNONYMS = {
  // Earphones / Earbuds / Headphones / Audio
  earbuds: 'earphones',
  earbud: 'earphones',
  earphones: 'earphones',
  earphone: 'earphones',
  airpods: 'earphones',
  airpod: 'earphones',
  headphones: 'earphones',
  headphone: 'earphones',
  headset: 'earphones',
  earpiece: 'earphones',
  buds: 'earphones',
  bud: 'earphones',

  // Phone / Mobile
  mobile: 'phone',
  cellphone: 'phone',
  smartphone: 'phone',
  iphone: 'phone',
  android: 'phone',
  phone: 'phone',

  // Laptop / Computer
  laptop: 'laptop',
  macbook: 'laptop',
  computer: 'laptop',
  pc: 'laptop',

  // Calculator
  calculator: 'calculator',

  // Spectacles / Glasses
  specs: 'glasses',
  spectacles: 'glasses',
  spectacle: 'glasses',
  sunglasses: 'glasses',
  sunglass: 'glasses',
  eyeglasses: 'glasses',
  eyeglass: 'glasses',
  glasses: 'glasses',
  glass: 'glasses',
  shades: 'glasses',
  frames: 'glasses',

  // Bottle / Flask / Tumbler
  bottle: 'bottle',
  flask: 'bottle',
  tumbler: 'bottle',
  thermos: 'bottle',
  sipper: 'bottle',
  hydroflask: 'bottle',

  // Bags
  backpack: 'bag',
  bag: 'bag',
  handbag: 'bag',
  tote: 'bag',
  rucksack: 'bag',
  satchel: 'bag',

  // Wallet
  purse: 'wallet',
  wallet: 'wallet',
  billfold: 'wallet',
  pouch: 'wallet',

  // Charger / Cables
  charger: 'charger',
  cable: 'charger',
  cord: 'charger',
  adapter: 'charger',
  wire: 'charger',

  // ID Cards
  card: 'idcard',
  id: 'idcard',
  idcard: 'idcard',
  keys: 'keys',
  keychain: 'keys'
};

function normaliseWord(word) {
  let clean = word.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!clean || clean.length < 2) return null;
  return SYNONYMS[clean] || clean;
}

function tokenise(str) {
  if (!str) return new Set();
  const prepared = prepareText(str);
  const words = prepared.toLowerCase().split(/[\s,._\-/\\()]+/);
  const set = new Set();
  for (const w of words) {
    const clean = w.replace(/[^a-z0-9]/g, '');
    if (!clean || clean.length < 2 || STOPWORDS.has(clean)) continue;
    const norm = normaliseWord(clean);
    if (norm && norm.length >= 2 && !STOPWORDS.has(norm)) {
      set.add(norm);
    }
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
 * - Category: 15 points
 * - Title: 25 points
 * - Description & Tags: 15 points
 * - Color & Brand: 15 points (Color 7.5, Brand 7.5)
 * - Custom Subcategory: 10 points
 * - Location: 15 points
 * - Date proximity: 5 points
 * 
 * Dimensions where either item lacks data are excluded from the denominator.
 * Rescaled score = (earnedPoints / maxPossiblePointsForAvailableDimensions) * 100.
 * A +10 bonus is added for strong matches.
 */
function scoreItems(a, b) {
  let score = 0;
  const factors = [];

  // 1. Category (weight 15)
  if (a.category_id && b.category_id) {
    maxPossiblePoints += 15;
    if (a.category_id === b.category_id) {
      earnedPoints += 15;
      factors.push('Same category');
    }
  }

  // 2. Title (weight 25)
  let titleSim = 0;
  if (a.title && b.title) {
    maxPossiblePoints += 25;
    titleSim = textSimilarity(a.title, b.title);
    earnedPoints += titleSim * 25;
    if (titleSim >= 0.4) {
      factors.push('Similar title');
    }
  }

  // 3. Description + Tags (weight 15)
  const descA = `${a.description || ''} ${a.tags || ''}`.trim();
  const descB = `${b.description || ''} ${b.tags || ''}`.trim();
  if (descA && descB) {
    maxPossiblePoints += 15;
    const descSim = textSimilarity(descA, descB);
    earnedPoints += descSim * 15;
    if (descSim >= 0.35) {
      factors.push('Similar description');
    }
  }

  // 4. Color + Brand (weight 15: Color 7.5, Brand 7.5)
  let colorMatches = false;
  if (a.color && b.color) {
    maxPossiblePoints += 7.5;
    const normColorA = normaliseColor(a.color);
    const normColorB = normaliseColor(b.color);
    if (normColorA && normColorB && normColorA === normColorB) {
      colorMatches = true;
      earnedPoints += 7.5;
      factors.push('Matching color');
    }
  }

  let brandMatches = false;
  if (a.brand && b.brand) {
    maxPossiblePoints += 7.5;
    const normBrandA = normaliseBrand(a.brand);
    const normBrandB = normaliseBrand(b.brand);
    if (normBrandA && normBrandB && normBrandA === normBrandB) {
      brandMatches = true;
      earnedPoints += 7.5;
      factors.push('Matching brand');
    }
  }

  // 5. Custom Subcategory (weight 10)
  if (a.custom_subcategory && b.custom_subcategory) {
    maxPossiblePoints += 10;
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
    score: Math.min(100, Math.max(0, Math.round(finalScore))),
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
    if (score < 25) continue;

    const lostId = item.type === 'lost' ? item.id : candidate.id;
    const foundId = item.type === 'lost' ? candidate.id : item.id;

    // Check existing match to avoid duplicate notifications
    const { rows: existingRows } = await query(
      `SELECT score FROM matches WHERE lost_id = $1 AND found_id = $2`,
      [lostId, foundId]
    );

    const existingMatch = existingRows[0];
    const isNew = !existingMatch;
    const scoreIncreased = existingMatch && (score - existingMatch.score >= 10);

    await query(
      `INSERT INTO matches (lost_id, found_id, score, factors)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (lost_id, found_id)
       DO UPDATE SET score = GREATEST(matches.score, EXCLUDED.score),
                     factors = EXCLUDED.factors`,
      [lostId, foundId, score, factors]
    );

    // Only notify if the match is new or the score increased by 10+ points
    if (isNew || scoreIncreased) {
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
