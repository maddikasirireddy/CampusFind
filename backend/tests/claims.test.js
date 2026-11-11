// backend/tests/claims.test.js
// Tests for claim creation, receipt, and resolution.

const request  = require('supertest');
const app      = require('../src/server');
const { pool } = require('../src/db');

let reporterToken, claimantToken;
let foundItemId, claimId;

beforeAll(async () => {
  // Clean previous test data
  await pool.query("DELETE FROM users WHERE email LIKE '%@claimtest.campusfind%'");

  // Reporter registers and creates a found item
  const r1 = await request(app).post('/api/auth/register').send({
    name: 'Reporter', email: 'reporter@claimtest.campusfind',
    password: 'Password123', student_id: 'CLM_RPT_001',
  });
  reporterToken = r1.body.token;

  const r2 = await request(app).post('/api/auth/register').send({
    name: 'Claimant', email: 'claimant@claimtest.campusfind',
    password: 'Password123', student_id: 'CLM_CLM_001',
  });
  claimantToken = r2.body.token;

  // Reporter creates a found item
  const itemRes = await request(app)
    .post('/api/items')
    .set('Authorization', `Bearer ${reporterToken}`)
    .send({
      type: 'found', title: 'Found Blue Wallet',
      description: 'Found a blue leather wallet near cafeteria',
    });
  foundItemId = itemRes.body.item.id;
});

afterAll(async () => {
  await pool.query("DELETE FROM users WHERE email LIKE '%@claimtest.campusfind%'");
  await pool.end();
});

describe('Claims routes', () => {
  test('POST /api/claims – claimant files a claim', async () => {
    const res = await request(app)
      .post('/api/claims')
      .set('Authorization', `Bearer ${claimantToken}`)
      .send({
        item_id: foundItemId,
        message: 'This is my wallet, it has my university ID inside.',
        proof:   'Blue leather, has photo ID of Priya Patel inside.',
      });
    expect(res.status).toBe(201);
    expect(res.body.claim.item_id).toBe(foundItemId);
    claimId = res.body.claim.id;
  });

  test('POST /api/claims – duplicate claim is rejected', async () => {
    const res = await request(app)
      .post('/api/claims')
      .set('Authorization', `Bearer ${claimantToken}`)
      .send({ item_id: foundItemId, message: 'Again' });
    expect(res.status).toBe(409);
  });

  test('GET /api/claims/mine – claimant sees their claim', async () => {
    const res = await request(app)
      .get('/api/claims/mine')
      .set('Authorization', `Bearer ${claimantToken}`);
    expect(res.status).toBe(200);
    const found = res.body.claims.some(c => c.id === claimId);
    expect(found).toBe(true);
  });

  test('GET /api/claims/received – reporter sees received claim', async () => {
    const res = await request(app)
      .get('/api/claims/received')
      .set('Authorization', `Bearer ${reporterToken}`);
    expect(res.status).toBe(200);
    const found = res.body.claims.some(c => c.id === claimId);
    expect(found).toBe(true);
  });

  test('PUT /api/claims/:id – reporter approves claim', async () => {
    const res = await request(app)
      .put(`/api/claims/${claimId}`)
      .set('Authorization', `Bearer ${reporterToken}`)
      .send({ status: 'approved', admin_note: 'Ownership verified' });
    expect(res.status).toBe(200);
    expect(res.body.claim.status).toBe('approved');
  });
});

