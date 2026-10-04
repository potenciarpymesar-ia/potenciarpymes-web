# Potenciar Pymes — sistema de diseño

Estado: especificación, catálogo, correcciones y QA local de navegador ejecutado; no publicación ni archivo Figma creado. La fuente es el sitio existente, no una plantilla genérica. El QA descrito abajo no equivale a certificación WCAG, auditoría externa completa ni validación de producción.

## Fuentes y alcance

- Marca y composición: `index.html`, `diagnostico-digital.html`, `web-profesional.html`.
- Servicios: `service-premium.css`, `service-premium.js`, `auditoria-web.html`, `tiendanube.html`.
- Cuestionario: `diagnostico.html`, `diagnostico-premium.css`.
- Evidencia histórica: `docs/diagnostic-journeys-review.md`; revisión local de recorridos, no auditoría visual externa completa.
- Fuente de tokens: `design-tokens.json`. Generación: `node scripts/build-design-tokens.cjs`; comprobación: `node scripts/build-design-tokens.cjs --check`. `design-tokens.css` es generado y no debe editarse a mano. Catálogo: `/design-system.html`; capa común: `design-system.css` y `design-system.js`.

El historial reciente incluye certificación Tiendanube, mejoras de hero móvil y coverflow. Se preservan las modificaciones locales anteriores. No se modifican backend, scoring, infraestructura ni archivos sincronizados de `sources/`.

## Principios de marca y lenguaje

1. Claridad antes que herramientas: mantener «Mucho movimiento. Poca claridad.» y «Primero entendemos. Después decidimos qué mejorar.».
2. Ecosistema: presencia, ventas, atención, medición y conexiones; no reducir la propuesta a una web.
3. Fundador visible: utilizar el retrato existente de Jonathan Frenquel, sin generar otra persona o atribuir credenciales nuevas.
4. Evidencia antes que promesas: los casos describen trabajo realizado; no fabricar testimonios, porcentajes, clientes ni resultados comerciales.
5. Dos entradas gratuitas independientes y un servicio pago para profundizar. Ninguna entrada gratuita exige completar la otra.
6. Implementación posterior opcional, alcance independiente y cotización separada; el cliente puede implementar con su equipo o proveedor.

| Recorrido | Información que debe mantenerse | CTA | Lo que no debe afirmarse |
| --- | --- | --- | --- |
| Diagnóstico inicial gratis | Cinco preguntas, con o sin web; orientación por respuestas declaradas; contacto obligatorio anticipado | RESPONDER LAS 5 PREGUNTAS | Inspección automática de canales o diagnóstico integral |
| Chequeo web gratis | URL; señales públicas observables; no contraseñas ni acceso a cuentas; contacto anticipado | REVISAR MI WEB | Configuración interna validada, formularios entregando leads o medición funcionando |
| Diagnóstico Digital Completo / Pago | Revisión humana, contexto, evidencia, validaciones y prioridades; alcance y valor acordados | CONSULTAR POR EL DIAGNÓSTICO COMPLETO | Resultado personalizado al entrar a la landing o servicio gratuito |
| Plan de acción | Acciones, dependencias, roles sugeridos y criterios de finalización según alcance | Incluido en explicación del Completo | Plan fijo universal, fechas garantizadas o ejecución incluida |

## Tokens y temas

Marca inmutable: `--pp-brand-ink` #11110f, `--pp-brand-paper` #f0eee8, `--pp-brand-lime` #d7ff3f. No convertir lima en verde genérico ni negro en negro puro. Semánticos de superficie y texto sí varían entre dark/light mediante `data-theme`; el tema no altera logo, imágenes o identidad.

