# Watermark Studio

Language: **English** | [中文](README.zh-CN.md)

A pure frontend, locally running image watermarking tool for batch-applying PNG watermarks and text watermarks to photography work. All image processing happens in the browser. No backend service is required, and your images are not uploaded.

## Online Demo

[Open Watermark Studio](https://max-lu-4416.github.io/Watermark-Studio/)

You can also copy this URL into your browser:

```text
https://max-lu-4416.github.io/Watermark-Studio/
```

## Features

- Batch import JPG, PNG, and WEBP images.
- Progressive import preview: when importing many high-resolution images, each image appears as soon as it finishes processing.
- Compressed preview images and thumbnails reduce lag when working with large photos.
- The left photo list uses 1:1 square thumbnails with scrollable browsing.
- Thumbnail selection supports single select, multi-select, Shift range select, select all, clear selection, and batch delete.
- Automatically loads the default PNG watermark, with support for uploading a custom transparent PNG watermark.
- Text watermark support with text content, color, font family, font weight, italic style, and shadow / outline effects.
- PNG watermark and text watermark can be displayed together.
- Supports four watermark arrangements: PNG + text horizontal, PNG + text vertical, PNG only, and text only.
- Adjustable watermark size, opacity, percentage margin, invert mode, and nine-point anchor position.
- Graphical nine-point position picker.
- Canvas preview and export share the same rendering logic, so output matches the preview.
- Export the current image or all images.
- Export as JPG, PNG, or WEBP.
- Configure JPG / WEBP quality, long-edge resolution, filename prefix, filename suffix, and color space.
- Export as separate files or as a ZIP package.
- Batch export shows progress such as `Exporting 3/25`; failures include the specific image name.
- Browsers that support the File System Access API can choose a save location; other browsers fall back to normal downloads.
- Dark and light themes, with the theme toggle beside the title.

## How To Use

1. Open the online demo or local `index.html`.
2. In the left "Photo List" area, click `+` and select one or more images.
3. In "Watermark Content", use the default PNG watermark or upload your own transparent PNG watermark.
4. For text watermarking, enter text and configure color, font, weight, italic style, and text effect.
5. In "Watermark Style", adjust size, opacity, margin, invert mode, and PNG / text arrangement.
6. In "Anchor Position", choose where the watermark should appear.
7. In "Export", configure format, quality, long-edge resolution, naming rules, color space, export scope, and delivery mode.
8. Click the export button to download the processed image or ZIP package.

## Default Watermark

Default watermark path:

```text
assets/watermarks/watermark.png
```

A transparent PNG is recommended, such as a signature, photography logo, or brand watermark. If the default watermark is missing, the page will ask you to upload a PNG watermark. You can also export with text watermark only.

## Run Locally

### Open Directly

After downloading the project, open:

```text
index.html
```

### Use A Local Server

From the project directory, run:

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
- `styles.css`: Dark / light themes, layout, thumbnails, forms, buttons, and focus styles.
- `js/state.js`: Manages photos, watermarks, text watermark settings, selection state, and export settings.
- `js/ui.js`: Handles importing, thumbnails, multi-select, control binding, export progress, and UI refreshes.
- `js/canvas-renderer.js`: Handles preview rendering, watermark layout, and PNG / text composition.
- `js/watermark-image.js`: Loads the default watermark and handles custom PNG watermark uploads.
- `js/export.js`: Handles original image loading, export sizing, file naming, saving, and ZIP packaging.
- `tests/watermark-layout.test.js`: Verifies that nine-point watermark layout and extreme settings do not overflow the canvas.

## Development Checks

Run these basic checks:

```bash
node --check js/state.js
node --check js/ui.js
node --check js/canvas-renderer.js
node --check js/export.js
node tests/watermark-layout.test.js
```

The layout test covers all 9 watermark positions, landscape / portrait canvases, extreme size values, and margin settings.

## Privacy

Watermark Studio has no server-side upload flow. Imported images are processed locally in your browser and are not uploaded to GitHub or any other server.
