import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { connectDB, disconnectDB } from '../config/db.js';

describe('PP-01 Backend Foundation & Health API', () => {
  it('GET /api/health should return standard success envelope', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('status', 'OK');
    expect(res.body.data).toHaveProperty('service', 'PeoplePay360 Backend');
    expect(res.body.data).toHaveProperty('database');
  });

  it('404 route should return standard error envelope', async () => {
    const res = await request(app).get('/api/non-existent-endpoint');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toHaveProperty('code', 'NOT_FOUND');
    expect(res.body.error).toHaveProperty('message');
  });

  it('Malformed JSON payload should return 400 INVALID_JSON error envelope', async () => {
    const res = await request(app)
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send('{ malformed json ');

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toHaveProperty('code', 'INVALID_JSON');
    expect(res.body.error.message).toContain('Malformed JSON');
  });

  it('connectDB should throw on bad URI', async () => {
    const badUri = 'mongodb://127.0.0.1:9999/nonexistentdb?serverSelectionTimeoutMS=500';
    await expect(connectDB(badUri)).rejects.toThrow();
  });
});