| Uso | Contrato CSS | Regla |
| --- | --- | --- |
| Página / panel / panel elevado | `--pp-bg`, `--pp-surface`, `--pp-surface-raised` | Tres niveles, no sombras en cada bloque |
| Texto principal / secundario / auxiliar | `--pp-text`, `--pp-text-muted`, `--pp-text-subtle` | Usar semánticos; nunca blanco fijo sobre panel claro |
| Separadores | `--pp-border` | No son por sí solos evidencia de contraste suficiente para un control |
| Acción | `--pp-action-bg`, `--pp-action-text`, `--pp-action-hover` | CTA principal legible antes, durante y después de hover |
| Foco | `--pp-focus` | Anillo contrastante con superficie adyacente; no sólo cambio de color del texto |
| Estados | `--pp-success`, `--pp-warning`, `--pp-danger`, `--pp-info` y respectivos `-bg` | Texto + estado textual; no depender exclusivamente del color |
| Tipografías | `--pp-font-display`, `--pp-font-body` | Bricolage Grotesque / Manrope; Arial y sans-serif como respaldo |
| Tipo | `--pp-type-1`…`--pp-type-9` | 1–6: 12, 14, 16, 20, 25, 31.25 px nominales; 7–9: escalas editoriales fluidas, no progresión rígida |
| Espaciado | `--pp-space-1`…`--pp-space-12` | 4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96, 128 px |
| Movimiento | `--pp-motion-fast`, `--pp-motion-normal`, `--pp-motion-slow`; `--pp-ease-standard`, `--pp-ease-enter` | Reutilizar duraciones del JSON, no sumar animaciones nuevas por componente |
| Contenedor | `--pp-container-max` | 1440 px; gutters fluidos, mínimo cómodo en móvil |

Los alias legacy (`--ink`, `--paper`, `--lime`, `--text-*`, `--paper-*`) permiten migración incremental; no son una segunda fuente de verdad. El CSS existente puede contener overrides por página y colores con alpha: medir el valor compuesto efectivo antes de declarar accesibilidad.

### Tipografía y legibilidad

Display para títulos y marcas; cuerpo para párrafos, labels, botones y estados. Conservar gesto editorial y tamaños fluidos sin trasladar el tracking extremo de desktop a móvil. Cuerpo habitual 16 px; tokens finales de interlineado: display 1.02, heading 1.08, body 1.7 y label 1.4. Tracking display −0.045em y heading −0.035em; labels cortos 12–14 px, no párrafos completos en mayúsculas. Títulos móviles con interlineado ≥1.08 y tracking moderado; no forzar cortes que separen palabras o solapen glifos. Las páginas existentes pueden usar hero mayor que el noveno token: es una variante editorial, no razón para aumentar todos los h1.

### Contraste y foco

Objetivos de aceptación: texto normal ≥4.5:1; texto grande ≥3:1; límites necesarios de controles, iconos informativos y foco ≥3:1. Comprobar ambos temas y estados hover/selected/error. Una combinación válida no convierte en válida una opacidad reducida ni un texto encima de foto.

Los ratios de tokens se verifican en `tests/design-tokens.test.cjs`; son cálculos sRGB, no certificación WCAG de páginas completas. Contraste de gradientes, imágenes, bordes translúcidos y overrides debe verificarse en navegador.

| Combinación de tokens | Dark | Light | Uso aceptable |
| --- | --- | --- | --- |
| text / bg | 16.29:1 | 16.29:1 | Texto normal |
| text-muted / bg | 9.71:1 | 6.00:1 | Texto secundario |
| text-subtle / bg | 7.27:1 | 4.93:1 | Texto auxiliar sin reducir opacidad |
| action-text / action-bg | 16.44:1 | 16.44:1 | Label CTA |
| action-text / action-hover | 12.02:1 | 12.02:1 | Label CTA en hover |
| focus / bg | 16.44:1 | 5.36:1 | Indicador de foco sobre bg |
| border / bg | 4.19:1 | 3.20:1 | Límite visual de control; no texto |
| success / success-bg | 8.37:1 | 6.08:1 | Texto de éxito |
| warning / warning-bg | 9.41:1 | 6.36:1 | Texto de advertencia |
| danger / danger-bg | 8.45:1 | 5.63:1 | Texto de error |
| info / info-bg | 8.57:1 | 5.88:1 | Texto informativo |

Ratios redondeados del contrato de tokens; sólo aplican a esos pares exactos. La batería incluye además otras superficies, hover y foco; debe ejecutarse para confirmar el estado local final.

