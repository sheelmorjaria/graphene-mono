// Unit tests for the admin-login brute-force limiter.
// The limiter is a test-env passthrough (mirroring routes/auth.js authLimiter),
// so these tests force NODE_ENV=production BEFORE dynamically importing the
// middleware — in a fresh vitest worker the module evaluates then, taking the
// real rateLimit branch.
process.env.NODE_ENV = 'production';

import { describe, it, expect, beforeAll } from 'vitest';
import express from 'express';
import request from 'supertest';

let adminLoginLimiter;

beforeAll(async () => {
  ({ adminLoginLimiter } = await import('../rateLimiter.js'));
});

const buildApp = () => {
  const app = express();
  app.use(express.json());
  // Simulates a successful admin login
  app.post('/ok', adminLoginLimiter, (req, res) => res.status(200).json({ ok: true }));
  // Simulates a failed admin login (bad credentials)
  app.post('/fail', adminLoginLimiter, (req, res) => res.status(401).json({ ok: false }));
  return app;
};

describe('adminLoginLimiter', () => {
  it('successful logins never trip the limit (skipSuccessfulRequests)', async () => {
    const app = buildApp();
    for (let i = 0; i < 7; i++) {
      const res = await request(app).post('/ok');
      expect(res.status).toBe(200);
    }
  });

  it('5 failed attempts from one IP get a 429 with the lockout message', async () => {
    const app = buildApp();
    for (let i = 0; i < 5; i++) {
      const res = await request(app).post('/fail');
      expect(res.status).toBe(401);
    }
    const blocked = await request(app).post('/fail');
    expect(blocked.status).toBe(429);
    expect(blocked.body.error).toBe('Too many admin login attempts. Please try again later.');
    // The block applies to the endpoint (any further request), not just repeats
    const alsoBlocked = await request(app).post('/ok');
    expect(alsoBlocked.status).toBe(429);
  });
});
