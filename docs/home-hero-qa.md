# Hero con dispositivos — QA del preview

Fecha: 2026-10-28. PR borrador #9. Producción sin cambios.

## Dirección vigente

El usuario rechazó la fotografía animada y pidió movimiento dentro del celular (notificaciones de diferentes redes) y dentro de la notebook. La escena vigente se construye en HTML/CSS, sin fotografías ni video. Conserva el mensaje aprobado, Bricolage Grotesque, Manrope, logo y paleta originales.

El celular recibe avisos ilustrativos de WhatsApp, Instagram y Facebook. Las filas de la notebook se iluminan en la misma secuencia y termina destacándose un próximo paso. Se etiqueta «Escena ilustrativa»: no son consultas de clientes ni una demostración de un CRM contratado.

En móvil: título, dispositivos, bajada y CTA. La navegación conserva acceso al diagnóstico. El orden de teclado coincide con ese orden visual.

## Verificaciones

- `node --test tests/*.test.cjs`: 93/93 aprobadas.
- La prueba nueva usa GSAP real sobre objetos para verificar orden de tres notificaciones, actualización de la notebook, cierre y reinicio de la secuencia sin estados anteriores.
- Pausa manual, preferencias reducidas dinámicas, visibilidad, salida de pantalla y fallback sin GSAP mantienen sus pruebas.
- `node --check home-hero.js` y `git diff --check` aprobados.
- Preview Netlify revisado en Chrome. Se observaron transformaciones/opacidades cambiantes de las notificaciones en DOM y una entrada en pantalla.
- Marcos de viewport real a 320, 375, 390, 430, 768 y 1440 px: sin overflow horizontal, título dentro del viewport, líneas separadas y sin superposición del texto de escena con su control. En todos, `phoneContentFits` confirma que las tres tarjetas caben dentro de la pantalla.
- Revisión de código independiente: se corrigieron riesgo de recorte del último aviso en teléfonos angostos, orden visual/teclado y pausa larga entre ciclos. También se dio margen al borde derecho de la notebook.
- Los ejemplos completos permanecen en el HTML/CSS sin JS o con preferencias reducidas. La escena está excluida de la lectura accesible para no anunciar mensajes ficticios en cada repetición; el botón de pausa permanece accesible.
- Detector Impeccable ejecutado una vez. Se corrigió el contraste nuevo señalado en la hora de las notificaciones. Las advertencias sobre fondos/degradados corresponden al material del dispositivo y al identificador de Instagram; las de tarjetas anidadas describen notificaciones dentro de pantallas, no la estructura de la página. Los hallazgos del resto del home son previos y quedan fuera de este cambio.

## Límites

No se probó en teléfono físico, Safari/iOS, zoom completo al 200% ni una sesión con JS deshabilitado. Movimiento reducido y falta de GSAP se verificaron con pruebas del controlador, sin modificar preferencias del sistema del navegador. No se enviaron formularios ni se verificó recepción en GA4. Los mensajes son ejemplos, sin integración real con las redes.

La documentación PRODUCT.md contiene decisiones antiguas que difieren del código actual. No se actualizó fuera de alcance: la identidad vigente se tomó de las fuentes y tokens del sitio y de la instrucción del usuario.

CRM, Recursos y PR #6 sin modificaciones. No se integró el PR #9 ni se publicó el hero en producción.
