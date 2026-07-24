// Rate limit best-effort, en memoria (sin infra nueva). No es perfecto entre
// cold starts o regiones distintas de Vercel, pero corta el abuso obvio de un
// form publico (loops, bots pegandole en serie) sin agregar una base de datos.

const buckets = new Map(); // ip -> timestamps (ms)

function getClientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return String(fwd).split(',')[0].trim();
  return (req.socket && req.socket.remoteAddress) || 'unknown';
}

function isRateLimited(ip, { max = 5, windowMs = 10 * 60 * 1000 } = {}) {
  const now = Date.now();
  const recent = (buckets.get(ip) || []).filter((t) => now - t < windowMs);
  recent.push(now);
  buckets.set(ip, recent);

  if (buckets.size > 5000) {
    for (const [key, times] of buckets) {
      if (times.every((t) => now - t >= windowMs)) buckets.delete(key);
    }
  }

  return recent.length > max;
}

module.exports = { isRateLimited, getClientIp };
