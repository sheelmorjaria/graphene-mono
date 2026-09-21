// IP allowlist for the admin login endpoint.
//
// Gated by ADMIN_LOGIN_ALLOWED_IPS (comma-separated exact IPs). Unset/empty
// means the guard is OFF (login is protected by rate limiting alone), which
// is also the lockout recovery path: clear the env var and the endpoint
// reopens without a code change.
//
// req.ip is the real client IP in production (app.set('trust proxy', 1) —
// CapRover's nginx is the single trusted hop). req.ips (the forwarded chain)
// is accepted as a fallback for defensive matching.
export const adminLoginIpAllowlist = (req, res, next) => {
  const raw = process.env.ADMIN_LOGIN_ALLOWED_IPS;
  if (!raw || !raw.trim()) {
    return next();
  }

  const allowed = raw.split(',').map((ip) => ip.trim()).filter(Boolean);
  const clientIps = [req.ip, ...(req.ips || [])].filter(Boolean);

  if (clientIps.some((ip) => allowed.includes(ip))) {
    return next();
  }

  // Deliberately generic — no detail about why the request was refused
  return res.status(403).json({ success: false, error: 'Access denied.' });
};
