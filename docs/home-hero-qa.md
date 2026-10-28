# Hero cinematográfico — QA del preview

Fecha: 2026-10-28. Base: main `54b92f36`. PR borrador #9. Producción no modificada.

## Implementación

- Mensaje aprobado, Bricolage Grotesque y Manrope del sitio y logo original.
- Fotografía conceptual propia optimizada, cámara y conexiones SVG con GSAP local 3.13.0. No es video completo.
- CTA enlaza a `/diagnostico` y conserva clases de analítica.
- Mobile con copia abreviada y escena debajo del CTA.
- Pausa manual, preferencia de movimiento reducido dinámica, suspensión por visibilidad y por salir de pantalla; fallback estático sin GSAP.

## Evidencia

- `node --test tests/*.test.cjs`: 92/92 aprobadas. Incluye cinco pruebas nuevas de pausa, visibilidad, preferencias, fallback y liberación del controlador.
- `node --check home-hero.js` y `git diff --check`: aprobados.
- Revisión independiente: dos hallazgos corregidos (alineación de foto/trazos y superposición potencial del texto con pausa móvil). Revisor comprobó repetición de la secuencia con GSAP real.
- Netlify preview abierto en navegador Chrome. Escena cargada, fuentes originales observadas y botón de pausa verificado por DOM y teclado.
- Responsive revisado con `/qa/home-hero.html`: iframes del home real a 320, 375, 390, 430, 768 y 1440 px. Sin scroll horizontal, líneas del título dentro del viewport y sin intersecciones verticales, texto de escena separado del botón. CTA termina aproximadamente a 471, 446, 453, 471, 652 y 798 px respectivamente en esas condiciones.
- Menú móvil abre con Enter y cierra con Escape. Pausa cambia `aria-pressed` y estado de movimiento a `paused`.
- Imagen: WebP de 49.768 bytes contenido en SVG, con encuadres desktop y móvil. La carga se completó; al cruzar el breakpoint hay un breve cambio de `picture` durante el cual `complete` puede ser falso.

## Límites

- La revisión responsive usa marcos de ancho real en Chrome, no dispositivos físicos ni Safari/iOS.
- Movimiento reducido y ausencia de GSAP se verificaron mediante pruebas del controlador; no se cambió la preferencia del sistema operativo del navegador remoto.
- Sin JavaScript, título, CTA y fotografía están en el HTML/CSS base. No se ejecutó una sesión de navegador con JavaScript deshabilitado.
- El control de escala de texto del QA modifica el tamaño raíz; no equivale a zoom de navegador al 200%. No se acredita una prueba de zoom completo.
- No se comprobó recepción de eventos en GA4 ni se enviaron formularios.
- El preview Vercel pide login; se revisó el preview Netlify disponible del mismo PR.
- Los errores observados en consola corresponden al content script de la extensión del navegador, no al controlador del hero.

## Alcance conservado

CRM, Biblioteca de Recursos y PR #6 sin modificaciones. No se integró el PR #9 ni se desplegó a producción.
