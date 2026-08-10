# Potenciar Pymes Home Redesign Implementation Plan

> For agentic workers: REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Convert the Potenciar Pymes home into a premium, motion-led sales page centred on Diagnosis without changing analytics, lead capture, redirects, or hosting.

**Architecture:** Keep the static index.html structure: inline CSS and vanilla JavaScript. Add one Node static-verification script, then modify only home presentation, hierarchy, and progressive motion. Preserve existing destinations, measurement scripts, forms, redirects, and APIs.

**Tech Stack:** Static HTML, inline CSS, vanilla JavaScript, Node.js built-in node:fs, GTM, GA4, Meta Pixel, Microsoft Clarity, Netlify Forms, Vercel APIs.

## Global Constraints

- Keep GTM GTM-WW77R29R, Google Ads AW-18330840593, Meta Pixel 1351362610300825, and Clarity xo2tyfoak8.
- Keep window.ppTrack plus click_whatsapp, start_diagnosis, select_plan, generate_lead, form_submit, and scroll_75.
- Keep all /diagnostico, /auditoria-web, WhatsApp URLs, form[name="contacto"], data-netlify="true", and netlify-honeypot="bot-field" destinations and attributes.
- Do not modify _redirects, netlify.toml, vercel.json, or api/.
- Use bone #F3F0E8, ink #111512, forest #173D2D, signal lime #B8F45D, and terracotta #D86F4A.
- Motion must respect prefers-reduced-motion and never block content, focus, or interaction.
- Do not publish unverified client metrics or claims.

---

## File structure

- Modify: index.html — home markup, inline CSS, interactions, existing tracking.
- Create: scripts/verify-home.mjs — static checks for immutable conversion infrastructure.
- Create: docs/superpowers/plans/2026-08-09-potenciar-pymes-home-redesign.md — this plan.

### Task 1: Add a conversion non-regression guard

**Files:**

- Create: scripts/verify-home.mjs
- Test: scripts/verify-home.mjs

**Interfaces:**

- Consumes: UTF-8 index.html.
- Produces: exit code 0 when all required literals exist; exit code 1 listing omissions.

- [ ] **Step 1: Write the initially failing check**

~~~js
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const required = [
  'GTM-WW77R29R', 'AW-18330840593', '1351362610300825', 'xo2tyfoak8',
  'window.ppTrack', "'click_whatsapp'", "'start_diagnosis'", "'select_plan'",
  "'generate_lead'", "'form_submit'", "'scroll_75'",
  'form name="contacto" method="POST" data-netlify="true"',
  'netlify-honeypot="bot-field"', 'href="/diagnostico"',
  '#F3F0E8', '#111512', '#173D2D', '#B8F45D', '#D86F4A',
  '@media (prefers-reduced-motion: reduce)'
];
const missing = required.filter((value) => !html.includes(value));
if (missing.length) {
  console.error('Missing home invariants:\n' + missing.map((v) => '- ' + v).join('\n'));
  process.exit(1);
}
console.log('Home invariants verified.');
~~~

- [ ] **Step 2: Verify it fails before the palette is introduced**

Run: node scripts/verify-home.mjs

Expected: exit 1 and the five hex colour tokens are reported as missing.

- [ ] **Step 3: Do not add dependencies, a package manifest, or a build step**

- [ ] **Step 4: Commit after Task 2 passes**

~~~bash
git add scripts/verify-home.mjs index.html
git commit -m "test: guard home conversion infrastructure"
~~~

### Task 2: Establish visual tokens and motion primitives

**Files:**

- Modify: index.html lines 58-115 — fonts, root tokens, page background.
- Modify: index.html lines 2893-2954 — reveal bootstrap.
- Test: scripts/verify-home.mjs.

**Interfaces:**

- Consumes: existing reveal and IntersectionObserver fallback.
- Produces: system-map, system-link, system-node, metric-value, case-card, and is-visible.

- [ ] **Step 1: Replace only root visual values with the approved palette**

