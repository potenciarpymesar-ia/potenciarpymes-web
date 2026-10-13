# Portadas para compartir enlaces

Selección visual aprobada por el usuario, integrada el 12 de octubre de 2026.
Las imágenes solo se usan en metadatos Open Graph/Twitter; no cambian la composición visible ni las funcionalidades de las páginas.

| Página | Portada |
| --- | --- |
| `/` | `home-2026-10.jpg` |
| `/privacidad` | `privacidad-2026-10.jpg` |
| `/diagnostico-digital` | `diagnostico-digital-2026-10.jpg` |
| `/diagnostico` | `diagnostico-inicial-2026-10.jpg` |
| `/auditoria-web` | `chequeo-web-2026-10.jpg` |
| `/herramientas/product-lock` | `product-lock-2026-10.jpg` |
| `/web-profesional` | `web-profesional-2026-10.jpg` |
| `/tiendanube` | `tiendanube-2026-10.jpg` |
| `/mercado-libre` | `mercado-libre-2026-10.jpg` |
| `/soluciones` | `soluciones-2026-10.jpg` |
| `/recursos` | `recursos-2026-10.jpg` |

Los demás documentos públicos usan la portada general. Los originales anteriores se conservan para no romper enlaces existentes. `design-system.html` es documentación interna y queda fuera de este cambio.

## Exportación

- Carpeta pública: `/assets/social/`.
- JPEG, 1200 × 630 px, calidad 92, submuestreo 4:4:4 para mantener texto claro.
- Ajuste proporcional dentro del lienzo, sin recorte ni deformación; margen PAPER cuando haga falta.
- URL absoluta por portada, dimensiones, MIME y texto alternativo en Open Graph; imagen y alternativa correspondientes en Twitter Card.
- Archivos con nombres nuevos para evitar reutilizar la URL de la imagen anterior.
- No se agregaron APIs, dependencias del sitio, formularios ni cambios de tracking.

## Verificación reproducible

`node --test tests/social-previews.test.cjs` comprueba la asignación de las once portadas, etiquetas únicas, URLs absolutas, existencia de assets, encabezados JPEG con dimensiones reales y un máximo de 500 KB por imagen.

El cierre de publicación verifica el árbol exacto del commit y las páginas/archivos públicos mediante HTTP, sin enviar formularios ni generar leads. Las vistas ya compartidas pueden conservar una imagen cacheada en WhatsApp u otras plataformas; su actualización no queda bajo el control de la web.
