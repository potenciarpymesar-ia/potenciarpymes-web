---
name: Potenciar Pymes
description: Identidad editorial vigente del sitio web
colors:
  ink: "#11110F"
  ink-soft: "#1A1A17"
  paper: "#F0EEE8"
  lime: "#D7FF3F"
  lime-hover: "#B9DC35"
typography:
  display:
    fontFamily: "Bricolage Grotesque, Arial, sans-serif"
    fontWeight: 650
  body:
    fontFamily: "Manrope, Arial, sans-serif"
    fontWeight: 400
    lineHeight: 1.7
rounded:
  none: "0"
  small: "4px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "17px 21px"
---

# Design System: Potenciar Pymes

## Overview

**Creative North Star: "Editorial de marca"**

Identidad editorial contemporánea: titulares con carácter, contraste fuerte, aire y un acento lima reconocible. El contenido de negocio, la foto del fundador y los canales que se conectan sostienen la comunicación; los efectos acompañan su lectura.

Este documento registra la identidad vigente del código y las decisiones confirmadas por el usuario. No propone un rediseño. Los valores compartidos se mantienen en design-tokens.json; este registro no reemplaza su proceso de generación. Los ajustes específicos del hero están en home-hero.css y home-hero.js.

**Key Characteristics:**

- Tipografía expresiva y jerarquía clara.
- Negro cálido, papel y lima como identidad.
- Composición editorial con separación entre mensaje y demostración.
- Movimiento controlado y reversible.

## Colors

### Primary

LIME dirige la atención a acciones y palabras clave. Su variante hover pertenece al sistema compartido; los componentes locales pueden invertir sus colores según su CSS vigente.

### Neutral

INK sostiene los fondos oscuros; PAPER aporta contraste en texto y superficies claras. INK SOFT separa superficies sin introducir otra identidad cromática.

El gris cálido #1B1C1C del fondo del hero acompaña el tono de la foto del fundador; es un tono de apoyo local, no un color principal. Los colores de WhatsApp, Instagram y Facebook, cuando aparecen, identifican redes y no sustituyen la paleta institucional.

## Typography

**Display Font:** Bricolage Grotesque, con Arial/sans-serif como fallback.

**Body Font:** Manrope, con Arial/sans-serif como fallback.

Conservar la familia y la expresividad de los titulares aprobados. No volver a Barlow o Barlow Condensed: eran referencias antiguas del documento de producto.

El hero usa peso 650, variación de ancho 85 y líneas fijadas en cuatro grupos. El tamaño de escritorio es clamp(68px, 7vw, 108px); el móvil tiene su propia escala responsive en home-hero.css. No aplicar estos valores a todas las páginas: el sistema compartido y las páginas existentes tienen sus propias jerarquías.

## Layout

El sitio usa contenedores y secciones de ancho completo. El máximo compartido es 1440px; el contenido del hero actual tiene máximo 1320px. El hero de escritorio pone el texto a la izquierda y la foto del fundador a la derecha, con una franja inferior que nombra los cinco canales conectados (Anuncios, Web, Tienda, WhatsApp, Medición).

En móvil, el orden es titular, bajada/CTA, foto y canales. El orden DOM coincide con la secuencia visual. El breakpoint específico del hero es 767px; otros componentes conservan sus breakpoints existentes. No unificar breakpoints sin revisar cada superficie.

## Elevation & Depth

La página se organiza principalmente por contraste y capas tonales. La foto del hero se funde con el fondo mediante una máscara sobre la propia imagen; no se agregan sombras ni brillos decorativos.

## Shapes

Controles principales rectos, bordes finos y composiciones amplias. La foto del hero es rectangular y a sangre; la franja de canales es plana, sin tarjetas.

## Components

### Buttons

CTA principal lima con texto oscuro y etiqueta breve en mayúsculas. El hero conserva altura mínima de 54px; su foco visible se distingue del hover. La acción principal del home lleva a /diagnostico.

### Navigation

Logo oficial, enlaces claros y acceso al diagnóstico. En móvil se conserva el menú y la acción Empezar. No reemplazar el logo por una recreación tipográfica.

### Hero

Titular aprobado, bajada en primera persona, foto del fundador (copia retocada jonathan-estudio-hero.webp, sin el logo de la lámpara) y franja de cinco canales. El titular se revela como una cortina, las letras reaccionan al cursor y los canales se resaltan de a uno; todo comparte el control de pausa y respeta «reducir movimiento». El texto de los canales está siempre en HTML. No hay fondo animado ni React en esta sección.

### Fields

Conservar los campos y validación del formulario existente. El foco y las etiquetas deben seguir siendo perceptibles; este registro no cambia estilos ni comportamiento de formularios.

## Do's and Don'ts

### Do:

- **Do** preservar colores, fuentes y logo oficiales.
- **Do** mantener legible el titular durante las animaciones.
- **Do** separar tonos decorativos de estados y acciones.
- **Do** verificar composición móvil y pausa al cambiar movimiento.

### Don't:

- **Don't** presentar notificaciones ficticias como mensajes reales.
- **Don't** transformar la comunicación en una venta de CRM.
- **Don't** propagar el fondo diagonal a otras secciones automáticamente.
- **Don't** publicar una nueva dirección visual por el solo hecho de estar documentada.
