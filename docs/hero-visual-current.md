# Hero vigente — decisiones y estado al 30/10/2026

Este registro resume el resultado actual; los documentos anteriores de specs y planes conservan la historia de las iteraciones.

## Publicado: PR #9

Titular: «TU NEGOCIO TE NECESITA. PERO NO PARA TODO.» en Bricolage Grotesque. Bajada desktop: «Te ayudamos a mejorar tu web, tus canales de venta y tus procesos. Primero detectamos qué necesita tu negocio; después conectamos las herramientas que tengan sentido para vos.» Bajada móvil: «Consultoría para mejorar tu web, tus canales de venta y tus procesos.»

CTA: «Hacer diagnóstico inicial gratis», a /diagnostico. Confianza: «Primero entendemos. Después decidimos qué mejorar.»

Notebook y celular con hardware fotorrealista generado, recursos transparentes optimizados y pantallas HTML. La notebook alterna web, tienda y conversación. El celular muestra avisos ilustrativos de WhatsApp, Instagram y Facebook. Se descartó la bandeja unificada que hacía parecer la propuesta un CRM.

## En vista previa: PR #10

https://deploy-preview-10--warm-khapse-af459b.netlify.app/

- Letras individuales con reacción por proximidad al cursor y retorno al salir; foco de teclado con respuesta acotada.
- Fondo editorial elegido por el usuario: plano diagonal en verde oscuro (#252c1b y #303923), desplazamiento lento de 22 segundos y pulsos sobre tres curvas de conexión.
- Negro limpio detrás del titular y mayor presencia del fondo detrás de los dispositivos. En móvil el plano se concentra alrededor de la escena.
- Se ocultan las órbitas anteriores para evitar superponer recursos.
- Fuentes, dispositivos, copy y CTA conservados. Sin dependencias ni imágenes nuevas para el fondo.

El usuario eligió la dirección editorial. El estado documentado es preview: verificar aprobación y estado del PR antes de publicar.

## Movimiento y QA

Pausa compartida, movimiento reducido, suspensión fuera de pantalla/pestaña y escena legible sin GSAP. El fondo sigue data-motion para su estado; las letras se restablecen al pausar.

93/93 pruebas locales aprobadas. Fondo revisado en escritorio y viewport de 390px; letras y pulsos también revisados a 320px. Sin desborde horizontal ni notificaciones recortadas en esos marcos. Pausa del plano y reacción del texto comprobadas en navegador.

No probado en teléfono físico ni Safari/iOS. No afirmar que el detector está libre de advertencias: señaló estilos anteriores y aproximaciones de contraste que requieren inspección contextual. Esta actualización es documental y no modifica la interfaz.

## Refinamiento con UI UX Pro Max — 30/10/2026

La revisión solicitada conserva identidad, titular y hardware. Se reduce el fondo a un plano tonal y la flotación de 9 a 3 px. Las notificaciones conservan protagonismo. En móvil, el orden visual y DOM pasa a titular → bajada/CTA → dispositivos; la escena se compacta a relación 1.25. El control de pausa gana área de 44px y texto de 11px. En tablet los dispositivos se encuadran dentro del ancho disponible. Las recomendaciones de la skill orientan la revisión; no sustituyen la identidad confirmada ni autorizan publicación.
