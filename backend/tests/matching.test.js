// backend/tests/matching.test.js
// Tests for the improved relevance matching engine with synonym mapping, overlap scoring, and rebalanced weights.

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

  test('Missing optional custom subcategory does not inflate score', () => {
    const withoutSubcat = { ...base, custom_subcategory: null };
    const result = scoreItems(base, withoutSubcat);
    // Custom subcategory score should be 0 because one item is missing it
    const fullMatch = scoreItems(base, { ...base });
    expect(result.score).toBeLessThanOrEqual(fullMatch.score - 15);
  });

  test('Both items having empty custom_subcategory gets 0 subcategory points (no inflation)', () => {
    const a = { ...base, custom_subcategory: null };
    const b = { ...base, custom_subcategory: null };
    const resultWith = scoreItems(base, { ...base });
    const resultBothEmpty = scoreItems(a, b);
    expect(resultBothEmpty.score).toBe(resultWith.score - 20);
  });

  test('Different category loses category points and strong boost', () => {
    const result = scoreItems(base, { ...base, category_id: 99 });
    const fullMatch = scoreItems(base, { ...base });
    expect(result.score).toBeLessThanOrEqual(fullMatch.score - 10);
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

  // Additional tests required by prompt

  test('(a) Perfect-match example (lost black Boat earbuds vs found black wireless earphones near library) scores >= 90', () => {
    const lost = {
      category_id: 1,
      location_id: 1,
      custom_location: '2nd Floor Reading Area',
      date_occurred: new Date().toISOString(),
      title: 'black Boat earbuds',
      description: 'Lost black Boat earbuds with charging case near library quiet desks.',
      color: 'Black',
      brand: 'Boat',
      type: 'lost'
    };
    const found = {
      category_id: 1,
      location_id: 1,
      custom_location: 'library 2nd floor desk',
      date_occurred: new Date().toISOString(),
      title: 'black wireless earphones near library',
      description: 'Found black wireless earphones near library on quiet desk',
      color: 'Black',
      brand: 'Boat',
      type: 'found'
    };
    const result = scoreItems(lost, found);
    expect(result.score).toBeGreaterThanOrEqual(90);
  });

  test('(b) Same item with extra long description still scores >= 80', () => {
    const longDescFound = {
      ...base,
      description: base.description + ' Finder noticed the item on Monday afternoon around 3:30 PM while walking past the second floor quiet study area near the engineering reference section. It was sitting on a wooden desk next to some abandoned notebooks, blue pens, highlighters, and coffee cups. Please verify the serial number or model to claim.'
    };
    const result = scoreItems(base, longDescFound);
    expect(result.score).toBeGreaterThanOrEqual(80);
  });

  test('(c) Missing subcategory and custom_location does not reduce a perfect match below 85', () => {
    const lost = {
      category_id: 1,
      location_id: 1,
      custom_subcategory: null,
      custom_location: null,
      date_occurred: new Date().toISOString(),
      title: 'Black Boat wireless earbuds',
      description: 'Lost black Boat earbuds with charging case',
      tags: 'boat,earbuds,black',
      color: 'Black',
      brand: 'Boat',
    };
    const found = {
      category_id: 1,
      location_id: 1,
      custom_subcategory: null,
      custom_location: null,
      date_occurred: new Date().toISOString(),
      title: 'Black Boat wireless earbuds',
      description: 'Found black Boat earbuds with charging case',
      tags: 'boat,earbuds,black',
      color: 'Black',
      brand: 'Boat',
    };
    const result = scoreItems(lost, found);
    expect(result.score).toBeGreaterThanOrEqual(85);
  });

  test('(d) Completely unrelated items in different categories score < 25', () => {
    const unrelated = {
      category_id: 4, // Clothing
      location_id: 8,
      custom_location: 'Bus Stop Bench',
      date_occurred: '2020-01-01',
      title: 'Green Umbrella',
      description: 'Found green umbrella on rainy day bench',
      tags: 'umbrella,rain',
      color: 'Green',
      brand: 'Totes'
    };
    const result = scoreItems(base, unrelated);
    expect(result.score).toBeLessThan(25);
  });

  test('(e) Same category but different color, brand, and title scores < 60', () => {
    const differentItem = {
      category_id: 1, // Electronics
      location_id: 1,
      date_occurred: new Date().toISOString(),
      title: 'Silver Dell Inspiron Laptop',
      description: 'Found silver Dell laptop computer notebook with power charger cord',
      tags: 'dell,laptop',
      color: 'Silver',
      brand: 'Dell'
    };
    const result = scoreItems(base, differentItem);
    expect(result.score).toBeLessThan(60);
  });

  test('(f) Synonyms match (earbuds/earphones, mobile/phone, specs/glasses)', () => {
    const sim1 = textSimilarity('black Boat earbuds', 'black wireless earphones');
    const sim2 = textSimilarity('Silver mobile', 'Apple phone');
    const sim3 = textSimilarity('Designer specs', 'Reading glasses');
    expect(sim1).toBeGreaterThanOrEqual(0.4);
    expect(sim2).toBeGreaterThanOrEqual(0.3);
    expect(sim3).toBeGreaterThanOrEqual(0.3);
  });
});