# Prompt para Claude — Implementación Fase 1 Potenciar Pymes

Trabajá sobre el repositorio de Potenciar Pymes. El sitio actual es HTML estático con `index.html`, `diagnostico.html` y `og-image.svg`.

Objetivo: implementar una primera base técnica SEO/GEO/conversión sin rediseñar todavía.

## Archivos entregados

Recibís un ZIP con estos archivos ya preparados:

- `index.html`
- `diagnostico.html`
- `og-image.svg`
- `robots.txt`
- `sitemap.xml`
- `llms.txt`
- `_redirects`
- `netlify.toml`
- `README_FASE1.md`

## Tarea

1. Compará estos archivos con el repo actual.
2. Aplicá los cambios de forma segura.
3. No rediseñes todavía.
4. No cambies el tono de marca.
5. No agregues librerías.
6. No conviertas el proyecto a React/Vite/Next.
7. Mantené HTML estático salvo que haya una razón fuerte para cambiar.
8. Verificá que Netlify Forms siga funcionando.
9. Verificá que `/diagnostico` sirva internamente `diagnostico.html`.
10. Verificá que `/diagnostico.html` redirija a `/diagnostico`.

## Decisión asumida

Dominio canónico usado:

`https://www.potenciarpymes.ar/`

Si Netlify está configurado con apex como dominio principal, avisar antes de cambiar y no mezclar canónicos.

## Verificaciones obligatorias

- `index.html` tiene 1 H1.
- `diagnostico.html` tiene 1 H1 accesible.
- `robots.txt` apunta al sitemap correcto.
- `sitemap.xml` solo incluye URLs reales.
- `_redirects` no genera bucles.
- `netlify.toml` no rompe el publish directory.
- Metadata de home y diagnóstico está correcta.
- Schema JSON-LD es válido.
- Los links internos usan `/diagnostico`, no `diagnostico.html`.
- El formulario de contacto sigue teniendo `data-netlify="true"`.
- El diagnóstico guarda lead en Netlify Forms mediante formulario oculto.
- Los eventos `dataLayer` no rompen si todavía no existe GTM/GA4.

## Entregá al finalizar

- Resumen de cambios aplicados.
- Archivos modificados.
- Riesgos detectados.
- Qué debe configurar Jonathan manualmente en Netlify, NIC.ar, Search Console y GA4.