## Composición, responsive y movimiento

- Negro cálido + papel + lima, bordes rectos, separadores finos, numeración editorial. Un bloque lima es énfasis; no repetirlo en cada sección.
- Headings integrados usan tokens; home conserva ancho editorial de 12ch y lettering legible, sin tracking agresivo −0.09em. Los loops decorativos quedan estáticos; no equivalen a una mejora de rendimiento medida.
- Contenedor centrado de hasta 1440 px. Hero asimétrico, texto en columnas, paneles de lectura y grids que colapsan sin cambiar orden semántico.
- Breakpoints observados: 520 px (cuestionario), 560 px (servicios), 760 px (niveles), 780 px (home), 900 px (servicios/cuestionario); la landing Completo tiene además 800/480 px. Son límites existentes por composición, no tamaños de dispositivos. Revisar puntos intermedios, zoom 200% y ancho 320 px.
- No ocultar el acceso a un destino cuando desaparece la navegación desktop. CTAs deben envolver texto y permanecer dentro del viewport; formularios pasan a una columna.
- `prefers-reduced-motion: reduce`: sin atmósfera animada, parallax, reveal bloqueante ni autoplay. La capa común hace visibles reveals y primeras slides aun sin inicialización JS. El coverflow pausa por foco/hover, tiene control explícito Pausar/Reanudar y usa flechas; las marcas de home tienen pausa explícita. `service-premium.js` preserva logo oficial y reinicia parallax al cambiar preferencia de movimiento. Son correcciones de código; verificar resultado renderizado.
- Transiciones de controles cortas; desplazamientos decorativos no comunican estados. Evitar scroll hijacking y movimiento al escribir en formularios.

## Inventario de patrones reales

En las tablas, «teclado/a11y» define el contrato de aceptación; las brechas actuales identificadas se consignan al final. «N/A» significa sin interacción propia, no exento de lectura semántica. Cada fila incluye anatomía, variantes y estados, respuesta móvil y uso correcto/incorrecto.