~~~css
:root {
  --bone: #F3F0E8; --ink: #111512; --forest: #173D2D;
  --signal: #B8F45D; --terracotta: #D86F4A;
  --paper-0: var(--bone); --paper-1: #E8E4DA; --paper-2: #DDD8CC;
  --paper-3: #CAC4B6; --accent: var(--forest); --accent-dim: #285B45;
  --secondary: var(--terracotta); --text-1: var(--ink);
  --text-2: #3E473F; --text-3: #657066;
}
~~~

- [ ] **Step 2: Remove the looping aurora and replace it with a static low-opacity paper gradient**

- [ ] **Step 3: Add progressive motion styles**

~~~css
.system-map { position:relative; min-height:420px; background:var(--forest); color:var(--bone); overflow:hidden; }
.system-link { stroke:var(--signal); stroke-width:1.5; stroke-dasharray:6 10; opacity:.25; transition:opacity .6s ease,stroke-dashoffset 1.2s linear; }
.system-map.is-visible .system-link { opacity:.9; stroke-dashoffset:-64; }
.system-node { position:absolute; display:grid; place-items:center; min-width:5.75rem; min-height:5.75rem; border:1px solid rgb(243 240 232 / .45); border-radius:999px; background:rgb(23 61 45 / .88); font:700 .72rem/1 var(--ff-body); letter-spacing:.06em; text-transform:uppercase; }
.metric-value { font-variant-numeric:tabular-nums; }
.case-card { transition:transform .32s cubic-bezier(.16,1,.3,1),box-shadow .32s ease; }
.case-card:hover,.case-card:focus-within { transform:translateY(-6px); box-shadow:0 20px 50px rgb(17 21 18 / .14); }
@media (prefers-reduced-motion: reduce) {
  *,*::before,*::after { animation-duration:.01ms!important; animation-iteration-count:1!important; scroll-behavior:auto!important; transition-duration:.01ms!important; }
}
~~~

- [ ] **Step 4: In the existing observer, add is-visible to observed system-map nodes before unobserving; add the same class in its no-observer fallback**

- [ ] **Step 5: Run guard and commit**

Run: node scripts/verify-home.mjs

Expected: Home invariants verified.

~~~bash
git add scripts/verify-home.mjs index.html
git commit -m "feat: add warm premium home visual system"
~~~

### Task 3: Rebuild the hierarchy around the system, cases, and Diagnosis

**Files:**

- Modify: index.html lines 2050-2726.
- Test: scripts/verify-home.mjs.

**Interfaces:**

- Consumes: Task 2 CSS hooks.
- Produces: the cases anchor, the Diagnosis anchor, the method anchor, and preserved #contacto.

- [ ] **Step 1: Replace the hero photo visual with this accessible system map; retain founder imagery in authority**

~~~html
<div class="system-map reveal" aria-label="Sistema digital conectado: tienda, Mercado Libre, WhatsApp, anuncios y medición">
  <svg viewBox="0 0 600 420" aria-hidden="true" focusable="false">
    <line class="system-link" x1="118" y1="110" x2="300" y2="210"></line>
    <line class="system-link" x1="482" y1="110" x2="300" y2="210"></line>
    <line class="system-link" x1="118" y1="310" x2="300" y2="210"></line>
    <line class="system-link" x1="482" y1="310" x2="300" y2="210"></line>
  </svg>
  <span class="system-node" style="left:8%;top:12%">Tienda</span>
  <span class="system-node" style="right:8%;top:12%">Mercado Libre</span>
  <span class="system-node" style="left:8%;bottom:12%">WhatsApp</span>
  <span class="system-node" style="right:8%;bottom:12%">Medición</span>
  <span class="system-node" style="left:calc(50% - 2.875rem);top:calc(50% - 2.875rem);background:var(--signal);color:var(--ink)">Tu pyme</span>
</div>
~~~

- [ ] **Step 2: Keep the hero copy and /diagnostico primary CTA; demote /auditoria-web to a secondary utility and preserve all URLs**

- [ ] **Step 3: Add metric-value, data-target, and data-suffix to $300M+, 500+, and 90 días while retaining current qualifiers**

- [ ] **Step 4: Merge current client/project sections into #casos**

