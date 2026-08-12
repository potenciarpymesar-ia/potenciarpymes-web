# Marcas Muro Expediente Vivo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar la órbita decorativa por una visualización de las cinco etapas reales de registro de marca.

**Architecture:** Un solo bloque HTML/CSS/JavaScript en la landing existente. La lista conserva el contenido accesible y el sello azul se anima como mejora progresiva.

**Tech Stack:** HTML estático, CSS y JavaScript nativo.

## Global Constraints

- No agregar dependencias ni React.
- No tocar el formulario, endpoint, tracking ni otras secciones.
- Usar etapas oficiales de INPI sin prometer resultados ni clases concretas.
- Respetar `prefers-reduced-motion`.

---

### Task 1: Reemplazar el bloque visual de Marcas Muro

**Files:**
- Modify: `sistema-de-lanzamiento.html`

- [ ] Sustituir `.partner-orbit` por una lista de cinco etapas y un sello visual.
- [ ] Agregar estilos responsive y de movimiento reducido para el rail.
- [ ] Agregar JavaScript que active la etapa al hover, foco o toque.
- [ ] Validar HTML, ausencia de overflow horizontal y `git diff --check`.