| # / patrón y evidencia | Función y anatomía | Variantes / estados | Móvil | Teclado / a11y | Correcto / incorrecto |
| --- | --- | --- | --- | --- | --- |
| 01 Marca — `index.html .nav-brand`; servicios `.nav-logo`; `design-system.css` | Identificar y volver a inicio; link + logo oficial | Imagen preservada; default, hover, focus | Mantener logo legible y CTA sin choque | Nombre «Potenciar Pymes, inicio»; un tab stop | Logo existente / redibujar o deformar marca |
| 02 Navegación — `index.html .nav-inner .nav-links`; `design-system.js .pp-nav-toggle` | Destinos principales; marca + links + CTA + menú móvil | Top / scrolled; desktop / menú closed/open | ≤900 menú expandible; links visibles si JS no inicializa | Button con expanded/controls, Escape devuelve foco, selección cierra; probar orden | Acceso a rutas / ocultar destinos sin alternativa |
| 03 Salto — `index.html .skip-link`; Completo `.skip` | Evitar cabecera repetida; link a main | Oculto en reposo / visible con foco | Funciona también con teclado móvil | Primer link; destino main válido, foco no tapado | Visible al enfocar / esconder con display:none |
| 04 CTA principal — `index.html .button`; servicios `.btn-primary` | Acción dominante; texto + flecha | Lima / tinta; hover, focus, disabled si button | Texto multilínea y ancho disponible | Link para navegar; button para ejecutar; nombre sin depender de flecha | Acción concreta / «Empezar» ambiguo en todos los recorridos |
| 05 CTA secundario — `.button-outline`, Completo `.ghost` | Alternativa menos dominante; borde + texto | Outline; hover, focus | Apilar sin reducir área táctil | Igual contrato que CTA principal; contraste del borde | Alternativa real / competir con cuatro primarios |
| 06 Hero fundador — `index.html .hero .hero-photo` | Explicar propuesta y humanizar; picture + h1 + copy + acciones | Desktop editorial / retrato apilado | ≤780 imagen contenida, luego mensaje | Alt «Jonathan Frenquel, fundador…»; lectura del h1 antes de CTA | Retrato existente / persona generada o recorte que elimina rostro |
| 07 Kicker e índice — `.hero-kicker .hero-index .eyebrow` | Contextualizar; etiqueta corta + número opcional | Marca / sección / gratis o pago | No forzar una sola línea | Texto real; no reemplaza heading; N/A teclado | «Servicio pago» / usar microcopy para condiciones ocultas |
| 08 Wordmark decorativo — `.hero-wordmark`; `.svc-hero::before` | Escala visual sin contenido nuevo | Home / watermark servicio; quieto o parallax | Home se oculta; watermark no desborda | `aria-hidden` si elemento; pseudo-elemento sin información exclusiva | Decoración / título sólo en pseudo-elemento |
| 09 Apertura problema — `.insight-intro` | Introducir necesidad; eyebrow + h2 + explicación | Dark; visible / reveal | Una columna | Heading vinculado a sección; N/A | «Mucho movimiento. Poca claridad.» / borrar diferenciación por slogans genéricos |
| 10 Fila problema — `.insight-line` | Escanear síntomas; número + h3 + párrafo | Tres temas existentes; reveal | Número y título, copy debajo | Article y heading; N/A | Síntoma contextual / «problema confirmado» sin evidencia |
| 11 Método — `.system-read` | Mostrar enfoque; h3 + readout | Papel; desktop dos columnas | Una columna | Orden semántico consistente; N/A | «Primero entendemos…» / empezar vendiendo herramienta |
| 12 Readout — `.readout-row` | Secuencia detectar/ordenar/conectar/medir/mejorar | Cinco filas; default | Filas cortas con wrap | Texto legible; preferir lista para nueva instancia | Proceso orientador / prometer resultado en plazo fijo |
| 13 Caso real — `.proof-case .proof-brand` | Mostrar experiencia; número + marca + trabajo | Conectia BA / Wheels BA / Nutrepharma | Columnas apiladas | Article, h3 y texto; N/A | Trabajo descrito / testimonio o KPI inventado |
| 14 Evidencia de caso — `.proof-evidence` | Diferenciar alcance de claim; strong + párrafo + canales | Trabajo / canales conectados | Texto a ancho completo | Strong no reemplaza título; N/A | «Qué se trabajó» / atribuir ventas no documentadas |
| 15 Firmas clientes — `.client-signatures .signature`; `.pp-motion-control` | Identidad de marcas existentes; listado de nombres + pausa | Ocho nombres en home; en movimiento/paused | Nombres contenidos | Nombres accesibles; Pausar/Reanudar con aria-pressed; pausa por foco/hover | Nombres presentes / nuevos clientes o logos sintéticos |
| 16 Selector de entradas — `.diagnostic-levels` | Elegir alternativa; dos gratis + una paga | `.initial` / `.complete` | Una columna ≤760 | Articles y CTAs distintos; orden gratis→pago | Alternativas independientes / embudo que obliga pasar por ambas |
| 17 Panel nivel — `.diagnostic-level` | Explicar entrada; kicker + h3 + copy + CTA | Negocio / web / Completo; hover sólo CTA | Altura por contenido, sin huecos obligatorios | Gratis/pago en texto, no sólo color | Límites y condiciones / contacto sorpresivo al final |
| 18 Profesionales — `.professional-launch .professional-list` | Derivar a web profesional; título + explicación + alcance | Lima; cuatro filas | Dos columnas→una | CTA a ruta existente; N/A en filas | Web de servicios / ecommerce para todos |
| 19 Declaración editorial — `index.html .statement` | Resumir entregable; eyebrow + h2 + párrafo | Dark en home / lima en Completo | Heading con wrap natural | Semántica de sección y heading; N/A | Claridad para decidir / promesas automáticas |
| 20 Contacto editorial — `.contact-grid .contact-links` | Abrir conversación; título + copy + links | WhatsApp / diagnóstico | Una columna | Link externo con contexto y `rel=noopener` | Conversación opcional / confundir clic con consulta recibida |
| 21 Campo — `.field`; chequeo `.audit-field` | Capturar dato; label + input + ayuda/error | Nombre / tel / URL; empty, focus, filled, invalid | Ancho completo; teclado tel/url | Label asociado; required; autocomplete; error descrito | Label persistente / sólo placeholder |
| 22 Selector rubro — `index.html #rubro` | Contexto del negocio; label + select | Placeholder disabled / opción elegida | Control nativo a ancho completo | Select nativo operable con flechas | Opciones existentes / falso dropdown no operable |
| 23 Envío contacto — `.form-submit .form-status` | Enviar y confirmar; botón + live status | Ready, sending, accepted, error | Texto envuelve | Button submit; estado polite; evitar reenvíos | Aceptado por servidor / asegurar entrega por email sin evidencia |
| 24 Footer — `.footer .footer-links` | Destinos secundarios y privacidad | Home / servicios | Columnas→filas | Links reales con foco; nav etiquetado | Privacidad accesible / links sólo en hover |
| 25 Hero servicio — `.svc-hero .svc-tag .lead` | Alcance de servicio; etiqueta + h1 + límites | Servicios; chequeo con herramienta | Lead y acciones ocupan ancho | Un h1 principal; decoración separada | Chequeo de señales / auditoría integral gratis |
| 26 Sección servicio — `.svc-section` | Desglosar alcance; h2 + párrafo/lista | Copy / lista / FAQ; panel papel | Dos columnas→una ≤900 | Listas reales y jerarquía headings | Alcance claro / listado de herramientas sin propósito |
| 27 FAQ — `.faq-item .faq-q .faq-a`; `auditoria-web.html` | Revelar respuesta; button + panel + indicador | Collapsed / expanded | Sin ancho fijo ni corte de texto | Enter/Espacio; expanded sincronizado y controls asociado en código actualizado; probar render | Respuesta visible al abrir / anunciar cerrado mientras abierto |
| 28 Servicio relacionado — `.svc-related-card` | Continuar a ruta relevante; título + subtítulo + flecha | Grid de tres / lista | Una columna ≤900 | Un link completo; flecha decorativa | Ruta real / card clicable sin link |
| 29 Barra persistente — `.sticky-bar .sticky-close` | CTA auxiliar; resumen + link + cierre | Hidden / shown / dismissed | Compacta ≤560, sin tapar contenido | Cerrar con button; no captura foco; margen para foco inferior | CTA coherente / promesa «gratis en 15 min» no validada |
| 30 Intro cuestionario — `.diag-intro .diag-disclosure` | Explicar orientación; h2 + cinco preguntas + condiciones | Sticky desktop / estática | Una columna ≤900 | h1 accesible existe; condiciones antes del inicio | Con o sin web / decir que verifica canales |
| 31 Progreso — `.progress-wrap .progress-fill` | Ubicar paso; conteo + barra | 1–5 y contacto; width cambia | Ancho disponible | Texto de paso accesible; no sólo largo/color de barra | Conteo claro / contacto disfrazado de sexta pregunta |
| 32 Opción múltiple — `.option.option-multi` | Elegir varios; check + texto | Unselected / selected / focus | Fila amplia, texto envuelve | Checkbox semántico, Espacio, aria-checked | Varios canales / interacción sólo con mouse |
| 33 Opción única — `.option[role=radio]` | Elegir una; indicador + texto | Unselected / selected / focus | Fila amplia | Radiogroup; flechas/Home/End y roving tabindex implementados; probar recorrido | Una selección / radios todos en Tab sin flechas |
| 34 Navegación pasos — `.actions .btn-next .btn-back` | Avanzar/volver; dos buttons | Next disabled / enabled; previous | Apilado ≤520 | Disabled nativo; foco al título nuevo tras transición | Conservar respuestas / avanzar sin selección necesaria |
| 35 Resultado declarativo — `.result-header .score-wrap .gap-list` | Orientar; nombre + título + score + temas | Dinámico por respuestas; resultado visible | Sin overflow y lectura lineal | Heading y texto; cambio anunciado/foco; no sólo score | «Por tus respuestas» / calidad auditada del negocio |
| 36 Paso pago opcional — `.plan-rec .wa-btn` | Profundizar sin redirigir; explicación + link | Diagnóstico Completo pago | CTA multilínea | Link descriptivo; no navegación automática | Alcance acordado / hacerlo parecer resultado gratuito |
| 37 URL chequeo — `#auditStepUrl .audit-input` | Iniciar lectura pública; label + URL + aviso + button | Empty, invalid, submitting | Panel bajo hero o junto a él según ancho | inputmode URL; error asociado; Enter debe probarse | Dirección pública / pedir contraseña |
| 38 Carga y fallo chequeo — `#auditStepLoading .audit-loading .audit-error` | Comunicar espera y permitir reintento | Loading / error / retry | Sin salto que esconda mensaje | Status/alert, aria-busy/invalid y foco a campo/título implementados; probar anuncio | «No pudimos revisar» / señal ausente por inaccesibilidad |
| 39 Resultado señales — `#auditStepResult .audit-score-row .audit-chip` | Exponer observables; recuento + severidades + áreas + límite | Chips de severidad / área, recomendación dinámica | Chips envuelven | Severidad en texto, resultado anunciado | Checks con señal / score como salud integral |
| 40 Mapa ecosistema — Completo `.hero-map .signal-row` | Lectura de propuesta; cuatro filas | Presencia / experiencia / conexión / prioridad | Apilado o compacto | Aside etiquetado; no control falso | Esquema conceptual / simular dashboard cliente |
| 41 Áreas de análisis — Completo `.areas .area` | Alcance aplicable; número + título + pregunta | Seis áreas | Grid→dos→una | Heading/estructura coherente; N/A | Canales aplicables al negocio / todos obligatorios |
| 42 Entregables — Completo `.deliverables .deliverable` | Explicar salida; número + h3 + copy | Diagnóstico/evidencia/criterio/prioridad/plan | Grid→una | Articles con h3; N/A | Roles, dependencias y criterios / lista automática sin humano |
| 43 Proceso — Completo `.steps .step` | Explicar fases; índice + h3 + párrafo | Acordar/revisar/priorizar/ordenar | Grid colapsa | Orden de lectura igual al visual; N/A | Alcance antes de empezar / servicio activado al clic |
| 44 Comparación y límites — Completo `.comparison`; Web `.boundaries` | Evitar confusión; panels + títulos + límites | Gratis/pago; no ecommerce/no software/no diagnóstico | Panels apilados | No tabs ni selección donde son contenido | Diferencias explícitas / funcionalidades inventadas |
| 45 Implementación — Completo `.implementation-grid` | Separar ejecución del diagnóstico; título + límites + link | Opcional; default, link focus | Una columna | Información independiente de CTA; link externo claro | Cotización separada / ejecución incluida implícita |
| 46 Portfolio coverflow — Web `.coverflow .cover-slide`; `.pp-motion-control` | Navegar ejemplos; stage + slide + controles + caption + pausa | Active/prev/next/far; caso real/concepto; paused | Swipe sin bloquear scroll vertical | Flechas, buttons y dots; pausa explícita/foco/reduce; caption polite | Etiquetar «concepto» / presentar conceptos como clientes |
| 47 Lightbox — Web `.portfolio-lightbox`; `design-system.js` | Ampliar ejemplo; dialog + contenido + cerrar | Closed/open | Imagen contenida y cierre visible | Escape/retorno existentes; trap de Tab y fondo inert agregados; validar navegador | Modal operable / foco sale al fondo |
| 48 Aliado y credencial — Web `.muro`; Tiendanube asset certificado | Mostrar relación existente; logo + nombre + alcance | Marcas Muro / Tiendanube Partners | Logos contenidos sin deformar | Alt útil, texto de relación; N/A | Assets oficiales del repo / nuevos sellos o respaldo no acreditado |

