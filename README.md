# Watermark Studio

Languages: **English** | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md)

A pure frontend, locally running image watermarking tool for batch-applying PNG watermarks and text watermarks to photography work. All image processing happens in the browser. No backend service is required, and your images are not uploaded.

## Online Demo

[Open Watermark Studio](https://max-lu-4416.github.io/Watermark-Studio/)

```text
https://max-lu-4416.github.io/Watermark-Studio/
```

## Features

- Batch import JPG, PNG, and WEBP images.
- Progressive import preview: each high-resolution image appears as soon as it finishes processing.
- Compressed preview images and thumbnails reduce lag when working with large photos.
- 1:1 square thumbnails with scrolling, multi-select, Shift range select, select all, clear selection, and batch delete.
- Default PNG watermark loading and custom transparent PNG watermark uploads.
- Text watermark support with color, font family, font weight, italic style, and shadow / outline effects.
- PNG watermark and text watermark can be combined.
- Four watermark arrangements: horizontal, vertical, PNG only, and text only.
- Adjustable watermark size, opacity, percentage margin, invert mode, and nine-point anchor position.
- Graphical nine-point position picker.
- Canvas preview and export share the same rendering logic.
- Export current image or all images as JPG, PNG, or WEBP.
- Configure quality, long-edge resolution, filename prefix / suffix, and color space.
- Export as separate files or a ZIP package.
- Batch export progress and specific failure messages.
- File System Access API support where available; otherwise falls back to browser downloads.
- Dark and light themes.

## How To Use

1. Open the online demo or local `index.html`.
2. Click `+` in the left photo list and select one or more images.
3. Use the default PNG watermark or upload a transparent PNG watermark.
4. Optional: enter a text watermark and configure its style.
5. Adjust size, opacity, margin, invert mode, arrangement, and anchor position.
6. Configure export format, quality, long-edge resolution, naming, color space, scope, and delivery mode.
7. Click the export button to download the processed image or ZIP package.

## Default Watermark

```text
assets/watermarks/watermark.png
```

A transparent PNG is recommended, such as a signature, photography logo, or brand watermark. If the default watermark is missing, the page will ask you to upload a PNG watermark. You can also export with text watermark only.

## Run Locally

Open `index.html` directly, or run a local server:

```bash
python -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

## Project Structure

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

## Key Files

- `index.html`: Page structure and form controls.
- `styles.css`: Themes, layout, thumbnails, forms, buttons, and focus styles.
- `js/state.js`: Photos, watermarks, text watermark settings, selection state, and export settings.
- `js/ui.js`: Importing, thumbnails, multi-select, control binding, export progress, and UI refreshes.
- `js/canvas-renderer.js`: Preview rendering, watermark layout, and PNG / text composition.
- `js/watermark-image.js`: Default watermark loading and custom PNG watermark uploads.
- `js/export.js`: Original image loading, export sizing, file naming, saving, and ZIP packaging.
- `tests/watermark-layout.test.js`: Layout tests for nine-point positions and extreme settings.

## Development Checks

```bash
node --check js/state.js
node --check js/ui.js
node --check js/canvas-renderer.js
node --check js/export.js
node tests/watermark-layout.test.js
```

## Privacy

Watermark Studio has no server-side upload flow. Imported images are processed locally in your browser and are not uploaded to GitHub or any other server.
