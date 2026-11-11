// backend/tests/items.test.js
// Tests for item CRUD, custom subcategory, and custom specific location.

const request  = require('supertest');
const app      = require('../src/server');
const { pool } = require('../src/db');

let token;
let createdItemId;

beforeAll(async () => {
  await pool.query("DELETE FROM users WHERE email='itemtest@test.campusfind'");
  const reg = await request(app).post('/api/auth/register').send({
    name:       'Item Tester',
    email:      'itemtest@test.campusfind',
    password:   'Password123',
    student_id: 'TEST_ITEMS_001',
  });
  token = reg.body.token;
});

afterAll(async () => {
  await pool.query("DELETE FROM users WHERE email='itemtest@test.campusfind'");
  await pool.end();
});

describe('Items routes with custom subcategory & location', () => {
  test('POST /api/items – creates a lost item with custom subcategory & custom location', async () => {
    const res = await request(app)
      .post('/api/items')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type:               'lost',
        title:              'Dell Inspiron Laptop',
        description:        'Silver Dell laptop with red sticker left on table',
        category_id:        1,
        custom_subcategory: 'Laptop Charger',
        location_id:        1,
        custom_location:    '2nd Floor Reading Area',
        color:              'Silver',
        brand:              'Dell',
        tags:               'laptop,dell,silver',
      });
    expect(res.status).toBe(201);
    expect(res.body.item.type).toBe('lost');
    expect(res.body.item.custom_subcategory).toBe('Laptop Charger');
    expect(res.body.item.custom_location).toBe('2nd Floor Reading Area');
    createdItemId = res.body.item.id;
  });

  test('POST /api/items – rejects missing title', async () => {
    const res = await request(app)
      .post('/api/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'lost', description: 'No title' });
    expect(res.status).toBe(400);
  });

  test('GET /api/items – returns items list', async () => {
    const res = await request(app)
      .get('/api/items')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  test('GET /api/items?subcategory=Charger – filters by custom subcategory', async () => {
    const res = await request(app)
      .get('/api/items?subcategory=Charger')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    const found = res.body.items.some(i => i.id === createdItemId);
    expect(found).toBe(true);
  });

  test('GET /api/items?keyword=Reading – searches across specific location', async () => {
    const res = await request(app)
      .get('/api/items?keyword=Reading')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    const found = res.body.items.some(i => i.id === createdItemId);
    expect(found).toBe(true);
  });

  test('GET /api/items/:id – returns single item with subcategory & custom location', async () => {
    const res = await request(app)
      .get(`/api/items/${createdItemId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.item.id).toBe(createdItemId);
    expect(res.body.item.custom_subcategory).toBe('Laptop Charger');
    expect(res.body.item.custom_location).toBe('2nd Floor Reading Area');
  });

  test('PUT /api/items/:id – updates custom subcategory', async () => {
    const res = await request(app)
      .put(`/api/items/${createdItemId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ custom_subcategory: 'Wireless Earbuds' });
    expect(res.status).toBe(200);
    expect(res.body.item.custom_subcategory).toBe('Wireless Earbuds');
  });

  test('DELETE /api/items/:id – deletes item', async () => {
    const res = await request(app)
      .delete(`/api/items/${createdItemId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});
