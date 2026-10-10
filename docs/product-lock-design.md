# Product Lock

## Overview

Esta documentación cubre `herramientas/product-lock.html`, `.css` y `.js`, sin definir el sistema visual global.
El usuario aprobó la composición; el alcance describe el código existente, sin rediseño.
Con Product Lock creás texto para editar el entorno de una fotografía conservando el producto de referencia.
El navegador genera el prompt sin enviar los campos a servidores; no hay carga de fotos ni generación de imágenes o llamadas a APIs de IA.
La página carga Google Fonts y Google Tag Manager; los eventos incluyen nombre, herramienta y preset, sin los campos del formulario.

## Colors

- INK `#11110F`: fondo principal, texto del panel claro y botones activos.
- PAPER `#F0EEE8`: texto principal y fondo del resultado.
- LIME `#D7FF3F`: segunda línea del título, preset activo, acciones y selección de texto.
- Controles oscuros `#1A1A17`, bordes `#77786B`; salida blanca `#FFFFFF`.
- Texto secundario `#C4C3BA` y ayudas `#BDBDB2`; placeholder del resultado `#595A51`.
- Foco visible: contorno de 3 px con separación de 4 px, LIME en la superficie oscura e INK en textarea y botón del panel claro.

## Typography

- Bricolage Grotesque: títulos; encabezado principal con peso 700, interlineado 1 y tamaño `clamp(2.6rem,5.5vw,5.5rem)`.
- Manrope: cuerpo y controles, interlineado base 1.6; etiquetas de `.875rem` con peso 700.
- Texto de salida de `.875rem`; acciones de `.85rem` con peso 800; ayudas de `.8rem`.

## Layout

- Contenedor con máximo de 1320 px y padding lateral de 32 px; introducción de hasta 880 px.
- Desktop: editor y resultado en dos columnas iguales, separación de 48 px; resultado sticky a 20 px del borde superior.
- Hasta 900 px: editor arriba, resultado abajo, separación de 32 px y resultado sin sticky.
- Campos en dos columnas; producto y estilo ocupan el ancho completo. Hasta 480 px: una columna y padding lateral de 20 px.
- Presets en tres columnas también en móvil; panel de resultado con padding de 30 px, reducido a 20 px hasta 480 px.

## Components

- Navegación con logo hacia inicio y enlace a Recursos; instrucciones de cinco pasos y pie con aviso de defensa del consumidor.
- STUDIO inicial: catálogo neutro, formato 1:1. LIFESTYLE: contexto cotidiano, 4:5. HERO: composición editorial, 3:4.
- Al elegir un preset, conservás la descripción del producto y reemplazás los nueve campos del escenario; `aria-pressed` indica la selección.
- Descripción requerida de hasta 1000 caracteres; ocho campos de texto de escenario de hasta 300 caracteres y selector de formato.
- Formatos: 1:1, 3:4, 4:5, 9:16 y Horizontal (16:9). Para campos vacíos, el prompt usa «Sin indicación adicional».
- «GENERAR MI PROMPT» valida el formulario, incorpora escenario y restricciones maestras, enfoca la salida readonly y habilita copiar.
- Estado inicial: salida vacía y copia deshabilitada. Al editar después de generar, conservás el texto anterior y debés regenerar para copiar.
- Copia con Clipboard API en contexto seguro; ante fallo, seleccionás el texto de salida mediante el fallback y usás Copiar en tu dispositivo.
- Mensajes mediante `role="status"` y `aria-live="polite"`; copia deshabilitada durante la operación y controles con altura mínima de 48 px.
- Sin JavaScript, recibís un aviso para activarlo. Antes del uso comercial, comparás la imagen con el original: el prompt no garantiza fidelidad absoluta.
