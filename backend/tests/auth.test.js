// backend/tests/auth.test.js
// Tests for registration, login, and profile endpoints.

const request = require('supertest');
const app     = require('../src/server');
const { pool } = require('../src/db');

// Clean up test users after each test file
afterAll(async () => {
  await pool.query("DELETE FROM users WHERE email LIKE '%@test.campusfind%'");
  await pool.end();
});

describe('Auth routes', () => {
  let token;
  const testUser = {
    name:       'Test Student',
    email:      'student1@test.campusfind',
    password:   'Password123',
    student_id: 'TEST001_AUTH',
  };

  test('POST /api/auth/register – creates a new user', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe(testUser.email);
    expect(res.body.user).not.toHaveProperty('password');
    token = res.body.token;
  });

  test('POST /api/auth/register – rejects duplicate email', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);
    expect(res.status).toBe(409);
  });

  test('POST /api/auth/register – rejects missing fields', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'x@test.campusfind' });
    expect(res.status).toBe(400);
  });

  test('POST /api/auth/login – returns token for valid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email:    testUser.email,
      password: testUser.password,
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    token = res.body.token;
  });

  test('POST /api/auth/login – rejects wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email:    testUser.email,
      password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
  });

  test('GET /api/auth/me – returns current user', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(testUser.email);
  });

  test('GET /api/auth/me – rejects without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('PUT /api/auth/profile – updates name', async () => {
    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Name' });
    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('Updated Name');
  });
});

