# Watermark Studio

[简体中文](README.zh-CN.md) | **English**

A local-first image watermarking tool for batch adding PNG and text watermarks. All image processing runs in the browser; images are not uploaded to a server.

Online demo: https://max-lu-4416.github.io/Watermark-Studio/

## Features

- Batch import JPG, PNG, and WEBP images.
- Fast progressive import: the first images appear immediately, then larger batches continue in parallel.
- PNG watermark, text watermark, or both together.
- Watermark layout: horizontal, vertical, image only, or text only.
- Adjustable size, opacity, margin, invert mode, and nine-point position.
- Dark / light theme with animated switching and matching app icons.
- Export all images as JPG, PNG, or WEBP.
- Export options include naming prefix / suffix, quality, color space, file size limit, resize, metadata, and output sharpening.
- ZIP export for batch downloads.

## Use

1. Open the app.
2. Click `+` to import images.
3. Upload a PNG watermark or enter text.
4. Adjust position and style.
5. Click `Export` and choose export settings.

## Local Run

Open `index.html` directly, or run a local server:

```bash
python -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

## Main Files

- `index.html` - app structure.
- `styles.css` - layout, themes, and UI styles.
- `js/ui.js` - import, controls, theme, and export dialog.
- `js/canvas-renderer.js` - preview and watermark rendering.
- `js/export.js` - export, metadata, resizing, sharpening, and ZIP output.

## Privacy

Watermark Studio processes images locally in your browser. Imported images are not uploaded.