No existe en este inventario un patrón «testimonio» verificado. Casos, marcas, conceptos visuales y credenciales no son intercambiables.

## Assets y fuentes existentes

| Asset | Uso autorizado por evidencia del sitio | Restricción |
| --- | --- | --- |
| `logo.png` | Marca principal | No alterar proporciones o construir sello nuevo |
| `favicon-potenciar-pymes-2026.png`, `og-potenciar-pymes-2026.png` | Identidad de navegador/social | No tratar OG como logo escalable |
| `jonathan.webp`, `jonathan.jpg` | Retrato fundador, picture con fallback | No recrear rostro, cargo o biografía |
| `conectia-ba-logo.png`, `wheels-ba-logo.jpg`, `nutrepharma-logo.png` | Logos de casos existentes | No convertirlos en testimonios |
| `marcas-muro-logo.png` | Aliado mostrado en Web Profesional | Mantener alcance independiente |
| `assets/tiendanube/tiendanube-partners-agencia-certificada.png` | Certificación ya incorporada en sitio | No generar otra certificación |
| `assets/web-profesional/*.png` | Ejemplos/portfolio; labels de caso real vs concepto en HTML | No atribuir a clientes los conceptos |
| Google Fonts en HTML/CSS | Bricolage Grotesque y Manrope | Import existente no garantiza carga offline; conservar fallback |

