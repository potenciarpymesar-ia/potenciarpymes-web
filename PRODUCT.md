# Potenciar Pymes

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Dueños de pymes argentinas, comercios y profesionales de servicios que necesitan mejorar su presencia digital, canales de venta y procesos. El sitio permite entender la propuesta y elegir por dónde empezar.

## Product Purpose

Sitio de una consultora que ayuda a ordenar el negocio digital: entender el problema, priorizar y conectar las herramientas que tengan sentido para cada empresa.

## Positioning

«Sistemas digitales para negocios reales». No presentar la consultora como un CRM o una plataforma propia que centraliza todas las redes. El método es Detectar → Ordenar → Conectar → Medir → Mejorar. Comunicación: «Mucho movimiento. Poca claridad», «Menos humo. Más criterio» y «Primero entendemos. Después decidimos qué mejorar».

## Operating Context

Sitio estático HTML/CSS/JavaScript, sin framework, en el repositorio potenciarpymesar-ia/potenciarpymes-web. Dominio oficial: https://potenciarpymes.ar/. Netlify genera vistas previas de los PR. Conservar la infraestructura y las integraciones existentes.

Recorridos: home → diagnóstico inicial gratuito; chequeo web gratuito como alternativa independiente; Diagnóstico Digital Completo pago, con alcance y valor acordados antes de comenzar. La implementación posterior es opcional y se cotiza por separado. También hay páginas de servicios, Recursos y contacto por WhatsApp/formulario.

## Capabilities and Constraints

Servicios sobre Tiendanube, Mercado Libre, presencia web, captación, medición y automatización de procesos. El diagnóstico inicial orienta a partir de cinco respuestas; el chequeo web revisa señales públicas. No prometer acceso autónomo a cuentas privadas ni equivalencia entre chequeo público y diagnóstico profundo.

La foto del hero es el retrato real del fundador. La franja de canales (Anuncios, Web, Tienda, WhatsApp, Medición) describe lo que se conecta en un negocio; no representa un producto propio ni una integración operativa con las redes.

## Brand Commitments

Conservar el nombre, el logo oficial y las tipografías vigentes. Identidad editorial INK/PAPER/LIME; sus valores y usos se documentan en DESIGN.md y design-tokens.json. No reemplazarla por una estética genérica de software. El titular aprobado es «Tu negocio te necesita. Pero no para todo.».

## Evidence on Hand

Logo en logo.png; identidad y tokens en design-tokens.json; componentes en design-system.css y design-system.js. Casos existentes de Conectia BA (Jonathan fue uno de los cuatro socios), Wheels BA (emprendimiento propio con un socio, del que luego se separó) y NutrePHARMA (uno de sus primeros clientes) y Hardtech Store (cliente actual, proyecto en curso); credenciales ecommerce presentes en el sitio. No inventar métricas de resultados, testimonios ni garantías.

Foto del hero en assets/sobre-mi/ (copia retocada jonathan-estudio-hero.webp). Control de animación en home-hero.js; pruebas en tests/home-hero.test.cjs.

## Product Principles

- Diagnosticar antes de recomendar herramientas o inversión.
- Explicar el beneficio y el alcance con lenguaje argentino claro.
- Orientar al visitante hacia un próximo paso concreto.
- Distinguir evidencia, ejemplos ilustrativos y capacidades reales.
- Preservar identidad, accesibilidad y funcionamiento móvil.

## Accessibility & Inclusion

El mensaje y el CTA se leen sin esperar la animación. El movimiento tiene pausa, respeta preferencias reducidas y se suspende cuando la escena sale de pantalla o la pestaña queda oculta. Conservar navegación por teclado, foco visible y nombres accesibles. No presentar pruebas en Chrome como validación en Safari/iOS o teléfono físico.

## Analytics

Conservar Google Tag Manager GTM-WW77R29R y los eventos existentes. La presencia de etiquetas no demuestra recepción ni atribución correcta; eso requiere verificación específica.

## Status

El hero «El estudio» (foto del fundador y franja de canales) reemplaza a la escena de notebook y celular y al fondo de hilos. A la fecha de esta actualización (18/11/2026) está en una rama de prueba, sin publicar. Consultar el estado del repositorio antes de asumir una publicación posterior. La documentación no autoriza publicar cambios visuales nuevos.
