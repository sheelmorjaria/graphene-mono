import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import healthRoutes from '../health.js';

/**
 * Integration tests for the health router (src/routes/health.js).
 * Mounts the real router on a real Express app and asserts the health-check
 * response shapes.
 */
describe('Health routes (integration)', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/health', healthRoutes);
  });

  describe('GET /health', () => {
    it('returns 200 OK with status metadata', async () => {
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('OK');
      expect(res.body.timestamp).toEqual(expect.any(String));
      expect(res.body.environment).toEqual(expect.any(String));
      expect(res.body.message).toMatch(/running/i);
      expect(res.body.uptime).toEqual(expect.any(Number));
      expect(res.body.memory).toEqual(expect.any(Object));
    });
  });

  describe('GET /health/simple', () => {
    it('returns 200 OK with a minimal payload', async () => {
      const res = await request(app).get('/health/simple');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('OK');
      expect(res.body.timestamp).toEqual(expect.any(String));
      expect(res.body.uptime).toEqual(expect.any(Number));
      // /simple intentionally omits the memory object
      expect(res.body.memory).toBeUndefined();
    });
  });

  describe('GET /health/ping', () => {
    it('returns 200 with a pong message', async () => {
      const res = await request(app).get('/health/ping');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'pong' });
    });
  });
});