«Oficial» aquí significa archivo utilizado por el proyecto; no una nueva verificación de licencias o acuerdos de marcas externas. Antes de reutilizar públicamente un caso o expediente ajeno, confirmar autorización.

## Hallazgos y trazabilidad

Clasificación basada en código revisado y reporte local anterior. No se recibió una auditoría visual externa completa; no se atribuyen hallazgos a capturas que no se inspeccionaron.

| Hallazgo | Estado | Evidencia y límite |
| --- | --- | --- |
| Inicial era confundible con inspección de canales | Ya resuelta en copy local | `diagnostico.html .diag-disclosure` y resultado aclaran respuestas declaradas; QA previo documentado |
| Completo se presentaba como gratuito | Ya resuelta en copy local | Home, Completo y `llms.txt` identifican servicio pago; no cambia motor Audit |
| Resultado gratuito llevaba a landing comercial | Ya resuelta en recorrido local | Reporte previo: resultado permanece; link pago optativo |
| Mobile overflow de recorridos revisados | Ya resuelta según QA previo, no prueba universal | Reporte documenta 360/390/430 px; ampliar a 320, zoom y otras páginas |
| Radios custom sin flechas/roving | Ya resuelta en código y recorrido local probado | `diagnostico.html`: flechas y cinco respuestas con fixture; resultado y foco comprobados; lector de pantalla pendiente |
| FAQ sin vínculo `aria-controls` | Ya resuelta en código actualizado | Botones vinculados con ID de panel y estado expanded; prueba exhaustiva de todas las FAQ/lector de pantalla no documentada |
| Lightbox sin trap/inert | Ya resuelta y probada localmente | Modal: ciclo Tab, fondo inert, Escape, retorno de foco y cierre dentro del viewport; lector de pantalla pendiente |
| Navegación móvil oculta | Ya resuelta; home y Web Profesional probadas | Menú y Escape; fallback Web Profesional sin JS mantiene links |
| Reveals ocultos al fallar JS | Ya resuelta en CSS; fallback portfolio probado | Primera slide opacity 1 y links visibles sin JS en Web Profesional; no acredita todos los fallos posibles |
| Autoplay sin pausa explícita | Ya resuelta en código | Controles de pausa para marcas y coverflow; prueba dinámica de cambio OS reduced motion pendiente |
| Foco insuficiente y estados de formulario | Correcciones implementadas; recorridos localmente probados | Cuestionario/Audit foco y resultado; error Audit 500 con alert; anuncios con lector de pantalla pendientes |
| Copy sticky «Diagnóstico gratuito en 15 min» | Confirmada en fuente; pendiente comprobar estado renderizado y corregir | `auditoria-web.html .sticky-bar-text`; no asumir que coincide con alcance actual |
| Motor usa «detalle exacto»/«Auditoría Full» | Pendiente dependencia externa | Reporte previo lo identifica; este sistema no maquilla ni reescribe respuesta API |
| GA4 regex, captura real de formulario, longitud de title | Pendiente backend/Audit | Señal observada no valida configuración ni entrega; no tocado aquí |
| Recomendación ecommerce inadecuada para profesionales | Pendiente revisión de scoring | Reporte previo; no se modifican `calcScore/getGaps/getNivel` |
| Entrega de notificaciones | Pendiente validación producción | HTTP aceptado ≠ correo/WhatsApp entregado |
| Auditoría visual externa y ejemplo Gezatek autorizado | No reproducible con material disponible | No se dispone de informe/capturas/autorización; no inventar verificación |

