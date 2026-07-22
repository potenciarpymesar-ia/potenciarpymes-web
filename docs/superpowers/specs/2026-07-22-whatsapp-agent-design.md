# Agente de WhatsApp — Potenciar Pymes

## Contexto

Potenciar Pymes ofrece diagnósticos y consultoría de marketing digital para pymes argentinas chicas (recién arrancan o quieren digitalizarse: dominio, Tiendanube/Mercado Libre, SEO/GEO, imágenes/banners, automatizaciones básicas). El sitio (potenciarpymes.ar) deriva leads a WhatsApp. El objetivo de este proyecto es un agente de WhatsApp que atienda esas consultas, califique el lead y lo guíe a agendar una llamada de diagnóstico.

Se construye sobre el template [whatsapp-agentkit](https://github.com/Hainrixz/whatsapp-agentkit) (FastAPI + Claude + adapters de WhatsApp), adaptado a este negocio.

## Ubicación y stack

- Vive en `Desktop/pp-web/whatsapp-agent/` — subcarpeta del repo del sitio (`potenciarpymes-web`), no repo separado.
- Backend: FastAPI + Uvicorn.
- LLM: Claude (Anthropic API, `sk-ant-...`) — se mantiene el SDK del template sin cambios.
- WhatsApp: Meta Cloud API (no Twilio).
- DB: SQLite local para historial de conversación (default del template).
- Config: YAML (`config/business.yaml`, `config/prompts.yaml`).
- Deploy: Render o Fly.io free tier (se define cuál al implementar, según cuál tenga mejor soporte para Dockerfile + webhook HTTP). Reemplaza el Railway que sugiere el template por defecto — Railway cobra después del trial.

## Flujo conversacional

1. **Entrada:** lead escribe por WhatsApp. Agente saluda y se presenta como asistente de Potenciar Pymes.
2. **Tono:** cercano y directo — voseo, informal, algún emoji. Nunca formal/usted.
3. **Descubrimiento:** el agente pregunta qué necesita el negocio (dominio, Tiendanube/Mercado Libre, SEO/títulos y descripciones, imágenes/banners, automatizaciones) y en qué etapa está (recién arranca vs. ya vende online).
4. **Base de conocimiento:** las respuestas sobre alcance de servicios se arman a partir del contenido ya publicado en las 7 páginas de servicio del sitio (tiendanube.html, mercado-libre.html, seo-geo.html, automatizaciones.html, meta-ads.html, whatsapp-business.html, google-business.html) — se extraen a `knowledge/servicios.md` en la implementación.
5. **Precio:** el agente NO cotiza — no hay precio público del diagnóstico en el sitio. Si preguntan precio, responde que se define en la llamada.
6. **Calificación:** lead "bueno" = pyme chica que necesita armar o mejorar su presencia digital desde una etapa inicial (no hay filtro de facturación mínima).
7. **Cierre:** lead calificado → el agente comparte el link de Calendly (cuenta free, evento "Llamada diagnóstico" de 15-30 min) para agendar.
8. **Fuera de alcance:** preguntas no relacionadas al negocio, quejas, o algo que el agente no puede resolver → mensaje indicando que un humano va a responder; queda registrado para revisión manual, sin automatización adicional por ahora.

## Filtro de contactos personales

El mismo número de WhatsApp se usa para uso personal y para el bot de negocio. La Cloud API de Meta no expone de forma confirmada las labels custom del WhatsApp Business App (como una label "Personal") vía webhook para filtrar automáticamente — se investigó la feature "Coexistence" (mayo 2025, permite Business App + Cloud API en el mismo número) y no hay documentación que confirme que las labels lleguen al payload del webhook de forma utilizable para este filtro, y además esa feature requiere status de Tech Provider/Solution Partner vía Embedded Signup.

**Decisión:** lista explícita de números personales en `config/personal_contacts.yaml`, mantenida a mano por el dueño del proyecto. Antes de procesar cualquier mensaje entrante, el agente chequea si el número remitente está en esa lista — si está, no responde (la conversación se sigue manualmente desde la app). La lista se va a actualizar con el tiempo a medida que se agreguen o saquen contactos; para el MVP el cambio se hace editando el archivo (implica redeploy).

## Credenciales y setup manual

Estos pasos los hace el dueño del proyecto — no se crean cuentas ni se manipulan credenciales por fuera del `.env` local:

1. **Anthropic API key**: cuenta en platform.anthropic.com, carga de ~$5 de crédito.
2. **Meta**: crear App en developers.facebook.com → agregar producto WhatsApp → obtener Access Token temporal + Phone Number ID + Test Number (para probar antes de verificar el negocio formalmente).
3. **Calendly**: cuenta free, un evento tipo "Llamada diagnóstico" (15-30 min), copiar el link público.

Se deja un `.env.example` con los nombres de variables requeridas; los valores reales los completa el dueño del proyecto en su `.env` local, nunca se comparten por chat.

## Testing y despliegue

1. Setup local del template con las decisiones de este documento ya aplicadas (sin pasar por el interview `/build-agent` interactivo, ya que las respuestas están definidas acá).
2. Probar conversaciones con el simulador de terminal del template (sin gastar mensajes reales de WhatsApp).
3. Probar WhatsApp real contra el Meta Test Number.
4. Deploy a Render/Fly.io free tier una vez validado el flujo localmente.

## Fuera de alcance (por ahora)

- Cotización o cobro automático del diagnóstico (no hay checkout ni precio público).
- Integración directa con Google Calendar (se usa Calendly con link simple).
- Filtro de contactos personales basado en labels de Meta (no confirmado como viable vía API).
- Escalamiento automático de quejas/casos fuera de alcance — por ahora solo se registran para revisión manual.
