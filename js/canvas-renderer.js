(function () {
  const { state } = window.WatermarkStudio.stateModule;
  const previewPadding = 28;
  const maxPreviewCanvasLongEdge = 4096;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function getWatermarkLayout(imageWidth, imageHeight, watermarkImage, settings) {
    const rawWidth = imageWidth * (settings.sizePercent / 100);
    const rawHeight = rawWidth * (watermarkImage.naturalHeight / watermarkImage.naturalWidth);
    const minSide = Math.min(imageWidth, imageHeight);
    const marginPercent = clamp(Number(settings.margin) || 0, 0, 33);
    const margin = Math.floor(minSide * (marginPercent / 100));
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

  function getTextFontFamily(fontFamily) {
    const fonts = {
      system: 'Inter, "Segoe UI", "Microsoft YaHei", Arial, sans-serif',
      serif: '"Times New Roman", "Songti SC", SimSun, serif',
      sans: '"Microsoft YaHei", "Segoe UI", Arial, sans-serif',
      mono: '"Cascadia Mono", Consolas, "Courier New", monospace'
    };

    return fonts[fontFamily] || fonts.system;
  }

  function getActiveTextWatermark(textWatermark) {
    if (!textWatermark || !textWatermark.enabled) {
      return null;
    }

    const lines = String(textWatermark.text || "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      return null;
    }

    return {
      lines,
      color: textWatermark.color || "#ffffff",
      fontFamily: getTextFontFamily(textWatermark.fontFamily),
      fontWeight: textWatermark.fontWeight || "700",
      italic: Boolean(textWatermark.italic),
      effect: textWatermark.effect || "shadow"
    };
  }

  function getTextFont(text) {
    return `${text.italic ? "italic " : ""}${text.fontWeight} ${text.fontSize}px ${text.fontFamily}`;
  }

  function getBoxLayout(canvasWidth, canvasHeight, boxWidth, boxHeight, settings) {
    const minSide = Math.min(canvasWidth, canvasHeight);
    const marginPercent = clamp(Number(settings.margin) || 0, 0, 33);
    const margin = Math.floor(minSide * (marginPercent / 100));
    const centerX = (canvasWidth - boxWidth) / 2;
    const centerY = (canvasHeight - boxHeight) / 2;
    const layouts = {
      "top-left": { x: margin, y: margin },
      "top-center": { x: centerX, y: margin },
      "top-right": { x: canvasWidth - boxWidth - margin, y: margin },
      "middle-left": { x: margin, y: centerY },
      center: { x: centerX, y: centerY },
      "middle-right": { x: canvasWidth - boxWidth - margin, y: centerY },
      "bottom-left": { x: margin, y: canvasHeight - boxHeight - margin },
      "bottom-center": { x: centerX, y: canvasHeight - boxHeight - margin },
      "bottom-right": { x: canvasWidth - boxWidth - margin, y: canvasHeight - boxHeight - margin }
    };
    const point = layouts[settings.position] || layouts["bottom-center"];

    return {
      x: clamp(point.x, 0, Math.max(0, canvasWidth - boxWidth)),
      y: clamp(point.y, 0, Math.max(0, canvasHeight - boxHeight))
    };
  }

  function getWatermarkGroupLayout(ctx, imageWidth, imageHeight, watermarkImage, textWatermark, settings) {
    const layoutMode = settings.watermarkLayout || "horizontal";
    const activeText = layoutMode === "image-only" ? null : getActiveTextWatermark(textWatermark);
    const hasImage = Boolean(watermarkImage) && layoutMode !== "text-only";

    if ((!hasImage && !activeText) || settings.opacity <= 0) {
      return null;
    }

    if (hasImage && !activeText && settings.sizePercent <= 0) {
      return null;
    }

    const minSide = Math.min(imageWidth, imageHeight);
    const marginPercent = clamp(Number(settings.margin) || 0, 0, 33);
    const margin = Math.floor(minSide * (marginPercent / 100));
    const maxWidth = Math.max(1, imageWidth - margin * 2);
    const maxHeight = Math.max(1, imageHeight - margin * 2);
    const imageRawWidth = hasImage ? imageWidth * (settings.sizePercent / 100) : 0;
    const imageRawHeight = hasImage
      ? imageRawWidth * (watermarkImage.naturalHeight / watermarkImage.naturalWidth)
      : 0;
    let textWidth = 0;
    let textHeight = 0;
    let fontSize = 0;
    let lineHeight = 0;

    if (activeText) {
      fontSize = clamp(minSide * (settings.sizePercent / 100) * 0.22, 8, minSide * 0.18);
      lineHeight = fontSize * 1.22;
      activeText.fontSize = fontSize;
      ctx.save();
      ctx.font = getTextFont(activeText);
      textWidth = Math.max(1, ...activeText.lines.map((line) => ctx.measureText(line).width));
      textHeight = Math.max(fontSize, activeText.lines.length * lineHeight);
      ctx.restore();
    }

    const gap = hasImage && activeText ? Math.max(8, minSide * 0.012) : 0;
    const isVertical = layoutMode === "vertical";
    const rawWidth = isVertical
      ? Math.max(imageRawWidth, textWidth)
      : imageRawWidth + gap + textWidth;
    const rawHeight = isVertical
      ? imageRawHeight + gap + textHeight
      : Math.max(imageRawHeight, textHeight);
    const scale = Math.min(1, maxWidth / Math.max(1, rawWidth), maxHeight / Math.max(1, rawHeight));
    const width = Math.max(1, rawWidth * scale);
    const height = Math.max(1, rawHeight * scale);
    const origin = getBoxLayout(imageWidth, imageHeight, width, height, settings);
    const scaledImageWidth = imageRawWidth * scale;
    const scaledImageHeight = imageRawHeight * scale;
    const scaledTextWidth = textWidth * scale;
    const scaledTextHeight = textHeight * scale;
    const scaledGap = gap * scale;

    const imageLayout = hasImage ? {
      x: isVertical ? origin.x + (width - scaledImageWidth) / 2 : origin.x,
      y: isVertical ? origin.y : origin.y + (height - scaledImageHeight) / 2,
      width: scaledImageWidth,
      height: scaledImageHeight
    } : null;

    const textLayout = activeText ? {
      lines: activeText.lines,
      color: activeText.color,
      fontFamily: activeText.fontFamily,
      fontSize: fontSize * scale,
      fontWeight: activeText.fontWeight,
      italic: activeText.italic,
      effect: activeText.effect,
      lineHeight: lineHeight * scale,
      x: isVertical || !hasImage
        ? origin.x + width / 2
        : origin.x + scaledImageWidth + scaledGap,
      y: isVertical
        ? origin.y + (hasImage ? scaledImageHeight + scaledGap : 0) + (scaledTextHeight - lineHeight * scale * activeText.lines.length) / 2
        : origin.y + (height - scaledTextHeight) / 2,
      align: isVertical || !hasImage ? "center" : "left",
      width: scaledTextWidth,
      height: scaledTextHeight
    } : null;

    return {
      x: origin.x,
      y: origin.y,
      width,
      height,
      scale,
      image: imageLayout,
      text: textLayout
    };
  }

  function drawWatermark(ctx, watermarkImage, settings, width, height, textWatermark = null) {
    const layout = getWatermarkGroupLayout(ctx, width, height, watermarkImage, textWatermark, settings);

    if (!layout) {
      return;
    }

    ctx.save();
    ctx.globalAlpha = settings.opacity;

    if (layout.image) {
      ctx.save();
      ctx.filter = settings.invertWatermark ? "invert(1)" : "none";
      ctx.drawImage(watermarkImage, layout.image.x, layout.image.y, layout.image.width, layout.image.height);
      ctx.restore();
    }

    if (layout.text) {
      ctx.filter = "none";
      ctx.fillStyle = layout.text.color;
      ctx.font = `${layout.text.italic ? "italic " : ""}${layout.text.fontWeight} ${layout.text.fontSize}px ${layout.text.fontFamily}`;
      ctx.textAlign = layout.text.align;
      ctx.textBaseline = "middle";

      if (layout.text.effect === "shadow") {
        ctx.shadowColor = "rgba(0, 0, 0, 0.52)";
        ctx.shadowBlur = Math.max(2, layout.text.fontSize * 0.1);
        ctx.shadowOffsetY = Math.max(1, layout.text.fontSize * 0.035);
      } else {
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
      }

      if (layout.text.effect === "outline") {
        ctx.strokeStyle = "rgba(0, 0, 0, 0.62)";
        ctx.lineWidth = Math.max(2, layout.text.fontSize * 0.08);
        ctx.lineJoin = "round";
      }

      layout.text.lines.forEach((line, index) => {
        const y = layout.text.y + layout.text.lineHeight * index + layout.text.lineHeight / 2;

        if (layout.text.effect === "outline") {
          ctx.strokeText(line, layout.text.x, y);
        }

        ctx.fillText(line, layout.text.x, y);
      });
    }

    ctx.restore();
  }

  function drawComposite(ctx, image, watermarkImage, settings, width, height, textWatermark = null) {
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0, width, height);
    drawWatermark(ctx, watermarkImage, settings, width, height, textWatermark);
  }

  function resizePreviewCanvas(canvas, container, imageWidth, imageHeight) {
    const rect = container.getBoundingClientRect();
    const maxWidth = Math.max(1, rect.width - previewPadding * 2);
    const maxHeight = Math.max(1, rect.height - previewPadding * 2);
    const scale = Math.min(maxWidth / imageWidth, maxHeight / imageHeight, 1);
    const cssWidth = Math.max(1, Math.round(imageWidth * scale));
    const cssHeight = Math.max(1, Math.round(imageHeight * scale));
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const pixelScale = Math.min(
      pixelRatio * scale,
      maxPreviewCanvasLongEdge / Math.max(imageWidth, imageHeight)
    );

    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;
    const canvasWidth = Math.max(1, Math.round(imageWidth * pixelScale));
    const canvasHeight = Math.max(1, Math.round(imageHeight * pixelScale));

    if (canvas.width !== canvasWidth) {
      canvas.width = canvasWidth;
    }

    if (canvas.height !== canvasHeight) {
      canvas.height = canvasHeight;
    }

    const ctx = canvas.getContext("2d");
    ctx.setTransform(pixelScale, 0, 0, pixelScale, 0, 0);
    return ctx;
  }

  function renderPreview(canvas, container) {
    const { photo, watermark, settings, textWatermark } = state;

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
    drawComposite(ctx, photo.image, watermark.image, settings, photo.width, photo.height, textWatermark);
  }

  window.WatermarkStudio.canvasRenderer = {
    getWatermarkLayout,
    getWatermarkGroupLayout,
    drawWatermark,
    drawComposite,
    resizePreviewCanvas,
    renderPreview
  };
})();
