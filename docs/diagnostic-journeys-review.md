# Recorridos de diagnóstico — revisión en desarrollo

Estado: cambios locales, sin commit, push ni publicación. Backend, scoring, checks, documentos Audit, redirects e infraestructura sin cambios.

## Mapa definitivo

| Entrada | Qué hace | Resultado | Siguiente paso opcional |
| --- | --- | --- | --- |
| Home / Por dónde empezar | Presenta dos alternativas gratuitas independientes | No exige completar ambas | Conocer el servicio pago |
| /diagnostico — Diagnóstico inicial gratis | Cinco preguntas; orientación basada en respuestas declaradas; con o sin web | En la misma página, después de nombre y WhatsApp | /diagnostico-digital |
| /auditoria-web — Chequeo web gratis | URL; señales públicas observables; sin acceso a cuentas | En la misma página, después de nombre y WhatsApp | /diagnostico-digital |
| /diagnostico-digital — Diagnóstico Digital Completo | Página comercial del servicio pago asistido | No es un resultado personalizado | Clic para consultar por WhatsApp |

Los resultados gratuitos no redirigen automáticamente a la landing comercial. No se cambió la obligatoriedad de contacto.

## Copy principal

### Home

- Diagnóstico inicial gratis: “Respondé cinco preguntas sobre tu negocio y recibí una orientación inicial basada en tus respuestas. No necesitás tener una web.”
- CTA: RESPONDER LAS 5 PREGUNTAS.
- Chequeo web gratis: “Ingresá la dirección de tu web para revisar las señales públicas que puede comprobar nuestro chequeo.”
- CTA: REVISAR MI WEB.
- Diagnóstico Digital Completo / Pago: entender la situación, validar hallazgos y definir prioridades. Alcance y valor acordados antes de comenzar; implementación opcional cotizada por separado.
- CTA: CONOCER EL DIAGNÓSTICO COMPLETO.

### Chequeo web

- Etiqueta: CHEQUEO WEB GRATIS.
- Título: Una primera lectura de tu web.
- Descripción: Ingresá la dirección de tu sitio para revisar señales públicas de SEO, medición y vías de contacto.
- Límite: Sin contraseñas ni acceso a tus cuentas. Los resultados muestran señales observables que pueden requerir validación.
- Contacto anticipado: se requieren nombre y WhatsApp para identificar el chequeo y poder conversar; el resultado aparece en la propia página.
- El recuento de checks no se presenta como calidad general del negocio ni confirma funcionamiento de medición o contactos.

### Diagnóstico inicial

- Título: Una primera orientación para tu negocio.
- Cinco preguntas sobre ventas, atracción y medición. Orientación basada en las respuestas; no inspecciona canales.
- Sirve con o sin web. Contacto obligatorio anunciado antes de comenzar.

### Completo y Plan

- Hero: Antes de invertir más, entendé qué está frenando tu negocio.
- Diferencial: No revisamos solamente tu web. Analizamos cómo funciona tu ecosistema digital.
- Revisión humana del ecosistema: contexto, evidencia y validaciones de los canales aplicables.
- Evidencia: qué observamos, qué queda pendiente de validar y por qué importa.
- Plan: acciones priorizadas, dependencias, roles sugeridos y criterios para comprobar su finalización, según el alcance acordado.
- Servicio pago. Alcance y valor acordados antes de comenzar. No se publica un precio.
- Implementación independiente, opcional y cotizada por separado; el cliente puede implementarlo con quien prefiera.
- Tres CTA: CONSULTAR POR EL DIAGNÓSTICO COMPLETO ↗.
- WhatsApp: Hola, quiero consultar por el Diagnóstico Digital Completo de Potenciar Pymes.

El teaser de Audit Engine resume un expediente asistido. No se incorporó un ejemplo de Gezatek ni se promete ese documento como salida automática de esta landing: su integración y autorización de uso siguen sin verificar.

## Cambios por archivo

- index.html: selector de dos opciones gratuitas y servicio pago; enlaces y eventos de entrada.
- auditoria-web.html: campo URL junto al hero, copy, límites, contacto anticipado, lectura móvil, eventos, errores y CTA.
- diagnostico.html: encuadre declarativo, contacto anticipado, CTA, eventos, errores de contacto y visibilidad del logo existente.
- diagnostico-digital.html: servicio asistido pago, alcance, evidencia, Plan, alternativas gratuitas y CTA.
- llms.txt: corrige la descripción anterior que presentaba el Completo como gratuito.
- service-premium.js: etiqueta del enlace común al selector de home.
- Otras 17 páginas: únicamente consistencia de nombres y CTA hacia las rutas existentes; soluciones también explicita las tres entradas.

## Contrato de medición

