# Contactos y cuestionario — entrega local revisable

Validación: 2026-10-03. Sin commit, push ni deploy. Se conserva el trabajo visual local previo. El ZIP anterior es una línea base: no contiene estas correcciones posteriores.

## Cambios de esta etapa

- `api/_lib/notifyLead.js`: espera el resultado del proveedor, distingue aceptación de envío, recibo explícito de almacenamiento y estado de notificación. No considera un email aceptado como almacenamiento. Rechaza respuestas insuficientes y evita fallback duplicado ante respuesta incierta del webhook.
- `api/diagnostic-lead.js` y `api/audit-teaser/reveal.js`: propagan el estado confirmado; no devuelven éxito incondicional. El cálculo de checks, puntajes y recomendaciones de Audit no se modificó.
- `contact-client.js`: exige un recibo válido, limita el tiempo de espera a 25 segundos, evita solicitudes simultáneas y reutiliza identidad de solicitud en reintentos idénticos.
- `index.html`, `web-profesional.html`, `auditoria-web.html`, `diagnostico.html`: muestran éxito después de la aceptación confirmada. `contact_sent` es envío; `contact_saved` y `generate_lead` requieren `stored: true` e identificador. Los errores conservan datos y habilitan reintento.
- `diagnostico.html`: orientación declarativa sin puntuación de madurez. El problema elegido define el primer tema, seguido de recomendaciones aplicables a respuestas expresas. No penaliza falta de ecommerce, publicidad o Mercado Libre; facturación no determina calidad. Bloquea navegación mientras se envía para evitar resultado/respuestas inconsistentes.
- `index.html`: sólo hasta 767 px, foto de menor altura con `object-fit: contain` y CTA del encabezado «Empezar». No cambia copy del hero, fuente, colores ni reglas desktop/tablet.

## Contrato y límites

1. **Solicitud recibida por un proveedor:** n8n acepta la petición o Resend devuelve un identificador de envío. Esto permite confirmar «solicitud enviada», no lectura del correo ni contacto guardado.
2. **Contacto guardado:** sólo un recibo explícito `stored: true` con `leadId` permite ese estado. Un identificador de email no es `leadId`. No se conectó CRM ni se creó almacenamiento nuevo, por decisión del usuario.
3. **Notificación:** aceptación del proveedor no acredita entrega al buzón. Si hay un recibo de almacenamiento válido pero la notificación falla, ambos estados permanecen separados.
4. **Reintentos:** la identidad de solicitud se conserva localmente para un payload idéntico. No acredita deduplicación persistente del workflow o proveedor.

## Pruebas reproducibles

Desde la raíz del repositorio:

```powershell
node --test tests/*.test.cjs
node scripts/build-design-tokens.cjs --check
git diff --check
```

Resultado: **57 pruebas PASS, 0 FAIL**, contrastes de tokens PASS y diff sin errores de whitespace (advertencias LF/CRLF no son fallos).

| Pruebas | Cantidad | Qué aceptan/verifican |
| --- | ---: | --- |
| `tests/contact-storage.test.cjs` | 24 | Sin proveedor; HTTP/red/timeout; Resend sin identificador; recibo de almacenamiento; notificación separada; webhook rechazado o incierto; fallback y payload validado. |
| `tests/contact-client.test.cjs` | 7 | HTTP 200 insuficiente rechazado; estados separados; proveedor desconocido; datos e identidad en reintento; duplicados simultáneos; JSON inválido. |
| `tests/diagnostic-quiz.test.cjs` | 13 | Los cinco problemas primero; perfiles profesional/comercio/servicio; invariancia ante facturación; ninguna prescripción de canales ausentes; fallo, reintento, doble clic, bloqueo de navegación y eventos posteriores al recibo. |
| Pruebas previas del sistema visual | 13 | Contratos de tokens/componentes y accesibilidad definidos por las pruebas existentes. No equivalen a auditoría WCAG completa. |

Validador local adicional: `node ../tmp/validate-diagnostic-journeys.cjs`. PASS: 30 HTML, 159 scripts, 29 bloques JSON-LD y 490 destinos locales. Es validación estática/sintáctica, no un validador W3C ni prueba de entrega de email. Se retiró su antigua exigencia de conservar `calcScore`, incompatible con la corrección aprobada.

## Pruebas de interfaz realizadas

Servidor aislado: `node ../tmp/diagnostic-preview-server.cjs 8843`, en `http://localhost:8843`. Usa handlers actuales con proveedores y contenido público simulados; elimina tracking externo y bloquea enlaces WhatsApp. No utilizar como backend productivo. Rate limiting se desactiva sólo en este harness, por lo que no se valida aquí.

