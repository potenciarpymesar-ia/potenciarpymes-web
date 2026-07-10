# Potenciar Pymes

## What is this?

Static HTML landing site + 7 service-specific pages for Argentine SMEs (pymes). Offers digital ecosystem services: ecommerce optimization (Tiendanube, Mercado Libre), SEO/GEO, automation, marketing (Meta Ads, WhatsApp Business, Google Business).

Deployed on Netlify. Domain: potenciarpymes.ar. Single-page static HTML (no framework).

## Core flows

**Primary:** Home (index.html) → Service page (7 variants: tiendanube, mercado-libre, seo-geo, automatizaciones, meta-ads, whatsapp-business, google-business) → WhatsApp CTA or diagnostic form.

**Secondary:** Sticky nav, FAQ accordion per page, related services grid.

## Design system

- **Colors (OKLCH):** Dark bg oklch(0.04 0 0), text oklch(0.97 0 0), accent green oklch(0.83 0.22 145)
- **Type:** Barlow Condensed (display), Barlow (body)
- **Motion:** Aurora animated BG (radial gradients, 12s loop), reveal-on-scroll (IntersectionObserver)
- **Layout:** Container-based, semantic HTML, skip-link, main landmark

## Analytics

Google Tag Manager (GTM-WW77R29R) + GA4 (G-VG11Q6S1VD). Custom events: click_whatsapp, start_diagnosis, scroll_75.

## Register

Landing page / marketing site. Design IS the product — SEO, conversions, trust matter.

## Status

Live. All 9 pages deployed. og-image.png (v2: gradient, glow, modern aesthetic). Sitemap + clean URLs + schema markup in place.
