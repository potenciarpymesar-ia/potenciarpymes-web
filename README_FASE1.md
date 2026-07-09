# Potenciar Pymes — Fase 1 técnica

Archivos preparados por ChatGPT para base SEO/GEO/medición/conversión.

## Cambios incluidos

- Agregado `robots.txt`.
- Agregado `sitemap.xml`.
- Agregado `llms.txt`.
- Agregado `_redirects` para Netlify.
- Agregado `netlify.toml` con headers básicos.
- Home con metadata mejorada.
- Home con schema JSON-LD tipo Organization + ProfessionalService + WebSite + FAQPage.
- Home con links a `/diagnostico` en vez de `diagnostico.html`.
- Diagnóstico con H1 accesible.
- Diagnóstico con canonical limpio `/diagnostico`.
- Diagnóstico con schema WebPage.
- Diagnóstico con formulario oculto Netlify para guardar leads.
- Eventos preparados para `dataLayer` / `gtag` si luego se instala GA4/GTM.

## Decisión asumida

Dominio canónico usado en estos archivos:

`https://www.potenciarpymes.ar/`

Si se decide usar el dominio sin www, hay que reemplazar todas las apariciones de `https://www.potenciarpymes.ar` por `https://potenciarpymes.ar` y ajustar `_redirects`.

## Pendientes manuales

- Confirmar dominio principal en Netlify.
- Confirmar DNS en NIC.ar.
- Configurar Google Search Console.
- Enviar sitemap en Search Console.
- Instalar GA4/GTM si todavía no está.
- Validar formularios Netlify luego del deploy.
- Probar `/diagnostico` y `/diagnostico.html` luego del deploy.