| Flujo | Eventos |
| --- | --- |
| Entrada desde home | click_diagnostico_inicial / click_chequeo_web / click_diagnostico_completo |
| Cuestionario | diagnostico_iniciado → diagnosis_step_completed → diagnostico_completado → diagnostico_contact_submitted → diagnostico_contact_saved o diagnostico_error |
| Resultado del cuestionario | diagnosis_completed (compatibilidad) + diagnostico_result_shown |
| Chequeo | audit_start → audit_url_submitted → audit_check_completed o audit_error → audit_contact_submitted → audit_contact_saved o audit_error → audit_result_shown |
| Compatibilidad chequeo | audit_teaser_started / audit_teaser_completed |
| Consulta comercial | click_consultar_diagnostico_completo; solicitud_diagnostico_completo permanece por compatibilidad y significa clic, no consulta recibida |

Los eventos nuevos sólo usan dataLayer. Los eventos de ambos flujos no incluyen nombre, teléfono, URL ingresada, respuestas, facturación ni score. El mensaje de WhatsApp del resultado no incorpora datos ingresados. Se quitaron los envíos duplicados vía gtag en las dos páginas de resultados; no se tocaron IDs ni configuración del contenedor GTM/GA4.

generate_lead del cuestionario sólo se emite al aceptar la API el contacto (HTTP exitoso). Eso no acredita entrega del aviso por n8n/Resend. Se necesita revisar en GTM qué eventos se configuran como conversiones: no se publicó ningún cambio de contenedor.

## QA ejecutado

- Desktop 1440 px y mobile 390 px: ambos flujos completos con datos TEST POTENCIAR PYMES y contacto ficticio.
- API originales ejecutadas localmente; example.com fue reemplazado por una fixture pública controlada y las notificaciones por interceptores del proceso QA. No se generaron leads externos.
- No equivale a una validación del despliegue ni de las credenciales de producción.
- Chequeo: URL vacía, éxito, error de start, error de reveal y reintento exitoso. Resultado y enlaces correctos.
- Cuestionario: cinco preguntas, requisitos del contacto, éxito, error de contacto y resultado accesible con aviso explícito. También se observó el límite de solicitudes local; no se ocultó como éxito.
- Eventos de inicio, envío, finalización, resultado y error observados en dataLayer sin PII.
- Clic de consulta probado con bloqueo de navegación externa exclusivo del harness: eventos correctos, WhatsApp no abierto.
- 360, 390 y 430 px: home y tres páginas sin desbordamiento horizontal; imágenes sin errores de carga; espaciado móvil corregido.
- Sintaxis de 120 scripts inline, 20 JSON-LD y 396 enlaces internos en las 21 páginas HTML modificadas: PASS.
- calcScore/getGaps/getNivel idénticos a HEAD. No se tocaron api/, sitemap.xml, redirects ni configuración de hosting.
- git diff --check: PASS; warnings de normalización LF/CRLF, sin errores de whitespace.

## Dependencias pendientes de Audit / riesgos comerciales

1. reveal todavía devuelve “Auditoría Full”, “detalle exacto” y afirmaciones categóricas. La UI muestra el texto original; no lo reemplaza para maquillar el problema. Necesita revisión del otro Work antes de publicar.
2. Presencia de GA4 por regex no confirma medición y puede no detectar GA4 instalado vía GTM.
3. form_real_capture dice “capturan de verdad” por presencia de atributos: no valida entrega y puede ignorar formularios JS.
4. El extractor de title incluye la etiqueta completa en el cálculo de longitud. Corregir en Audit, no en esta landing.
5. Fallo de acceso debe distinguirse de señal ausente; los conteos de urgencia no equivalen a problemas confirmados.
6. El cuestionario conserva su lógica anterior: puede recomendar ecommerce/Mercado Libre a profesionales que no lo necesitan y mostrar un título genérico junto a “Digital en cero”. Es una revisión separada de criterio/scoring; no se alteró en este pedido.
7. La API de contacto no garantiza entrega de notificaciones: revisar observabilidad en el Work correspondiente.

## Test separado propuesto: contacto opcional

No implementado. Comparar el flujo actual (contacto antes de resultado) contra resultado visible y contacto optativo después. Medir resultado mostrado, contacto aceptado y clic al Completo; no confundirlos con una consulta recibida. Requiere decisión de negocio y coordinación con reveal, que actualmente exige contacto.

## Vista previa

Servidor QA local: http://localhost:8830/ (notificaciones externas bloqueadas, llamadas Audit sobre fixture).

Rutas: /#diagnostico, /diagnostico, /auditoria-web, /diagnostico-digital.

Capturas fuera del repositorio: ../tmp/diagnostic-qa/.

Veredicto: recorridos implementados y probados en desarrollo. No publicar sin resolver o aprobar expresamente los textos categóricos del motor y revisar las recomendaciones del cuestionario.
