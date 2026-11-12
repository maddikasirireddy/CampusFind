// backend/tests/matching.test.js
// Tests for the improved relevance matching engine with synonym mapping and custom subcategories.

const { scoreItems, textSimilarity } = require('../src/matcher');
const { pool } = require('../src/db');

afterAll(async () => { await pool.end(); });

describe('Relevance Matching Engine – scoreItems()', () => {
  const base = {
    category_id: 1, // Electronics
    custom_subcategory: 'Wireless Earbuds',
    location_id: 1, // Main Library
    custom_location: '2nd Floor Reading Area',
    date_occurred: new Date().toISOString(),
    title: 'Black Boat wireless earbuds',
    description: 'Lost black Boat earbuds with charging case near the quiet desks.',
    tags: 'boat,earbuds,black',
    color: 'Black',
    brand: 'Boat',
  };

  test('Perfect match with identical subcategory & specific location scores high (≥ 80)', () => {
    const result = scoreItems(base, { ...base });
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.factors).toMatch(/Same category/);
    expect(result.factors).toMatch(/Matching subcategory/);
  });

  test('Synonyms match correctly (earbuds vs earphones)', () => {
    const similar = {
      ...base,
      custom_subcategory: 'Bluetooth Earphones',
      title: 'Found black earphones in case',
      description: 'Found black wireless earphones on library 2nd floor desk',
    };
    const result = scoreItems(base, similar);
    expect(result.score).toBeGreaterThanOrEqual(60);
    expect(result.factors).toMatch(/Matching subcategory/);
  });

  test('Synonyms match correctly (mobile vs phone vs iphone)', () => {
    const sim = textSimilarity('Silver iPhone', 'Mobile phone in clear case');
    expect(sim).toBeGreaterThanOrEqual(0.2);
  });

  test('Synonyms match correctly (laptop vs notebook)', () => {
    const sim = textSimilarity('Dell laptop computer', 'Notebook charger and laptop');
    expect(sim).toBeGreaterThanOrEqual(0.25);
  });

  test('Missing optional custom subcategory does not penalise a perfect match', () => {
    const withoutSubcat = { ...base, custom_subcategory: null };
    const result = scoreItems(base, withoutSubcat);
    // Subcategory is skipped (not counted as a mismatch), so the score stays high
    expect(result.score).toBeGreaterThanOrEqual(85);
  });

  test('Both items having empty custom_subcategory still score high', () => {
    const a = { ...base, custom_subcategory: null };
    const b = { ...base, custom_subcategory: null };
    expect(scoreItems(a, b).score).toBeGreaterThanOrEqual(85);
  });

  test('Different category loses 20 points', () => {
    const result = scoreItems(base, { ...base, category_id: 99 });
    const fullMatch = scoreItems(base, { ...base });
    expect(result.score).toBe(fullMatch.score - 20);
    expect(result.factors).not.toMatch(/Same category/);
  });

  test('Score is capped between 0 and 100', () => {
    const unrelated = {
      category_id: 5,
      custom_subcategory: 'Guitar pick',
      location_id: 8,
      custom_location: 'Bus Stop Bench',
      date_occurred: '2020-01-01',
      title: 'Completely unrelated sunglasses',
      description: 'Found sunglasses on bench',
      tags: 'glasses',
      color: 'Green',
      brand: 'Rayban'
    };
    const result = scoreItems(base, unrelated);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThan(30);
  });
});