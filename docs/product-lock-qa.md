# Product Lock — entrega local, 10 de octubre de 2026

Vista previa: http://127.0.0.1:8852/herramientas/product-lock

## Alcance

Página HTML independiente, CSS propio y JavaScript nativo. Sin dependencias nuevas, API, registro, fotografías ni almacenamiento. Composición aprobada: presets arriba del formulario; prompt a la derecha en escritorio y debajo hasta 900 px. Fuentes Bricolage Grotesque / Manrope y paleta existente. No se modificaron contactos, formularios preexistentes, backend, hosting ni redirects. Recursos incluye un enlace; sitemap incorpora la ruta canónica.

Los presets reemplazan nueve campos del escenario y mantienen la descripción del producto. Generar produce siempre escenario + PRODUCT LOCK + cambios permitidos + restricciones + validación comercial. Después de editar se desactiva Copiar hasta regenerar, evitando copiar una versión anterior. Clipboard API copia el texto completo; si se deniega, se selecciona el texto y se indica cómo copiar manualmente.

## Pruebas reproducibles

- `node --test tests/*.test.cjs`: 85 PASS, 0 fallos; seis pruebas nuevas cubren generador, tres presets, integridad del prompt, reemplazo del escenario y producto vacío. No se ejecutan servicios externos.
- `node --check herramientas/product-lock.js`: PASS.
- `git diff --check`: PASS (avisos de conversión CRLF, no errores de whitespace).
- Navegador Chromium real: `node ../tmp/product-lock-browser-qa.cjs`. Requiere Playwright ya instalado en la máquina y el servidor de preview `node ../tmp/product-lock-preview.cjs`. Scripts auxiliares fuera del repo; no son dependencias de la herramienta.
- Copia real comparada con el prompt visible completo: PASS en tres presets. Se normalizan CRLF del portapapeles Windows para comparar texto equivalente.
- Error de permisos de portapapeles: PASS, texto seleccionado y recuperación manual visible.
- Edición personalizada y regeneración: PASS. Cambiar preset conserva producto, reemplaza escenario; Copiar queda desactivado mientras hay cambios pendientes.
- Producto obligatorio: PASS, validación nativa. Teclado Enter en presets: PASS. Todos los controles tienen label y altura mínima 44 px.
- JavaScript desactivado: generación deshabilitada y aviso visible; evita envío nativo accidental de los campos. Verificado con `node ../tmp/product-lock-nojs-qa.cjs`.
- 1440, 768, 430, 390, 360 y 320 px: PASS, sin overflow horizontal y columnas/apilamiento correcto. Capturas escritorio/móvil en `.impeccable/review/product-lock/`.
- Rutas locales `/`, `/soluciones`, `/recursos`, `/auditoria-web`, `/diagnostico`, `/diagnostico-digital`, `/web-profesional`, `/sitemap.xml`: 200. Sin envío de formularios.
- Sin errores JavaScript no capturados. Canonical, título, descripción, OG, Twitter y JSON-LD WebApplication presentes; JSON-LD válido.
- Eventos `product_lock_preset_selected`, `product_lock_prompt_generated`, `product_lock_prompt_copied`: una emisión por acción, solo tool y preset. Sin campos ni prompt. GTM existente reutilizado; no se modificó su configuración. Red de analítica bloqueada durante QA para no emitir conversiones reales.

## Revisión y límites

Revisión independiente de código, seis tests y capturas detectó foco LIME sobre PAPER en Copiar (1,01:1). Se reprodujo con Tab, se cambió el outline a INK y se verificó con `node ../tmp/product-lock-focus-qa.cjs`.

Detector Impeccable sin hallazgos, pero degradado a regex por parsers no disponibles: no equivale a auditoría automática completa de contraste/accesibilidad. No se incorporaron dependencias para el detector.

No probado en Safari/iOS físico ni con lector de pantalla. Chromium emula tamaños, no garantiza todos los dispositivos. No hay build por ser HTML estático; el servidor local reproduce resolución de `.html` por ruta limpia, no certifica un deploy Vercel. La recepción en GA4 requiere configuración del contenedor, no se afirma acreditada. No garantiza fidelidad de una herramienta de IA externa.

Producción sin cambios por esta tarea. Sin commit, push ni deploy. Los cambios pendientes previos siguen locales y deben excluirse de una futura publicación de Product Lock.
