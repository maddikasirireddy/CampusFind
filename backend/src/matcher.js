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
  badge: 'idcard',

  // Keys
  keys: 'key',
  key: 'key',
  keychain: 'key',
  keyring: 'key',

  // Umbrella
  umbrella: 'umbrella',
  parasol: 'umbrella',

  // Notebook / Book / Diary
  notebook: 'book',
  book: 'book',
  diary: 'book',
  journal: 'book',
  textbook: 'book',
  notepad: 'book',
  binder: 'book',

  // Pendrive / USB / Flash drive
  pendrive: 'usb',
  usb: 'usb',
  flashdrive: 'usb',
  thumbdrive: 'usb',
  drive: 'usb',

  // Watch / Smartwatch
  watch: 'watch',
  smartwatch: 'watch',
  iwatch: 'watch',
  fitbit: 'watch',
  smartband: 'watch',
  band: 'watch',

  // Power bank
  powerbank: 'powerbank',

  // Colors
  grey: 'gray',
  gray: 'gray',
  navy: 'blue',
  maroon: 'red',
  golden: 'gold',
  gold: 'gold',
  silver: 'silver',
  rose: 'pink'
};

function stemPlural(word) {
  if (!word || word.length <= 3) return word;
  if (word.endsWith('ies') && word.length > 4) {
    return word.slice(0, -3) + 'y';
  }
  if (word.endsWith('ses') && !word.endsWith('sses') && word.length > 4) {
    return word.slice(0, -1);
  }
  if (word.endsWith('xes') || word.endsWith('ches') || word.endsWith('shes')) {
    return word.slice(0, -2);
  }
  if (word.endsWith('s') && !word.endsWith('ss') && !word.endsWith('us') && !word.endsWith('is')) {
    return word.slice(0, -1);
  }
  return word;
}

function normaliseWord(word) {
  let clean = word.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!clean || clean.length < 2) return null;
  if (SYNONYMS[clean]) clean = SYNONYMS[clean];
  clean = stemPlural(clean);
  if (SYNONYMS[clean]) clean = SYNONYMS[clean];
  return clean;
}

function prepareText(str) {
  if (!str) return '';
  return str.toLowerCase()
    .replace(/\bpower\s+bank\b/g, 'powerbank')
    .replace(/\bflash\s+drive\b/g, 'usb')
    .replace(/\busb\s+drive\b/g, 'usb')
    .replace(/\bpen\s+drive\b/g, 'usb')
    .replace(/\bstudent\s+id\b/g, 'idcard')
    .replace(/\bcollege\s+id\b/g, 'idcard')
    .replace(/\bid\s+card\b/g, 'idcard')
    .replace(/\bair\s*pods\b/g, 'earphones')
    .replace(/\bear\s*buds\b/g, 'earphones')
    .replace(/\bear\s*phones\b/g, 'earphones')
    .replace(/\bhead\s*phones\b/g, 'earphones')
    .replace(/\bsmart\s*watch\b/g, 'watch')
    .replace(/\bkey\s*chain\b/g, 'key')
    .replace(/\bkey\s*ring\b/g, 'key');
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

  const minSize = Math.min(setA.size, setB.size);
  const cappedShared = Math.min(minSize, shared);
  const overlap = minSize > 0 ? cappedShared / minSize : 0;
  const union = setA.size + setB.size - cappedShared;
  const jaccard = union > 0 ? Math.min(1, Math.max(0, cappedShared / union)) : 0;
  return Math.min(1, Math.max(0, 0.7 * overlap + 0.3 * jaccard));
}

function normaliseColor(c) {
  if (!c || typeof c !== 'string') return null;
  const clean = c.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  if (!clean) return null;
  return SYNONYMS[clean] || clean;
}

function normaliseBrand(b) {
  if (!b || typeof b !== 'string') return null;
  const clean = b.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  if (!clean) return null;
  return clean;
}

