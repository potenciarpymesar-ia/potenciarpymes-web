# Figma Make — entrega compatible, no archivo creado

Este documento es una especificación de importación y un prompt reutilizable. No acredita creación de archivo, ejecución de Figma Make, publicación de librería ni sincronización automática. El código y los tokens locales siguen siendo la fuente verificable.

## Material de entrada

Adjuntar `design-tokens.json`, `docs/DESIGN_SYSTEM.md` y capturas reales de `/design-system.html` y de las páginas existentes que se hayan inspeccionado. Si no hay capturas, usar el HTML local como referencia y declarar esa limitación. No reemplazar fotografías/logos del proyecto por imágenes de stock o generadas.

`design-tokens.css` se genera desde el JSON con `scripts/build-design-tokens.cjs`. `design-system.css`, `design-system.js` y `design-system.html` son la implementación de referencia. La capa común ya contiene menú móvil, reveal fail-open, foco, pausa explícita y gestión modal; las páginas actualizadas incorporan radios con flechas/roving, FAQ vinculada y mensajes accesibles de formulario. Hay QA local de navegador acotado, registrado en DESIGN_SYSTEM.md; no es certificación WCAG ni auditoría externa completa. Figma no debe producir una segunda paleta o escala independiente. Copiar valores del JSON; una importación requiere comprobar el soporte de la herramienta elegida, no asumir que acepta automáticamente cualquier esquema.

## Organización propuesta del archivo

| Página | Contenido | Resultado esperado |
| --- | --- | --- |
| 00 / Contexto | Alcance, fuente, pendientes, negocio y copy protegido | Transparencia sobre lo verificado |
| 01 / Foundations | Colores, contraste, tipo, espacios, grids, bordes, movimiento | Variables y estilos coherentes con JSON |
| 02 / Components | Inventario 01–48 del sistema, variantes y estados | Componentes nombrados por función real |
| 03 / Patterns | Hero, casos, dos entradas gratis, formularios, resultado y Completo | Composiciones con Auto Layout |
| 04 / Pages | Home, Inicial, Chequeo y Completo | Frames desktop/móvil fieles al sitio |
| 05 / QA | Foco, errores, reduce motion, textos largos, límites | Checklist y brechas explícitas |

Organización propuesta, no prueba de que esas páginas existen en Figma. No todos los bloques editoriales necesitan convertirse en un componente rígido; crear instancias donde haya repetición real.

## Variables y propiedades

- Colección `Brand`: ink/paper/lime inmutables; valores `--pp-brand-*` del JSON.
- Colección `Semantic`: modos Dark/Light; bg, surface, surface-raised, text, text-muted, text-subtle, border, action-bg/text/hover, focus y success/warning/danger/info con superficies correspondientes.
- Colección `Space`: space/1–12; 4/8/12/16/24/32/40/48/64/80/96/128 px.
- Estilos de texto `Display/1…9` y `Body/1…9`: Bricolage Grotesque y Manrope; documentar tamaños fluidos web, no pretender que un frame fijo reproduce clamp dinámico. Interlineados del JSON: display 1.02, heading 1.08, body 1.7, label 1.4; tracking display −0.045em.
- Layout: contenedor máximo 1440 px, gutters adaptables, composición editorial sin radius indiscriminado. Frames de prueba: 320, 390, 768, 900 y 1440 px; los límites CSS existentes varían por página.
- Motion: valores de motion/ease del JSON como especificación; prototype puede ilustrar la transición, no acreditar implementación ni equivalencia exacta.
- Component properties: `theme=dark|light`, `kind=primary|secondary`, `state=default|hover|focus|disabled|loading|error|success`, texto e icono opcional. Sólo exponer estados aplicables al patrón.
- Opciones: `selection=single|multiple`, `checked=true|false`; `aria-checked` es requisito web, no atributo que Figma pueda validar.
- Paneles de entrada: `entry=initial|web-check|complete`; textos y destino definidos, no propiedad genérica «plan premium» que borre gratis/pago.
- Portfolio: `type=real-case|concept`; mantener etiqueta visible. No crear componente Testimonial porque no existe evidencia verificable.

Auto Layout horizontal/vertical y wrap donde corresponda; texto hug-content, bloques fill-container, altura determinada por contenido. No fijar altura de formulario para igualar tarjetas. Definir orden de lectura antes de variar columnas.

## Prompt para Figma Make