## QA local final — evidencia y límites

Ejecutado por el trabajo integrador en navegador sobre servidor local. No se enviaron leads de producción ni se cambió producción. Las fixtures locales no validan credenciales, notificaciones o disponibilidad de backend desplegado.

| Prueba | Evidencia registrada |
| --- | --- |
| Ocho rutas a 320/360/390/430/768/900/1440 px | 56 combinaciones: `/`, `/soluciones`, `/tiendanube`, `/diagnostico`, `/auditoria-web`, `/diagnostico-digital`, `/web-profesional`, `/design-system.html`: sin desbordamiento horizontal; cero assets rotos. Catálogo a 320 px: palabra larga corregida con overflow-wrap; recheck scrollWidth 305 ≤320 |
| Menú móvil | Home y Web Profesional: apertura y Escape comprobados |
| Catálogo | Tema claro probado; sin enlace de salto duplicado |
| Cuestionario | Cinco respuestas, fixture local, resultado, foco y flechas de radios probados |
| Chequeo web | Start/reveal/resultado con fixture; eventos dataLayer sin PII; fallo start 500 controlado con alert visible |
| Modal portfolio | Tab atrapado, fondo inert, Escape y retorno; cierre dentro del viewport con margen 16 px y objetivo 44 px |
| Fallback sin JS | Web Profesional: links visibles y primera slide opacity 1 |
| Fuentes cargadas | `document.fonts.check` devuelve true para Manrope y Bricolage Grotesque |
| Validación automática | 13 tests unitarios PASS (guards de un subconjunto, no auditoría AA completa); 42 verificaciones de contraste; validación estática de 30 HTML, 159 scripts, 29 schemas y 490 enlaces |

