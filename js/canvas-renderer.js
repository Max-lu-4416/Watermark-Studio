(function () {
  const { state } = window.WatermarkStudio.stateModule;
  const previewPadding = 28;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function getWatermarkLayout(imageWidth, imageHeight, watermarkImage, settings) {
    const rawWidth = imageWidth * (settings.sizePercent / 100);
    const rawHeight = rawWidth * (watermarkImage.naturalHeight / watermarkImage.naturalWidth);
    const minSide = Math.min(imageWidth, imageHeight);
    const margin = clamp(Number(settings.margin) || 0, 0, Math.floor(minSide / 3));
    const maxWidth = Math.max(1, imageWidth - margin * 2);
    const maxHeight = Math.max(1, imageHeight - margin * 2);
    const scale = Math.min(1, maxWidth / Math.max(1, rawWidth), maxHeight / Math.max(1, rawHeight));
    const watermarkWidth = Math.max(1, rawWidth * scale);
    const watermarkHeight = Math.max(1, rawHeight * scale);
    const centerX = (imageWidth - watermarkWidth) / 2;
    const centerY = (imageHeight - watermarkHeight) / 2;

    const layouts = {
      "top-left": { x: margin, y: margin },
      "top-center": { x: centerX, y: margin },
      "top-right": { x: imageWidth - watermarkWidth - margin, y: margin },
      "middle-left": { x: margin, y: centerY },
      center: { x: centerX, y: centerY },
      "middle-right": { x: imageWidth - watermarkWidth - margin, y: centerY },
      "bottom-left": { x: margin, y: imageHeight - watermarkHeight - margin },
      "bottom-center": { x: centerX, y: imageHeight - watermarkHeight - margin },
      "bottom-right": { x: imageWidth - watermarkWidth - margin, y: imageHeight - watermarkHeight - margin }
    };

    const point = layouts[settings.position] || layouts["bottom-center"];

    return {
      x: clamp(point.x, 0, Math.max(0, imageWidth - watermarkWidth)),
      y: clamp(point.y, 0, Math.max(0, imageHeight - watermarkHeight)),
      width: watermarkWidth,
      height: watermarkHeight
    };
  }

  function drawWatermark(ctx, watermarkImage, settings, width, height) {
    if (!watermarkImage || settings.sizePercent <= 0 || settings.opacity <= 0) {
      return;
    }

    const layout = getWatermarkLayout(width, height, watermarkImage, settings);
    ctx.save();
    ctx.globalAlpha = settings.opacity;
    ctx.filter = settings.invertWatermark ? "invert(1)" : "none";
    ctx.drawImage(watermarkImage, layout.x, layout.y, layout.width, layout.height);
    ctx.restore();
  }

  function drawComposite(ctx, image, watermarkImage, settings, width, height) {
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0, width, height);
    drawWatermark(ctx, watermarkImage, settings, width, height);
  }

  function resizePreviewCanvas(canvas, container, imageWidth, imageHeight) {
    const rect = container.getBoundingClientRect();
    const maxWidth = Math.max(1, rect.width - previewPadding * 2);
    const maxHeight = Math.max(1, rect.height - previewPadding * 2);
    const scale = Math.min(maxWidth / imageWidth, maxHeight / imageHeight, 1);
    const cssWidth = Math.max(1, Math.round(imageWidth * scale));
    const cssHeight = Math.max(1, Math.round(imageHeight * scale));
    const pixelRatio = window.devicePixelRatio || 1;

    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;
    canvas.width = Math.round(cssWidth * pixelRatio);
    canvas.height = Math.round(cssHeight * pixelRatio);

    const ctx = canvas.getContext("2d");
    ctx.setTransform(pixelRatio * scale, 0, 0, pixelRatio * scale, 0, 0);
    return ctx;
  }

  function renderPreview(canvas, container) {
    const { photo, watermark, settings } = state;

    if (!photo.image) {
      const ctx = canvas.getContext("2d");
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.width = 1;
      canvas.height = 1;
      canvas.style.width = "1px";
      canvas.style.height = "1px";
      return;
    }

    const ctx = resizePreviewCanvas(canvas, container, photo.width, photo.height);
    drawComposite(ctx, photo.image, watermark.image, settings, photo.width, photo.height);
  }

  window.WatermarkStudio.canvasRenderer = {
    getWatermarkLayout,
    drawWatermark,
    drawComposite,
    resizePreviewCanvas,
    renderPreview
  };
})();
