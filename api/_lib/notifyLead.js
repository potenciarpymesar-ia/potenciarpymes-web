// Preserve existing delivery providers. Accepted delivery is not durable CRM
// storage or final mailbox delivery. Only an optional explicit webhook storage
// receipt may claim stored:true; that external contract remains unverified.

// Los campos del lead vienen del visitante -- escapar antes de embeber en
// el HTML del email (si alguien pone "<img src=x onerror=...>" como nombre,
// no queremos que el cliente de mail lo interprete).
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

async function dispatch(webhookPayload, subject, html) {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  let webhookRejected = false;
  if (webhookUrl) {
    let response;
    try {
      response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...(webhookPayload.requestId ? { 'idempotency-key': webhookPayload.requestId } : {}) },
        body: JSON.stringify(webhookPayload),
        signal: AbortSignal.timeout(8000),
      });
    } catch {
      // An uncertain delivery must not automatically notify twice via a fallback.
      throw deliveryError(502);
    }
    if (response.ok) {
      let receipt;
      try { receipt = await response.json(); } catch { receipt = null; }
      const stored = receipt?.stored === true && typeof receipt.leadId === 'string' && !!receipt.leadId.trim() && receipt.leadId.length <= 200;
      const status = ['accepted', 'sent', 'failed', 'not_configured'].includes(receipt?.notification?.status)
        ? receipt.notification.status : 'accepted';
      if (!stored && status === 'failed') throw deliveryError(502);
      return { stored, ...(stored ? { leadId: receipt.leadId } : {}), delivery: { status: 'accepted', provider: 'n8n' }, notification: { status } };
    }
    webhookRejected = true;
  }
  const resendKey = process.env.RESEND_API_KEY;
  const notifyTo = process.env.LEAD_NOTIFY_EMAIL || 'info@potenciarpymes.ar';
  if (!resendKey) {
    throw deliveryError(webhookRejected ? 502 : 503);
  }

  const htmlDoc = `<!doctype html><html><head><meta charset="utf-8"></head><body>${html}</body></html>`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${resendKey}`,
        'content-type': 'application/json; charset=utf-8',
        ...(webhookPayload.requestId ? { 'idempotency-key': `lead-notify-${webhookPayload.requestId}` } : {}),
      },
      body: JSON.stringify({
        from: process.env.LEAD_NOTIFY_FROM || 'Potenciar Pymes <leads@potenciarpymes.ar>',
        to: notifyTo,
        subject,
        html: htmlDoc,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error('notification_http_error');
    const notification = await response.json();
    if (typeof notification?.id !== 'string' || !notification.id) throw new Error('notification_receipt_missing');
    return { stored: false, delivery: { status: 'accepted', provider: 'resend' }, notification: { status: 'accepted' } };
  } catch {
    throw deliveryError(502);
  }
}

function deliveryError(status) {
  const error = new Error(status === 503 ? 'contact_delivery_unavailable' : 'contact_delivery_unconfirmed');
  error.status = status;
  return error;
}

// Lead de la Auditoría web automática (api/audit-teaser/reveal.js)
async function notifyLead(lead) {
  const failedList = (lead.itemsFallidos || [])
    .map((i) => `<li>[${i.severity}] ${i.label} (${i.area})</li>`)
    .join('');

  const html = `
    <h2>Nuevo lead — Auditoría web automática</h2>
    <p><strong>Código de referencia:</strong> ${escapeHtml(lead.auditId)}</p>
    <p><strong>Nombre:</strong> ${escapeHtml(lead.nombre)}</p>
    <p><strong>WhatsApp:</strong> ${escapeHtml(lead.whatsapp)}</p>
    <p><strong>Web auditada:</strong> ${escapeHtml(lead.url)}</p>
    <p><strong>Tipo de negocio:</strong> ${escapeHtml(lead.tipoNegocio)}</p>
    <p><strong>Problema principal:</strong> ${escapeHtml(lead.problema)}</p>
    <p><strong>Puntaje:</strong> ${lead.score.passed} / ${lead.score.total}</p>
    <p><strong>Áreas con problemas:</strong> ${escapeHtml(lead.areasWithIssues.join(', ')) || 'ninguna'}</p>
    <p><strong>Detalle (interno, no se le mostró al visitante):</strong></p>
    <ul>${failedList || '<li>ninguno</li>'}</ul>
  `;

  return dispatch(
    { source: 'auditoria-web', ...lead },
    `Nuevo lead auditoría web — ${lead.nombre} (${lead.auditId})`,
    html
  );
}

// Lead del diagnóstico de 5 preguntas (api/diagnostic-lead.js), o del
// formulario simple de contacto de la home (mismo endpoint, sin score).
async function notifyDiagnosticLead(lead) {
  const isQuiz = !!lead.respuestas || (lead.score !== undefined && lead.score !== null && lead.score !== '');

  const html = isQuiz ? `
    <h2>Nuevo lead — Diagnóstico inicial (5 preguntas)</h2>
    <p><strong>Nombre:</strong> ${escapeHtml(lead.nombre)}</p>
    <p><strong>WhatsApp:</strong> ${escapeHtml(lead.whatsapp)}</p>
    <p><strong>Orientación:</strong> ${escapeHtml(lead.nivel)}</p>
    <p><strong>Problema declarado:</strong> ${escapeHtml(lead.problema_declarado || '-')}</p>
    <p><strong>Canales actuales:</strong> ${escapeHtml(lead.canales)}</p>
    <p><strong>Áreas con más para mejorar:</strong> ${escapeHtml(lead.brechas)}</p>
  ` : `
    <h2>Nuevo lead — Formulario de contacto (home)</h2>
    <p><strong>Nombre:</strong> ${escapeHtml(lead.nombre)}</p>
    <p><strong>WhatsApp:</strong> ${escapeHtml(lead.whatsapp)}</p>
    <p><strong>Rubro:</strong> ${escapeHtml(lead.rubro || '-')}</p>
  `;

  const subject = isQuiz
    ? `Nuevo lead diagnóstico — ${lead.nombre}`
    : `Nuevo lead contacto (home) — ${lead.nombre}`;

  return dispatch(
    { source: isQuiz ? 'diagnostico' : 'home_contacto', ...lead },
    subject,
    html
  );
}

module.exports = { notifyLead, notifyDiagnosticLead };
