# Sistema de Lanzamiento Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lanzar una landing premium para profesionales y estudios que convierta aplicaciones al diagnóstico y posicione a Potenciar Pymes como quien diseña el sistema completo de lanzamiento.

**Architecture:** Se crea una página estática autocontenida siguiendo la estética y tracking de la home, con CSS/JS locales para movimiento ligero y accesible. La home y Soluciones solo agregan enlaces contextuales; el formulario usa el endpoint existente `/api/diagnostic-lead` sin cambiar su contrato.

**Tech Stack:** HTML estático, CSS, JavaScript nativo, JSON-LD, Netlify/Vercel redirects existentes, GTM/GA4/Meta Pixel/Google Ads/Clarity existentes.

## Global Constraints

- No modificar identificadores de GTM, GA4, Google Ads, Meta Pixel, Clarity, Netlify, Vercel ni redirects existentes.
- Mantener negro, blanco hueso y verde lima; respetar `prefers-reduced-motion`.
- Presentar a Marcas Muro como aliado estratégico para registro ante INPI, M.N. 3209; no atribuir asesoramiento legal a Potenciar Pymes.
- No usar promesas de resultados ni métricas no verificadas.

---

### Task 1: Crear la landing de conversión

**Files:**
- Create: `sistema-de-lanzamiento.html`

- [ ] **Step 1: Crear el documento con metadata y schema verificables**

Incluir `title`, descripción, canonical, OG/Twitter y JSON-LD `ProfessionalService` + `BreadcrumbList` con URL `https://potenciarpymes.ar/sistema-de-lanzamiento`.

- [ ] **Step 2: Implementar la narrativa y el formulario**

Construir hero, prueba de confianza, cinco capas del sistema, aliado Marcas Muro, proceso y formulario `nombre`, `whatsapp`, `profesion`, `etapa`, `web`. Enviar el payload compatible `nombre`, `whatsapp`, `rubro` a `/api/diagnostic-lead`.

- [ ] **Step 3: Añadir movimiento y accesibilidad**

Implementar SVG/CSS/JS sin dependencias: conexión animada en hero, revelado de capas al scroll y estado estático con movimiento reducido.

- [ ] **Step 4: Verificar la página**

Ejecutar parseo HTML, parseo JSON-LD, validación de enlaces locales y prueba local del formulario contra un stub de `/api/diagnostic-lead`.

### Task 2: Integrar la oferta sin cambiar la narrativa de la home

**Files:**
- Modify: `index.html`
- Modify: `soluciones.html`
- Modify: `sitemap.xml`

- [ ] **Step 1: Añadir acceso contextual**

Agregar en la home un enlace de bajo impacto desde el área de experiencia/soluciones y añadir `Sistema de Lanzamiento` como solución prioritaria en `soluciones.html`.

- [ ] **Step 2: Asegurar descubribilidad**

Añadir la URL a `sitemap.xml` con `lastmod` 2026-08-11.

- [ ] **Step 3: Verificar integración**

Comprobar enlaces, metadata, ausencia de overflow a 375px y presencia de tracking existente.

### Task 3: Revisión final y entrega

**Files:**
- Modify: `sistema-de-lanzamiento.html`
- Modify: `index.html`
- Modify: `soluciones.html`
- Modify: `sitemap.xml`

- [ ] **Step 1: Ejecutar control de calidad**

Ejecutar `git diff --check`, parseo de HTML/JSON-LD, enlaces internos y una inspección visual desktop/móvil.

- [ ] **Step 2: Commit**

Crear un commit único con el mensaje `feat: add professional launch system landing`.
