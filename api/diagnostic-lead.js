const { notifyDiagnosticLead } = require('./_lib/notifyLead');
const { isRateLimited, getClientIp } = require('./_lib/rateLimit');

// Reemplaza el POST a Netlify Forms que diagnostico.html usaba antes de la
// migración a Vercel (Vercel no procesa data-netlify, ese POST no llegaba
// a ningún lado). Mismo lead, mismo momento de disparo, solo cambia el
// mecanismo de entrega.
//
// También lo usa el formulario simple de contacto de la home (mismo bug,
// mismo fix): ese envío no trae score/nivel/canales/brechas, solo rubro.

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  if (isRateLimited(getClientIp(req), { max: 5, windowMs: 10 * 60 * 1000 })) {
    res.status(429).json({ error: 'rate_limited' });
    return;
  }

  const body = req.body || {};
  const { nombre, whatsapp, score, nivel, canales, brechas, rubro, requestId, problema_declarado, respuestas } = body;

  if (typeof nombre !== 'string' || !nombre.trim() || typeof whatsapp !== 'string' || !whatsapp.trim()) {
    res.status(400).json({ error: 'missing_fields' });
    return;
  }

  if ((requestId !== undefined && (typeof requestId !== 'string' || !/^[a-zA-Z0-9_-]{16,100}$/.test(requestId))) ||
      (respuestas !== undefined && !validAnswers(respuestas))) {
    res.status(400).json({ error: 'invalid_fields' });
    return;
  }

  try {
    const receipt = await notifyDiagnosticLead({
    nombre: nombre.trim().slice(0, 200),
    whatsapp: whatsapp.trim().slice(0, 60),
    score: score,
    nivel: nivel || '',
    canales: canales || '',
    brechas: brechas || '',
    rubro: rubro ? String(rubro).slice(0, 120) : '',
    ...(requestId ? { requestId } : {}),
    problema_declarado: problema_declarado ? String(problema_declarado).slice(0, 500) : '',
    ...(respuestas ? { respuestas } : {}),
  });
    res.status(200).json({ ok: true, ...receipt });
  } catch (error) {
    res.status(error.status || 502).json({ error: error.status ? error.message : 'contact_delivery_unconfirmed', stored: false, delivery: { status: 'unconfirmed' }, retryable: true });
  }
};

function validAnswers(answers) {
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) return false;
  const choices = {
    q1: ['whatsapp', 'ml', 'tiendanube', 'redes'], q2: ['boca', 'ads', 'mlads', 'seo', 'nada'],
    q3: ['no_mide', 'mide_algo', 'mide_bien'], q4: ['f1', 'f2', 'f3', 'f4'],
    q5: ['sin_clientes', 'ads_sin_retorno', 'desconectado', 'sin_tiempo', 'sin_datos'],
  };
  return Object.keys(answers).every((key) => Object.hasOwn(choices, key)) &&
    Object.keys(choices).every((key) => key === 'q1' || key === 'q2'
      ? Array.isArray(answers[key]) && answers[key].length > 0 && answers[key].length <= choices[key].length && answers[key].every((v) => choices[key].includes(v))
      : choices[key].includes(answers[key]));
}
