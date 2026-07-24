// Notificación de leads: hoy manda email (Resend). El día que la VM de n8n
// esté lista, definir N8N_WEBHOOK_URL en las env vars de Vercel y este mismo
// módulo empieza a postear ahí en vez de mandar el email, sin tocar quien lo llama.

async function dispatch(webhookPayload, subject, html) {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(webhookPayload),
      });
      return;
    } catch (err) {
      console.error('notifyLead: fallo el webhook de n8n', err);
      // sigue e intenta el fallback de email
    }
  }

  const resendKey = process.env.RESEND_API_KEY;
  const notifyTo = process.env.LEAD_NOTIFY_EMAIL || 'potenciarpymes.ar@gmail.com';
  if (!resendKey) {
    console.error('notifyLead: falta RESEND_API_KEY (y no hay N8N_WEBHOOK_URL) — lead solo queda en logs', webhookPayload);
    return;
  }

  const htmlDoc = `<!doctype html><html><head><meta charset="utf-8"></head><body>${html}</body></html>`;

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${resendKey}`,
        'content-type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        from: process.env.LEAD_NOTIFY_FROM || 'Potenciar Pymes <leads@potenciarpymes.ar>',
        to: notifyTo,
        subject,
        html: htmlDoc,
      }),
    });
  } catch (err) {
    console.error('notifyLead: fallo el envío por Resend', err, webhookPayload);
  }
}

// Lead de la Auditoría web automática (api/audit-teaser/reveal.js)
async function notifyLead(lead) {
  const failedList = (lead.itemsFallidos || [])
    .map((i) => `<li>[${i.severity}] ${i.label} (${i.area})</li>`)
    .join('');

  const html = `
    <h2>Nuevo lead — Auditoría web automática</h2>
    <p><strong>Código de referencia:</strong> ${lead.auditId}</p>
    <p><strong>Nombre:</strong> ${lead.nombre}</p>
    <p><strong>WhatsApp:</strong> ${lead.whatsapp}</p>
    <p><strong>Web auditada:</strong> ${lead.url}</p>
    <p><strong>Tipo de negocio:</strong> ${lead.tipoNegocio}</p>
    <p><strong>Problema principal:</strong> ${lead.problema}</p>
    <p><strong>Puntaje:</strong> ${lead.score.passed} / ${lead.score.total}</p>
    <p><strong>Áreas con problemas:</strong> ${lead.areasWithIssues.join(', ') || 'ninguna'}</p>
    <p><strong>Detalle (interno, no se le mostró al visitante):</strong></p>
    <ul>${failedList || '<li>ninguno</li>'}</ul>
  `;

  await dispatch(
    { source: 'auditoria-web', ...lead },
    `Nuevo lead auditoría web — ${lead.nombre} (${lead.auditId})`,
    html
  );
}

// Lead del diagnóstico de 5 preguntas (api/diagnostic-lead.js)
async function notifyDiagnosticLead(lead) {
  const html = `
    <h2>Nuevo lead — Diagnóstico inicial (5 preguntas)</h2>
    <p><strong>Nombre:</strong> ${lead.nombre}</p>
    <p><strong>WhatsApp:</strong> ${lead.whatsapp}</p>
    <p><strong>Puntaje:</strong> ${lead.score} / 5 (${lead.nivel})</p>
    <p><strong>Canales actuales:</strong> ${lead.canales}</p>
    <p><strong>Áreas con más para mejorar:</strong> ${lead.brechas}</p>
  `;

  await dispatch(
    { source: 'diagnostico', ...lead },
    `Nuevo lead diagnóstico — ${lead.nombre} (${lead.score}/5)`,
    html
  );
}

module.exports = { notifyLead, notifyDiagnosticLead };
