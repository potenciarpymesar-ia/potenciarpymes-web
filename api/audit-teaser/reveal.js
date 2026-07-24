const crypto = require('node:crypto');
const { notifyLead } = require('../_lib/notifyLead');
const { isRateLimited, getClientIp } = require('../_lib/rateLimit');

const MAX_TOKEN_AGE_MS = 30 * 60 * 1000; // 30 min

function verifyToken(token, secret) {
  if (typeof token !== 'string' || !token.includes('.')) return null;
  const [b64, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', secret).update(b64).digest('base64url');
  const sigBuf = Buffer.from(sig || '', 'utf8');
  const expBuf = Buffer.from(expected, 'utf8');
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return null;

  let payload;
  try {
    payload = JSON.parse(Buffer.from(b64, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  if (!payload || typeof payload.createdAt !== 'number') return null;
  if (Date.now() - payload.createdAt > MAX_TOKEN_AGE_MS) return null;
  return payload;
}

function buildRecommendation(score, severityCounts) {
  const ratio = score.total > 0 ? score.passed / score.total : 1;
  if (severityCounts.alto >= 3 || ratio < 0.5) {
    return 'Tu web tiene varias áreas críticas sin resolver. Te conviene una Auditoría Full para ver el detalle completo y las prioridades.';
  }
  if (severityCounts.alto >= 1 || ratio < 0.75) {
    return 'Hay puntos importantes para corregir. Una Auditoría Full te da el detalle exacto y por dónde arrancar.';
  }
  return 'La base técnica está relativamente ordenada. El siguiente paso lógico es revisar redes y canales de venta, que este chequeo automático no cubre.';
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
    console.error('reveal.js: falta AUDIT_TOKEN_SECRET en las env vars de Vercel');
    res.status(500).json({ error: 'server_misconfigured' });
    return;
  }

  const body = req.body || {};
  const { token, nombre, whatsapp, tipoNegocio, problema } = body;

  if (
    !token ||
    !nombre || typeof nombre !== 'string' || !nombre.trim() ||
    !whatsapp || typeof whatsapp !== 'string' || !whatsapp.trim()
  ) {
    res.status(400).json({ error: 'missing_fields' });
    return;
  }

  const payload = verifyToken(token, secret);
  if (!payload) {
    res.status(400).json({ error: 'invalid_or_expired_token' });
    return;
  }

  const { result } = payload;
  const auditId = crypto.createHash('sha256').update(token).digest('hex').slice(0, 8).toUpperCase();
  const itemsFallidos = result.items.filter((i) => i.ok === false);

  await notifyLead({
    auditId,
    nombre: nombre.trim(),
    whatsapp: whatsapp.trim(),
    tipoNegocio: (tipoNegocio || '').trim() || 'no especificado',
    problema: (problema || '').trim() || 'no especificado',
    url: result.url,
    score: result.score,
    areasWithIssues: result.areasWithIssues,
    itemsFallidos,
  });

  res.status(200).json({
    auditId,
    score: result.score,
    severityCounts: result.severityCounts,
    areasWithIssues: result.areasWithIssues,
    recommendation: buildRecommendation(result.score, result.severityCounts),
  });
};