Capturas finales actualizadas fuera del repositorio: `../tmp/diagnostic-qa/ds-home-desktop.png`, `../tmp/diagnostic-qa/ds-home-mobile.png` y `../tmp/diagnostic-qa/ds-reference-desktop.png`. Confirman material disponible del QA local; no son un informe externo ni sustituyen todas las pruebas de interacción.

Pendiente manual: lector de pantalla completo; zoom real 200%/400%; cambios dinámicos de preferencia reduced motion del sistema operativo. No se midió CLS real ni se ejecutó Lighthouse, Runlab o una batería de rendimiento: cualquier afirmación de mejora de performance queda pendiente de medición. El motor Audit conserva recomendaciones como «detalle exacto» y el cuestionario conserva recomendaciones categóricas de ecommerce: no fueron corregidos ni deben presentarse como hallazgos humanos verificados. FAQ exhaustiva y estados de cada página fuera de los recorridos documentados requieren revisión adicional.

## Aceptación de una migración

1. Generación reproducible de tokens y tests de contraste aprobados; ambos temas sin valores de texto hardcodeados que inviertan mal.
2. Mostrar inventario, anatomías, variantes y estados en catálogo sin enviar datos reales ni llamadas externas.
3. Navegación completa con Tab/Shift+Tab; Enter/Espacio; radios con flechas; modal con trap/Escape/retorno; foco no oculto por header o sticky.
4. Formularios: label, ayudas, required, error asociado, estado de envío y reintento; no confundir lead aceptado con entrega de notificación.
5. Responsive a 320/360/390/430/768/900/1440 px, zoom 200%, textos largos y reduced motion. Nombres y CTA deben envolver sin desbordar.
6. Copy preservado, evidencia honesta, sin modificar medición/backend/scoring; registrar pendientes en vez de afirmar QA no ejecutado.