Order Conectia, NutrePHARMA, Pixellab, then Wheels. Every card is rubro/estado, marca, problema o alcance, and sistema aplicado. Retain Proyecto en curso and Activo hoy. Omit any new result numbers.

- [ ] **Step 5: Replace diagnosis-beneficios with this central decision block**

~~~html
<section class="section" id="diagnostico-potenciar" aria-labelledby="diagnostico-potenciar-h2">
  <h2 id="diagnostico-potenciar-h2">Diagnóstico Digital Potenciar.</h2>
  <p>En pocos minutos ubicamos dónde se corta tu sistema digital y cuál es el próximo paso lógico.</p>
  <ul class="diagnosis-areas" aria-label="Áreas que revisa el diagnóstico">
    <li>Presencia</li><li>Venta</li><li>Seguimiento</li><li>Medición</li><li>Visibilidad</li>
  </ul>
  <a href="/diagnostico" class="btn-primary">Iniciar mi diagnóstico →</a>
</section>
~~~

Keep the existing full WhatsApp URL as its only secondary action. Do not create or alter the Diagnosis application.

- [ ] **Step 6: Order remaining content as method, capabilities, authority/trust, FAQ, plans, resources, and existing contact form**

- [ ] **Step 7: Run guard and commit**

Run: node scripts/verify-home.mjs

Expected: Home invariants verified.

~~~bash
git add index.html
git commit -m "feat: center home around cases and digital diagnosis"
~~~

### Task 4: Add one-time interaction while preserving measurement

**Files:**

- Modify: index.html lines 2893-3066.
- Test: scripts/verify-home.mjs.

**Interfaces:**

- Consumes: metric-value[data-target], system-map, and current window.ppTrack.
- Produces: one-time metric counters; current tracking remains unmodified.

- [ ] **Step 1: Add this counter before the analytics IIFE**

~~~js
function animateMetric(element) {
  const target = Number(element.dataset.target);
  const suffix = element.dataset.suffix || '';
  const start = performance.now();
  function frame(now) {
    const progress = Math.min((now - start) / 900, 1);
    element.textContent = Math.round(target * progress) + suffix;
    if (progress < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
~~~

- [ ] **Step 2: Observe metrics once only when the user has not reduced motion**

~~~js
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reducedMotion && 'IntersectionObserver' in window) {
  const metricObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      animateMetric(entry.target);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.55 });
  document.querySelectorAll('.metric-value[data-target]').forEach((metric) => metricObserver.observe(metric));
}
~~~

- [ ] **Step 3: Leave window.ppTrack and click/submit listeners byte-for-byte unchanged; diagnosis links must have an href containing /diagnostico**

- [ ] **Step 4: Change sticky_cta_shown = true to sticky_shown = true; retain the existing /diagnostico action**

- [ ] **Step 5: Run guard and commit**

Run: node scripts/verify-home.mjs

Expected: Home invariants verified.

~~~bash
git add index.html
git commit -m "feat: add accessible system motion to home"
~~~

### Task 5: Verify without touching production infrastructure

**Files:**

- Modify: none.
- Test: scripts/verify-home.mjs.

- [ ] **Step 1: Run static guard**

Run: node scripts/verify-home.mjs

Expected: Home invariants verified.

- [ ] **Step 2: Confirm infrastructure remains untouched**

Run: git diff -- _redirects netlify.toml vercel.json api/

Expected: no output.

- [ ] **Step 3: Preview locally**

Run: npx serve . -l 4173

Check desktop and mobile: Diagnosis goes to /diagnostico; WhatsApp query strings remain unchanged; contact form retains Netlify attributes; five Diagnosis labels are readable; cards do not require hover; focus is visible; reduced-motion keeps all content visible.

- [ ] **Step 4: Confirm existing measurements through GTM/GA4 debugging**

Check a Diagnosis link emits start_diagnosis; a WhatsApp link emits click_whatsapp; contact form submission emits generate_lead and form_submit; reaching 75% scroll emits scroll_75 once. Do not edit tracking IDs or event names.

- [ ] **Step 5: Final commit**

~~~bash
git status --short
git add index.html scripts/verify-home.mjs
git commit -m "feat: redesign Potenciar Pymes home"
~~~
