import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { adminLoginIpAllowlist } from '../ipAllowlist.js';

const buildRes = () => {
  const res = {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; }
  };
  return res;
};

describe('adminLoginIpAllowlist', () => {
  const ORIGINAL = process.env.ADMIN_LOGIN_ALLOWED_IPS;

  afterEach(() => {
    if (ORIGINAL === undefined) delete process.env.ADMIN_LOGIN_ALLOWED_IPS;
    else process.env.ADMIN_LOGIN_ALLOWED_IPS = ORIGINAL;
  });

  it('allows all requests when the env var is unset (guard off)', () => {
    delete process.env.ADMIN_LOGIN_ALLOWED_IPS;
    let nexted = false;
    adminLoginIpAllowlist({ ip: '1.2.3.4', ips: [] }, buildRes(), () => { nexted = true; });
    expect(nexted).toBe(true);
  });

  it('allows all requests when the env var is empty', () => {
    process.env.ADMIN_LOGIN_ALLOWED_IPS = '  ';
    let nexted = false;
    adminLoginIpAllowlist({ ip: '1.2.3.4', ips: [] }, buildRes(), () => { nexted = true; });
    expect(nexted).toBe(true);
  });

  it('allows a request whose req.ip is in the list', () => {
    process.env.ADMIN_LOGIN_ALLOWED_IPS = '84.45.134.166, 10.0.0.5';
    let nexted = false;
    adminLoginIpAllowlist({ ip: '84.45.134.166', ips: [] }, buildRes(), () => { nexted = true; });
    expect(nexted).toBe(true);
  });

  it('403s (generic message) when req.ip is not in the list', () => {
    process.env.ADMIN_LOGIN_ALLOWED_IPS = '84.45.134.166';
    const res = buildRes();
    let nexted = false;
    adminLoginIpAllowlist({ ip: '203.0.113.9', ips: [] }, res, () => { nexted = true; });
    expect(nexted).toBe(false);
    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ success: false, error: 'Access denied.' });
  });

  it('matches via the forwarded chain (req.ips) as a fallback', () => {
    process.env.ADMIN_LOGIN_ALLOWED_IPS = '84.45.134.166';
    let nexted = false;
    adminLoginIpAllowlist({ ip: '172.17.0.1', ips: ['84.45.134.166', '172.17.0.1'] }, buildRes(), () => { nexted = true; });
    expect(nexted).toBe(true);
  });
});