function dateSimilarity(d1, d2, type1, type2) {
  if (!d1 || !d2) return null;
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  if (isNaN(date1.getTime()) || isNaN(date2.getTime())) return null;

  let lostDate, foundDate;
  if (type1 === 'lost' && type2 === 'found') {
    lostDate = date1;
    foundDate = date2;
  } else if (type1 === 'found' && type2 === 'lost') {
    lostDate = date2;
    foundDate = date1;
  }

  if (lostDate && foundDate) {
    const diffDays = (foundDate - lostDate) / 86400000;
    if (diffDays >= 0) {
      // Found reported on or after lost date: don't penalise 0-3 days gap
      if (diffDays <= 3)  return 1.0;
      if (diffDays <= 7)  return 0.8;
      if (diffDays <= 14) return 0.6;
      if (diffDays <= 30) return 0.4;
      if (diffDays <= 60) return 0.2;
      return 0;
    } else {
      // Found reported before lost date (unusual)
      const absDiff = Math.abs(diffDays);
      if (absDiff <= 1)  return 0.8;
      if (absDiff <= 3)  return 0.5;
      if (absDiff <= 7)  return 0.3;
      return 0;
    }
  }

  const diff = Math.abs(date1 - date2) / 86400000;
  if (diff <= 3)  return 1.0;
  if (diff <= 7)  return 0.8;
  if (diff <= 14) return 0.6;
  if (diff <= 30) return 0.4;
  if (diff <= 60) return 0.2;
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
  let earnedPoints = 0;
  let maxPossiblePoints = 0;
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
    earnedPoints += subcatSim * 10;
    if (subcatSim >= 0.4) {
      factors.push('Matching subcategory');
    }
  }

  // 6. Location (weight 15)
  const hasCampusLoc = a.location_id && b.location_id;
  const hasCustomLoc = a.custom_location && b.custom_location;
  if (hasCampusLoc || hasCustomLoc) {
    maxPossiblePoints += 15;
    let locEarned = 0;
    if (hasCampusLoc && a.location_id === b.location_id) {
      locEarned = 15;
      factors.push('Same location');
      if (hasCustomLoc) {
        const specSim = textSimilarity(a.custom_location, b.custom_location);
        if (specSim >= 0.4) {
          locEarned += 2; // bonus when matching specific spot
          factors.push('Same specific spot');
        }
      }
    } else if (hasCampusLoc && a.location_id !== b.location_id) {
      // Different campus locations -> 40% partial credit (6 points)
      locEarned = 15 * 0.4;
      if (hasCustomLoc) {
        const specSim = textSimilarity(a.custom_location, b.custom_location);
        locEarned += specSim * (15 * 0.6);
      }
      if (locEarned >= 8) {
        factors.push('Nearby location');
      }
    } else if (hasCustomLoc) {
      const specSim = textSimilarity(a.custom_location, b.custom_location);
      locEarned = specSim * 15;
      if (locEarned >= 8) {
        factors.push('Nearby location');
      }
    }
    earnedPoints += Math.min(17, locEarned);
  }

  // 7. Date (weight 5)
  const ds = dateSimilarity(a.date_occurred, b.date_occurred, a.type, b.type);
  if (ds !== null) {
    maxPossiblePoints += 5;
    earnedPoints += ds * 5;
    if (ds >= 0.8) {
      factors.push('Close date');
    }
  }

  if (maxPossiblePoints === 0) {
    return { score: 0, factors: 'No data' };
  }

  let finalScore = (earnedPoints / maxPossiblePoints) * 100;

  // 8. Strong match boost:
  // if category matches AND (title similarity >= 0.6 OR (color and brand both match)), add +10 bonus
  const categoryMatches = Boolean(a.category_id && b.category_id && a.category_id === b.category_id);
  const strongMatch = categoryMatches && (titleSim >= 0.58 || (colorMatches && brandMatches));
  if (strongMatch) {
    finalScore += 10;
  }

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

    const lostId  = item.type === 'lost' ? item.id : candidate.id;
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

module.exports = {
  scoreItems,
  runMatching,
  getUserMatches,
  textSimilarity,
  normaliseWord,
  tokenise,
  SYNONYMS,
  STOPWORDS
};