> Construí un sistema de diseño y cuatro vistas de referencia de Potenciar Pymes usando exclusivamente los archivos adjuntos y el sitio local. Usá design-tokens.json como fuente de colores, tamaños, espacios, estados y temas. Conservá negro cálido #11110f, papel #f0eee8 y lima #d7ff3f, Bricolage Grotesque para display y Manrope para cuerpo. La dirección es editorial, asimétrica, bordes rectos, numeración y separadores; no convertirla en un dashboard SaaS con tarjetas redondeadas genéricas.
>
> Conservá «Mucho movimiento. Poca claridad.» y «Primero entendemos. Después decidimos qué mejorar.», la idea de ecosistema y el retrato real de Jonathan Frenquel. Los casos reales describen trabajo realizado; no inventes resultados, testimonios, logos, credenciales ni nuevos clientes. Los conceptos del portfolio siguen identificados como conceptos.
>
> Home presenta dos alternativas gratuitas independientes. Diagnóstico inicial gratis: cinco preguntas, con o sin web, orientación por respuestas declaradas, sin verificar canales. Chequeo web gratis: URL y señales públicas observables, sin acceso a cuentas ni configuraciones internas. Ambos anticipan nombre y WhatsApp obligatorios en el flujo actual y muestran resultados en sus propias páginas. No agregues redirección automática ni vuelvas obligatorio completar ambos.
>
> Diagnóstico Digital Completo es pago y asistido por humanos: contexto, evidencia, validaciones, prioridades y Plan de acción con acciones, dependencias, roles sugeridos y criterios de finalización según el alcance acordado. Alcance y valor se acuerdan antes de comenzar. No publiques precio inventado. Implementación opcional y cotizada por separado; puede hacerla el equipo del cliente u otro proveedor. Su landing no es un resultado personalizado.
>
> Inventariá los 48 patrones documentados en DESIGN_SYSTEM.md con anatomía, variantes, estados y ejemplos correcto/incorrecto. Producí vistas desktop 1440 px y mobile 390 px; comprobá frame 320 px y textos largos. Usá Auto Layout y variables semánticas Dark/Light, sin reemplazar assets por imágenes generadas. Representá foco visible, controles etiquetados, errores descriptivos, estados de envío y mensajes no dependientes del color. Incluí menú móvil abierto/cerrado, contenido visible sin animación, controles Pausar/Reanudar, radios con flechas/roving tabindex y modal con fondo inert, foco atrapado, Escape y retorno. Esas correcciones están implementadas en código local actualizado y tienen pruebas acotadas de navegador documentadas; no afirmes certificación WCAG, auditoría externa ni validación de producción.
>
> Prototipo sólo local/simulado: no envíes leads, no abras conversaciones WhatsApp automáticamente, no cambies analítica/backend/scoring ni publiques. Distinguí confirmada, ya resuelta, no reproducible y pendiente en QA; un frame no prueba funcionamiento del sitio. Entregá páginas Foundations, Components, Patterns, Pages y QA con referencias al HTML/selectores reales y una lista de desviaciones pendientes.

## Verificación al recibir resultado

1. Comparar tokens exportados con el JSON; no aceptar nueva escala o colores «parecidos». Verificar tema claro y oscuro, incluidos estados y foco.
2. Revisar cada patrón con su evidencia de archivo/selector; eliminar cualquier testimonio o función inventada.
3. Revisar jerarquía, wrap, cortes tipográficos, gutters, retrato, logo y mensajes protegidos a 320/390/1440 px.
4. Confirmar que gratis/pago/contacto/observables/implementación opcional se mantienen visibles antes de la acción.
5. El prototipo puede representar estados; validar interacción real, contraste renderizado y accesibilidad en navegador al implementar. No cerrar brechas sólo porque aparezcan en un frame.
6. Registrar si faltó una fuente, asset o captura, qué se simuló y qué no se verificó. Compartir el enlace únicamente después de que exista y se haya abierto/comprobado.

## Límites de esta entrega

El QA local final cubrió ocho rutas a 320/360/390/430/768/900/1440 px: 56 combinaciones sin overflow ni assets rotos. El catálogo a 320 px necesitó overflow-wrap para una palabra larga; recheck scrollWidth 305 ≤320. También se probaron menú/Escape en home y Web Profesional, tema claro del catálogo, cuestionario con cinco respuestas/foco/flechas, chequeo con fixture y error 500, modal trap/inert/retorno y fallback portfolio sin JS. El cierre modal permanece visible a 16 px del borde y con objetivo de 44 px. Headings usan tokens y ancho editorial 12ch en home, sin tracking −0.09em; loops decorativos estáticos. Las fuentes fueron comprobadas con `document.fonts.check`. Se registraron 13 tests unitarios PASS como guards de un subconjunto (no auditoría AA completa), 42 verificaciones de contraste y validación estática de 30 HTML/159 scripts/29 schemas/490 links. Capturas finales actualizadas: `../tmp/diagnostic-qa/ds-home-desktop.png`, `ds-home-mobile.png` y `ds-reference-desktop.png` en ese mismo directorio. No convertir estas pruebas en afirmación de cobertura total: lector de pantalla, zoom real 200%/400% y cambio dinámico de reduced motion permanecen pendientes. No se midió CLS real ni se ejecutó Lighthouse, Runlab o una batería de rendimiento; no afirmar performance medida.

No se cuenta con auditoría visual externa completa ni con autorización verificable para usar un expediente Gezatek. No se presenta un ejemplo de expediente como resultado automático. `docs/diagnostic-journeys-review.md` informa pruebas locales previas y dependencias de Audit; esa evidencia no valida despliegue, credenciales o notificaciones de producción. La creación del archivo Figma es una acción posterior explícita, no realizada por estos documentos.
