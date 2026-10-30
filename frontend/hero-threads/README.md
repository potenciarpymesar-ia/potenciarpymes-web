# Hero Threads

React 19.3.1 island for the background only; existing headings, CTA and devices remain HTML/CSS/GSAP. Built locally with esbuild 0.28.2. Run `npm ci && npm run build` in this directory; commit the generated assets/home/hero-threads files. Netlify continues serving the existing static site without runtime CDN requests.

Upstream: React Bits Threads JS/CSS from https://reactbits.dev/r/Threads-JS-CSS.json, retrieved 2026-10-30. Copyright David Haz; license in LICENSE.react-bits.md and generated public notices. React notices remain in the generated .LEGAL.txt file.

Local adaptations: cap render resolution at 1440px and DPR at 1.25 on small surfaces / 1.5 otherwise; use live reduced-motion preference; block pointer updates when paused; expose readiness for a static SVG fallback and restore it after WebGL context loss. The React wrapper follows the hero's data-motion state, page visibility and media preference. No private data or network services are used by the effect.

Motion thesis: one continuous field of threads suggests connected channels; notification choreography remains foreground content. A single INK background replaces the diagonal and previous SVG pulse field. Lime threads are quieter under the copy and more visible by the devices. Mobile uses fewer lines and no pointer interaction. Pause is shared with the existing hero control. Fallback remains visible without JavaScript or WebGL2.