- Home: 320, 360, 390 y 430 px; foto completa sin crop, CTA del encabezado en una línea, sin overflow. Captura desktop a 1440 px y reglas mobile aisladas; no hay cambio de estilo desktop en este ajuste.
- Cuestionario: WhatsApp/local, referidos, sin medición, facturación baja y falta de tiempo. Fallo HTTP 500: conserva contacto/respuestas, muestra error y no emite guardado. Reintento: orientación primero «recuperar tiempo», luego información para decidir; `diagnostico_contact_sent`, nunca `generate_lead` ni `_saved`.
- Chequeo: `https://example.com` mediante fixture público. Inicio por teclado, error en reveal, contacto/token conservados y reintento hasta resultado; `audit_contact_sent` y `audit_result_shown`, no `_saved`.
- Home y Web Profesional: formulario con datos TEST, aceptación simulada, `contact_sent`, sin `generate_lead`; formulario se limpia sólo después de aceptar.
- No overflow en resultados móviles. Sin errores JavaScript registrados durante la prueba final.
- Contador final del harness: audit 1, diagnostic-lead 3, **notificaciones reales 0**.

Reproducir el error local, manteniendo el formulario abierto en otra pestaña:

```powershell
Invoke-RestMethod 'http://localhost:8843/_qa/failure?stage=diagnostic-lead'
# Enviar cuestionario o formulario y comprobar datos conservados + ausencia de _saved.
Invoke-RestMethod 'http://localhost:8843/_qa/failure'
# Reintentar sin recargar: verificar contact_sent y resultado.
Invoke-RestMethod 'http://localhost:8843/_qa/failure?stage=reveal'
# Repetir el mismo escenario con el contacto del chequeo web.
Invoke-RestMethod 'http://localhost:8843/_qa/failure'
Invoke-RestMethod 'http://localhost:8843/_qa/status'
```

Datos usados exclusivamente: `TEST POTENCIAR PYMES`, `000000000000`. Ningún dato de terceros ni contacto externo.

## Capturas actualizadas

Carpeta fuera del repositorio: `../tmp/functional-qa-2026-10-03/`.

- `home-320.jpg`, `home-360.jpg`, `home-390.jpg`, `home-430.jpg`, `home-1440.jpg`.
- `quiz-error-390.jpg`, `quiz-result-390.jpg`.
- `audit-error-390.jpg`, `audit-result-390.jpg`.
- `home-contact-sent-390.jpg`, `web-professional-contact-sent-390.jpg`.

## Contraste con pendientes reproducidos

| Observación | Estado actual | Responsabilidad |
| --- | --- | --- |
| Éxito sin acreditación y eventos previos al guardado | Resuelto en contrato/código y aceptación simulada. No se afirma almacenamiento por email. | Web |
| Error pierde respuestas o no permite reintentar | Resuelto; pruebas VM y UI con fallo/reintento. | Web |
| Penalizar canales posiblemente innecesarios | Resuelto en recomendaciones; no queda score arbitrario. | Web |
| Excluir el problema declarado | Resuelto para los cinco problemas; probado con perfiles distintos. | Web |
| Diferencia cuestionario/chequeo/pago | Conservada: respuestas / señales públicas / revisión humana contextual y plan. | Web |
| Confirmar entrega efectiva al buzón | Pendiente de prueba autorizada con proveedor real; no inferir de HTTP 2xx. | Operación email |
| CRM/persistencia durable | No integrado, expresamente fuera de alcance. | CRM futuro |
| Deduplicación durable del workflow | No acreditada por estas pruebas. | Integración existente |
| Texto «Hay puntos importantes para corregir. Una Auditoría Full…» y etiquetas de urgencia automáticas | Reproducido; sigue visible y no fue ocultado ni reescrito en esta etapa. | Audit Engine |
| Cuestionario vende/online y rangos de facturación en ARS | Sigue siendo limitación de preguntas para algunos profesionales; ya no altera puntuación ni prioridad. | Web, siguiente decisión de contenido |

## Revisión independiente

Agente independiente confirmó 57/57 PASS, recibo en los cuatro consumidores, sin P0/P1 concretos pendientes en el código de este alcance. Detectó y se corrigieron dos P1 con pruebas: notificación n8n fallida sin almacenamiento y edición del cuestionario durante envío pendiente. No verificó buzón ni CRM reales.

La solución está implementada en las páginas indicadas, no sólo documentada como patrón del design system. No se declara verificación de almacenamiento externo o entrega real que no se haya ejecutado.
