const crypto = require('node:crypto');
const { runWebChecks, normalizeUrl, assertSafeUrl } = require('../_lib/webChecks');
const { isRateLimited, getClientIp } = require('../_lib/rateLimit');

function signPayload(payload, secret) {
  const json = JSON.stringify(payload);
  const b64 = Buffer.from(json, 'utf8').toString('base64url');
  const hmac = crypto.createHmac('sha256', secret).update(b64).digest('base64url');
  return `${b64}.${hmac}`;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  if (isRateLimited(getClientIp(req), { max: 5, windowMs: 10 * 60 * 1000 })) {
    res.status(429).json({ error: 'rate_limited' });
    return;
  }

  const secret = process.env.AUDIT_TOKEN_SECRET;
  if (!secret) {
    console.error('start.js: falta AUDIT_TOKEN_SECRET en las env vars de Vercel');
    res.status(500).json({ error: 'server_misconfigured' });
    return;
  }

  const rawUrl = req.body && req.body.url;
  if (!rawUrl || typeof rawUrl !== 'string' || rawUrl.length > 300) {
    res.status(400).json({ error: 'invalid_url' });
    return;
  }

  let normalized;
  try {
    normalized = normalizeUrl(rawUrl);
    await assertSafeUrl(normalized);
  } catch {
    res.status(400).json({ error: 'invalid_url' });
    return;
  }

  const result = await runWebChecks(normalized);

  const payload = {
    v: 1,
    createdAt: Date.now(),
    result,
  };

  const token = signPayload(payload, secret);
  res.status(200).json({ token });
};
