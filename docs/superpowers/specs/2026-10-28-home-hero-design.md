# Hero cinematográfico — diseño aprobado

El usuario aprobó la dirección «Tu negocio te necesita. Pero no para todo», la composición de la maqueta y su adaptación móvil. Solicitó conservar las fuentes originales y el carácter animado de los títulos.

## Objetivo y alcance

Reemplazar el retrato del hero por una escena de trabajo nocturno, con una animación que conecte consultas, seguimiento y ventas. Conservar Bricolage Grotesque, Manrope, logo, INK/PAPER/LIME, navegación y resto del home. CTA real a `/diagnostico`, con analítica existente. Entregar rama y preview; no integrar ni publicar en producción.

## Enfoques

- Escena animada de tareas (elegida): representa el trabajo cotidiano y el alivio de ordenar. La maqueta muestra escritorio, teléfono, presupuesto y computadora.
- Inversión sin claridad (alternativa): más comercial, pero excluye a quien todavía no invierte. No elegida como apertura.

## Implementación propuesta

Para el primer preview, fotografía generada optimizada, cámara y conexiones animadas con GSAP local; no se presenta como video filmado o generado. Versiones horizontal y móvil con encuadres distintos. El video completo queda como una etapa de producción posterior, no un resultado simulado.

Título: «TU NEGOCIO TE NECESITA. PERO NO PARA TODO.» Bajada desktop: «Consultas, presupuestos, ventas y tareas que se acumulan. Te ayudamos a ordenar la parte digital de tu negocio, conectar tus herramientas y definir qué mejorar primero.» Bajada móvil abreviada de la maqueta: «Ordenamos la parte digital de tu negocio y definimos qué mejorar primero.» Confianza: «Primero entendemos. Después decidimos qué mejorar.»

El CTA y el mensaje están disponibles sin esperar la animación. El movimiento se puede pausar, respeta preferencias reducidas incluso si cambian durante la sesión y se detiene fuera de pantalla y con pestaña oculta. Sin JS o sin GSAP, escena y texto estáticos legibles.

## Validación

Pruebas existentes y del controlador de movimiento; inspección visual a 375, 390, 430, 768 y 1440 px, teclado, zoom, fallback sin JS, carga de fuentes y ausencia de desbordes. No tocar CRM, Recursos ni PR #6.

## Revisión solicitada por el usuario

El usuario rechazó el preview fotográfico y pidió más estilo y movimiento dentro de la pantalla del celular (notificaciones de diferentes redes) y de la notebook. Se reemplaza la fotografía por dispositivos construidos en HTML/CSS, con notificaciones reconocibles y una bandeja de trabajo ilustrativa. Se conserva el mensaje y las fuentes. En móvil la escena aparece después del título y antes de la bajada/CTA, para demostrar el movimiento en la primera pantalla; la navegación conserva acceso al diagnóstico. Ningún aviso o resultado es dato real de un cliente.

## Posicionamiento aprobado — 30 de octubre

Retirar la apariencia de CRM: reemplazar bandeja con marca y menú lateral por tres escenas alternadas (web, tienda y conversación). Conservar los dispositivos y notificaciones. Bajada: «Te ayudamos a mejorar tu web, tus canales de venta y tus procesos. Primero detectamos qué necesita tu negocio; después conectamos las herramientas que tengan sentido para vos.» En móvil: «Consultoría para mejorar tu web, tus canales de venta y tus procesos.»
