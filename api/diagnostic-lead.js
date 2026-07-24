const { notifyDiagnosticLead } = require('./_lib/notifyLead');

// Reemplaza el POST a Netlify Forms que diagnostico.html usaba antes de la
// migración a Vercel (Vercel no procesa data-netlify, ese POST no llegaba
// a ningún lado). Mismo lead, mismo momento de disparo, solo cambia el
// mecanismo de entrega.

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const body = req.body || {};
  const { nombre, whatsapp, score, nivel, canales, brechas } = body;

  if (!nombre || !whatsapp) {
    res.status(400).json({ error: 'missing_fields' });
    return;
  }

  await notifyDiagnosticLead({
    nombre: String(nombre).slice(0, 200),
    whatsapp: String(whatsapp).slice(0, 60),
    score: score,
    nivel: nivel || '',
    canales: canales || '',
    brechas: brechas || '',
  });

  res.status(200).json({ ok: true });
};
