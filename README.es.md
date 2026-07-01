# Watermark Studio

Idiomas: [English](README.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | **Español** | [Français](README.fr.md) | [Deutsch](README.de.md)

Watermark Studio es una herramienta de marca de agua para imágenes que funciona localmente y solo con frontend. Permite aplicar marcas de agua PNG y de texto por lotes a fotografías. Todo el procesamiento ocurre en el navegador; no necesita backend y tus imágenes no se suben.

## Demo en línea

[Abrir Watermark Studio](https://max-lu-4416.github.io/Watermark-Studio/)

```text
https://max-lu-4416.github.io/Watermark-Studio/
```

## Funciones

- Importación por lotes de imágenes JPG, PNG y WEBP.
- Vista progresiva al importar imágenes de alta resolución: cada imagen aparece cuando termina de procesarse.
- Imágenes de vista previa y miniaturas comprimidas para reducir la lentitud con fotos grandes.
- Miniaturas cuadradas 1:1 con desplazamiento, selección múltiple, selección por rango con Shift, seleccionar todo, cancelar selección y eliminación por lotes.
- Carga de marca de agua PNG predeterminada y subida de PNG transparente personalizado.
- Marca de agua de texto con color, fuente, peso, cursiva y efectos de sombra / contorno.
- Combinación de marca de agua PNG y texto.
- Cuatro disposiciones: horizontal, vertical, solo PNG y solo texto.
- Ajuste de tamaño, opacidad, margen porcentual, inversión y posición de anclaje en nueve puntos.
- Selector gráfico de posición en nueve puntos.
- La vista previa y la exportación comparten la misma lógica de renderizado Canvas.
- Exporta la imagen actual o todas las imágenes en JPG, PNG o WEBP.
- Configura calidad, resolución del lado largo, prefijo / sufijo de archivo y espacio de color.
- Exporta como archivos separados o paquete ZIP.
- Progreso de exportación por lotes y mensajes de error con el nombre de la imagen afectada.
- Temas claro y oscuro.

## Uso

1. Abre la demo en línea o el archivo local `index.html`.
2. Haz clic en `+` en la lista de fotos de la izquierda y selecciona una o más imágenes.
3. Usa la marca de agua PNG predeterminada o sube tu propio PNG transparente.
4. Opcional: introduce una marca de agua de texto y configura su estilo.
5. Ajusta tamaño, opacidad, margen, inversión, disposición y posición de anclaje.
6. Configura formato, calidad, resolución del lado largo, nombres, espacio de color, alcance y modo de entrega.
7. Haz clic en exportar para descargar la imagen procesada o el ZIP.

## Marca de agua predeterminada

```text
assets/watermarks/watermark.png
```

Se recomienda usar un PNG con fondo transparente, como una firma, un logo de fotografía o una marca de marca. Si falta la marca predeterminada, la página pedirá subir un PNG. También puedes exportar solo con texto.

## Ejecutar localmente

Puedes abrir `index.html` directamente o iniciar un servidor local:

```bash
python -m http.server 8080
```

Luego abre:

```text
http://localhost:8080
```

## Estructura del proyecto

```text
Watermark-Studio/
|-- index.html
|-- styles.css
|-- README.md
|-- README.zh-CN.md
|-- README.zh-TW.md
|-- README.ja.md
|-- README.ko.md
|-- README.es.md
|-- README.fr.md
|-- README.de.md
|-- assets/
|   `-- watermarks/
|       `-- watermark.png
|-- js/
|   |-- main.js
|   |-- state.js
|   |-- ui.js
|   |-- canvas-renderer.js
|   |-- watermark-image.js
|   `-- export.js
`-- tests/
    `-- watermark-layout.test.js
```

## Archivos principales

- `index.html`: Estructura de la página y controles de formulario.
- `styles.css`: Temas, diseño, miniaturas, formularios, botones y estilos de foco.
- `js/state.js`: Fotos, marcas de agua, texto, selección y ajustes de exportación.
- `js/ui.js`: Importación, miniaturas, selección múltiple, controles, progreso y actualización de la interfaz.
- `js/canvas-renderer.js`: Renderizado de vista previa, diseño de marca de agua y composición PNG / texto.
- `js/watermark-image.js`: Carga de marca predeterminada y subida de PNG personalizado.
- `js/export.js`: Carga de originales, tamaño de exportación, nombres, guardado y ZIP.
- `tests/watermark-layout.test.js`: Pruebas de posiciones de nueve puntos y valores extremos.

## Comprobaciones de desarrollo

```bash
node --check js/state.js
node --check js/ui.js
node --check js/canvas-renderer.js
node --check js/export.js
node tests/watermark-layout.test.js
```

## Privacidad

Watermark Studio no tiene flujo de subida en servidor. Las imágenes importadas se procesan localmente en tu navegador y no se suben a GitHub ni a ningún otro servidor.
