(function () {
  const {
    appendPhotos,
    clearPhotoSelection,
    deleteSelectedPhotos,
    selectPhotoRange,
    selectAllPhotos,
    selectSinglePhoto,
    state,
    togglePhotoSelection,
    updateTextWatermark,
    updateWatermarkSettings
  } = window.WatermarkStudio.stateModule;
  const { renderPreview } = window.WatermarkStudio.canvasRenderer;
  const { exportWatermarkedJpg } = window.WatermarkStudio.exporter;
  const {
    loadUploadedWatermark,
    loadImageFromUrl
  } = window.WatermarkStudio.watermarkImage;

  const elements = {};
  let renderQueued = false;
  let exporting = false;
  let fallbackDownloadUrls = [];
  const PREVIEW_MAX_LONG_EDGE = 2200;
  const THUMBNAIL_MAX_LONG_EDGE = 260;
  const PREVIEW_JPEG_QUALITY = 0.86;
  const THUMBNAIL_JPEG_QUALITY = 0.78;
  const INITIAL_IMPORT_VISIBLE_COUNT = 4;
  const IMPORT_RENDER_BATCH_SIZE = 4;

  function $(selector) {
    return document.querySelector(selector);
  }

  function setMessage(text, type = "") {
    clearFallbackDownloadUrls();
    elements.messageBar.textContent = text;
    elements.messageBar.className = `message-bar ${type || (text ? "info" : "")}`.trim();
  }

  function clearFallbackDownloadUrls() {
    fallbackDownloadUrls.forEach((item) => {
      window.clearTimeout(item.timeoutId);
      URL.revokeObjectURL(item.url);
    });
    fallbackDownloadUrls = [];
  }

  function revokeFallbackDownloadUrl(url, link) {
    const item = fallbackDownloadUrls.find((entry) => entry.url === url);

    if (!item) {
      return;
    }

    window.clearTimeout(item.timeoutId);
    URL.revokeObjectURL(url);
    fallbackDownloadUrls = fallbackDownloadUrls.filter((entry) => entry.url !== url);

    if (link) {
      link.removeAttribute("href");
      link.removeAttribute("download");
      link.textContent = "链接已释放";
      link.setAttribute("aria-disabled", "true");
    }
  }

  function setDownloadMessage(result) {
    clearFallbackDownloadUrls();
    elements.messageBar.innerHTML = "";
    elements.messageBar.className = "message-bar success";

    const formatLabel = result.formatLabel || getOutputFormatLabel(state.settings.outputFormat);
    const text = document.createElement("span");
    text.textContent = result.downloads[0]?.type === "application/zip"
      ? `已生成 ${result.count} 张 ${formatLabel}，并打包为 ZIP。`
      : `已生成 ${result.count} 张 ${formatLabel} 导出文件。`;
    elements.messageBar.appendChild(text);

    const links = document.createElement("span");
    links.className = "download-links";

    result.downloads.forEach((item, index) => {
      if (!item.url) {
        return;
      }

      const link = document.createElement("a");
      link.href = item.url;
      link.download = item.name;
      link.textContent = item.type === "application/zip"
        ? "下载 ZIP"
        : result.downloads.length === 1 ? "手动下载" : `下载${index + 1}`;
      link.addEventListener("click", () => {
        window.setTimeout(() => revokeFallbackDownloadUrl(item.url, link), 1500);
      });
      links.appendChild(link);

      fallbackDownloadUrls.push({
        url: item.url,
        timeoutId: window.setTimeout(() => revokeFallbackDownloadUrl(item.url, link), 10 * 60 * 1000)
      });
    });

    elements.messageBar.appendChild(links);

    if (result.warnings && result.warnings.length > 0) {
      const warnings = document.createElement("span");
      warnings.className = "export-warnings";
      warnings.textContent = result.warnings.join("；");
      elements.messageBar.appendChild(warnings);
    }
  }

  function updateWatermarkStatus() {
    elements.watermarkStatus.textContent = state.watermark.message;
    elements.watermarkStatus.className = `notice ${state.watermark.status === "ready" ? "success" : "error"}`;
  }

  function updateThemeDom(theme) {
    const nextTheme = theme === "light" ? "light" : "dark";
    document.body.dataset.theme = nextTheme;
    elements.themeToggle.checked = nextTheme === "light";
    if (elements.faviconLink) {
      elements.faviconLink.href = nextTheme === "light"
        ? "assets/icons/theme-light.png"
        : "assets/icons/theme-dark.png";
    }
    localStorage.setItem("watermarkStudioTheme", nextTheme);
  }

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function getThemeRevealGeometry(sourceElement) {
    const rect = sourceElement && sourceElement.getBoundingClientRect
      ? sourceElement.getBoundingClientRect()
      : null;
    const x = rect ? rect.left + rect.width / 2 : window.innerWidth - 32;
    const y = rect ? rect.top + rect.height / 2 : 32;
    const endRadius = Math.ceil(Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    )) + 80;

    return { x, y, endRadius };
  }

  function setThemeTransitionGeometry(geometry) {
    document.documentElement.style.setProperty("--theme-transition-x", `${geometry.x}px`);
    document.documentElement.style.setProperty("--theme-transition-y", `${geometry.y}px`);
    document.documentElement.style.setProperty("--theme-transition-radius", `${geometry.endRadius}px`);
  }

  function clearThemeTransitionState() {
    document.documentElement.classList.remove("theme-transitioning");
    document.body.classList.remove("theme-transitioning", "theme-fallback-transition");
    document.documentElement.style.removeProperty("--theme-transition-x");
    document.documentElement.style.removeProperty("--theme-transition-y");
    document.documentElement.style.removeProperty("--theme-transition-radius");
  }

  function applyTheme(theme, options = {}) {
    const nextTheme = theme === "light" ? "light" : "dark";

    if (!options.animate || prefersReducedMotion()) {
      clearThemeTransitionState();
      updateThemeDom(nextTheme);
      return;
    }

    if (typeof document.startViewTransition !== "function") {
      document.body.classList.add("theme-fallback-transition");
      updateThemeDom(nextTheme);
      window.setTimeout(clearThemeTransitionState, 460);
      return;
    }

    setThemeTransitionGeometry(getThemeRevealGeometry(options.sourceElement || elements.themeToggle));
    document.documentElement.classList.add("theme-transitioning");
    document.body.classList.add("theme-transitioning");

    try {
      const transition = document.startViewTransition(() => {
        updateThemeDom(nextTheme);
      });

      transition.finished.then(clearThemeTransitionState, clearThemeTransitionState);
    } catch (error) {
      updateThemeDom(nextTheme);
      clearThemeTransitionState();
    }
  }

  function getOutputFormatLabel(format) {
    const labels = {
      jpeg: "JPG",
      png: "PNG",
      webp: "WEBP"
    };

    return labels[format] || labels.jpeg;
  }

  function getOutputSizeLabel() {
    const { photo, settings } = state;
    const targetWidth = Math.max(1, Number(settings.resizeWidth) || 3000);
    const targetHeight = Math.max(1, Number(settings.resizeHeight) || 3000);

    if (!photo.width || !photo.height) {
      return `${targetWidth} x ${targetHeight}`;
    }

    const scale = Math.min(targetWidth / photo.width, targetHeight / photo.height);
    return `${Math.max(1, Math.round(photo.width * scale))} x ${Math.max(1, Math.round(photo.height * scale))}`;
  }

  function getFilenamePreview() {
    const photoName = state.photo.name || "original.jpg";
    const lastDot = photoName.lastIndexOf(".");
    const baseName = lastDot > 0 ? photoName.slice(0, lastDot) : photoName;
    const extension = getOutputFormatLabel(state.settings.outputFormat).toLowerCase().replace("jpg", "jpg");
    const safeName = `${state.settings.filenamePrefix || ""}${baseName}${state.settings.filenameSuffix || ""}`
      .replace(/[\\/:*?"<>|]/g, "_")
      .trim() || "watermarked";

    return `${safeName}.${extension}`;
  }

  function updateExportButtonLabel() {
    elements.exportButton.textContent = "导出";
    if (elements.confirmExportButton) {
      elements.confirmExportButton.textContent = "导出";
    }
  }

  function updateControlValues() {
    elements.sizeValue.textContent = String(state.settings.sizePercent);
    elements.opacityValue.textContent = String(Math.round(state.settings.opacity * 100));
    elements.marginValue.textContent = `${state.settings.margin}%`;
    elements.qualityValue.textContent = String(Math.round(state.settings.exportQuality * 100));
    elements.outputSizeValue.textContent = getOutputSizeLabel();
    elements.filenamePrefixInput.value = state.settings.filenamePrefix;
    elements.filenameSuffixInput.value = state.settings.filenameSuffix;
    elements.filenamePreviewValue.textContent = getFilenamePreview();
    elements.formatSelect.value = state.settings.outputFormat;
    elements.colorSpaceSelect.value = state.settings.colorSpace;
    elements.targetFileSizeToggle.checked = state.settings.targetFileSizeEnabled;
    elements.targetFileSizeInput.value = String(state.settings.targetFileSizeKb);
    elements.targetFileSizeInput.disabled = !state.settings.targetFileSizeEnabled || state.settings.outputFormat === "png";
    elements.qualityRange.disabled = state.settings.outputFormat === "png";
    elements.qualityHint.textContent = state.settings.outputFormat === "png" ? "PNG 不适用品质" : "JPG / WEBP";
    elements.resizeWidthInput.value = String(state.settings.resizeWidth);
    elements.resizeHeightInput.value = String(state.settings.resizeHeight);
    elements.resizePercentInput.value = String(state.settings.resizePercent);
    elements.resizeAspectToggle.checked = state.settings.resizeAspectLocked;
    elements.metadataSelect.value = state.settings.metadataMode;
    elements.metadataFields.classList.toggle("hidden", state.settings.metadataMode === "none");
    elements.metadataAuthorInput.value = state.settings.metadataAuthor;
    elements.metadataCopyrightInput.value = state.settings.metadataCopyright;
    elements.metadataContactInput.value = state.settings.metadataContact;
    elements.outputSharpeningSelect.value = state.settings.outputSharpening;
    if (document.activeElement !== elements.textWatermarkInput) {
      elements.textWatermarkInput.value = state.textWatermark.text;
    }
    elements.textColorInput.value = state.textWatermark.color;
    elements.invertToggle.checked = state.settings.invertWatermark;
    elements.watermarkLayoutSelect.value = state.settings.watermarkLayout;
    updateExportButtonLabel();
  }

  function updateSelectionStatus() {
    const selectedCount = state.selectedPhotoIndices.length;
    const totalCount = state.photos.length;
    elements.selectionStatus.textContent = `已选 ${selectedCount} / 共 ${totalCount}`;
    elements.selectAllButton.disabled = totalCount === 0 || selectedCount === totalCount;
    elements.clearSelectionButton.disabled = selectedCount === 0;
  }

  function updateDeleteButton() {
    const selectedCount = state.selectedPhotoIndices.length;
    elements.deleteSelectedButton.classList.toggle("visible", selectedCount > 0);
    elements.deleteSelectedButton.textContent = selectedCount > 1 ? `删除选中 ${selectedCount}` : "删除选中";
    updateSelectionStatus();
  }

  function refreshPreview() {
    if (renderQueued) {
      return;
    }

    renderQueued = true;
    requestAnimationFrame(() => {
      renderQueued = false;
      updateControlValues();
      renderPreview(elements.previewCanvas, elements.canvasWrap);
      elements.emptyState.classList.toggle("hidden", Boolean(state.photo.image));
      updateDeleteButton();
    });
  }

  function createImportTile() {
    const label = document.createElement("label");
    label.className = "thumbnail-import";
    label.htmlFor = "photoInput";
    label.title = "导入图片";
    label.setAttribute("aria-label", "导入图片");

    const plus = document.createElement("span");
    plus.textContent = "+";
    label.appendChild(plus);
    return label;
  }

  function renderThumbnails() {
    elements.photoCount.textContent = `${state.photos.length} 张`;
    elements.thumbnailList.innerHTML = "";
    elements.thumbnailList.appendChild(createImportTile());

    state.photos.forEach((photo, index) => {
      const button = document.createElement("button");
      const isActive = index === state.selectedPhotoIndex;
      const isSelected = state.selectedPhotoIndices.includes(index);

      button.type = "button";
      button.className = `thumbnail-item ${isActive ? "active" : ""} ${isSelected ? "selected" : ""}`.trim();
      button.title = photo.name;
      button.setAttribute("aria-label", `预览 ${photo.name}`);

      const image = document.createElement("img");
      image.src = photo.thumbnailUrl || photo.previewUrl || photo.objectUrl;
      image.alt = "";

      button.appendChild(image);
      button.addEventListener("click", (event) => {
        if (event.shiftKey) {
          selectPhotoRange(index);
        } else if (event.ctrlKey || event.metaKey) {
          togglePhotoSelection(index);
        } else {
          selectSinglePhoto(index);
        }

        renderThumbnails();
        setMessage(`当前预览：${photo.name}`, "success");
        refreshPreview();
      });

      elements.thumbnailList.appendChild(button);
    });

    updateDeleteButton();
  }

  function waitForNextFrame() {
    return new Promise((resolve) => {
      requestAnimationFrame(resolve);
    });
  }

  function getScaledSize(width, height, maxLongEdge) {
    const longEdge = Math.max(width, height);
    const scale = Math.min(1, maxLongEdge / Math.max(1, longEdge));

    return {
      width: Math.max(1, Math.round(width * scale)),
      height: Math.max(1, Math.round(height * scale))
    };
  }

  function getImageWidth(image) {
    return image.naturalWidth || image.width || 1;
  }

  function getImageHeight(image) {
    return image.naturalHeight || image.height || 1;
  }

  async function loadSourcePhotoImage(file, objectUrl) {
    if (typeof createImageBitmap === "function") {
      try {
        return await createImageBitmap(file, { imageOrientation: "from-image" });
      } catch (error) {
        return loadImageFromUrl(objectUrl);
      }
    }

    return loadImageFromUrl(objectUrl);
  }

  async function loadPreviewImage(blob, url) {
    if (typeof createImageBitmap === "function") {
      try {
        return await createImageBitmap(blob);
      } catch (error) {
        return loadImageFromUrl(url);
      }
    }

    return loadImageFromUrl(url);
  }

  function releaseLoadedImage(image) {
    if (!image) {
      return;
    }

    if (typeof image.close === "function") {
      image.close();
      return;
    }

    if (typeof image.removeAttribute === "function") {
      image.removeAttribute("src");
    }
  }

  function createResizedImageBlob(sourceImage, size, quality) {
    const canvas = document.createElement("canvas");
    canvas.width = size.width;
    canvas.height = size.height;

    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size.width, size.height);
    ctx.drawImage(sourceImage, 0, 0, size.width, size.height);

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        canvas.width = 1;
        canvas.height = 1;

        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Preview image generation failed"));
        }
      }, "image/jpeg", quality);
    });
  }

  async function createResizedImageResult(sourceImage, size, quality) {
    const blob = await createResizedImageBlob(sourceImage, size, quality);

    return {
      blob,
      url: URL.createObjectURL(blob)
    };
  }

  async function createDerivedPhotoImages(sourceImage) {
    const width = getImageWidth(sourceImage);
    const height = getImageHeight(sourceImage);
    const previewSize = getScaledSize(width, height, PREVIEW_MAX_LONG_EDGE);
    const thumbnailSize = getScaledSize(width, height, THUMBNAIL_MAX_LONG_EDGE);
    const [preview, thumbnail] = await Promise.all([
      createResizedImageResult(sourceImage, previewSize, PREVIEW_JPEG_QUALITY),
      createResizedImageResult(sourceImage, thumbnailSize, THUMBNAIL_JPEG_QUALITY)
    ]);

    return {
      previewBlob: preview.blob,
      previewUrl: preview.url,
      thumbnailUrl: thumbnail.url
    };
  }

  async function loadPhotoFile(file) {
    const objectUrl = URL.createObjectURL(file);
    let previewUrl = "";
    let thumbnailUrl = "";
    let sourceImage = null;
    let image = null;

    try {
      sourceImage = await loadSourcePhotoImage(file, objectUrl);
      const derivedImages = await createDerivedPhotoImages(sourceImage);
      previewUrl = derivedImages.previewUrl;
      thumbnailUrl = derivedImages.thumbnailUrl;

      image = await loadPreviewImage(derivedImages.previewBlob, previewUrl);
      const width = getImageWidth(sourceImage);
      const height = getImageHeight(sourceImage);
      releaseLoadedImage(sourceImage);

      return {
        file,
        image,
        objectUrl,
        previewUrl,
        thumbnailUrl,
        name: file.name,
        width,
        height
      };
    } catch (error) {
      releaseLoadedImage(sourceImage);
      releaseLoadedImage(image);
      [objectUrl, previewUrl, thumbnailUrl].forEach((url) => {
        if (url) {
          URL.revokeObjectURL(url);
        }
      });
      throw error;
    }
  }

  function getImportConcurrency(fileCount) {
    const hardwareConcurrency = navigator.hardwareConcurrency || 4;
    const preferred = Math.max(2, Math.floor(hardwareConcurrency / 2));

    return Math.min(fileCount, 4, preferred);
  }

  function setImportSummaryMessage(importedCount, failedCount) {
    if (importedCount === 0) {
      setMessage("图片加载失败，请选择有效图片。", "error");
      return;
    }

    setMessage(
      failedCount > 0
        ? `已导入 ${importedCount} 张图片，${failedCount} 张加载失败或格式不支持。`
        : `已追加导入 ${importedCount} 张图片。`,
      failedCount > 0 ? "error" : "success"
    );
  }

  async function handlePhotoUploadOptimized(event) {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) {
      return;
    }

    const validFiles = files.filter((file) => ["image/jpeg", "image/png", "image/webp"].includes(file.type));
    const unsupportedCount = files.length - validFiles.length;

    if (validFiles.length === 0) {
      setMessage("请上传 JPG、PNG 或 WEBP 图片。", "error");
      event.target.value = "";
      return;
    }

    let importedCount = 0;
    let failedCount = unsupportedCount;
    let completedCount = 0;
    const visibleFiles = validFiles.slice(0, INITIAL_IMPORT_VISIBLE_COUNT);
    const remainingFiles = validFiles.slice(INITIAL_IMPORT_VISIBLE_COUNT);

    if (unsupportedCount > 0) {
      setMessage(`已跳过 ${unsupportedCount} 个不支持的文件，继续导入有效图片。`, "error");
      await waitForNextFrame();
    }

    for (let index = 0; index < visibleFiles.length; index += 1) {
      setMessage(`正在导入 ${completedCount}/${validFiles.length}`);
      await waitForNextFrame();

      try {
        const photo = await loadPhotoFile(visibleFiles[index]);
        importedCount += 1;
        appendPhotos([photo]);
        renderThumbnails();
        refreshPreview();
      } catch (error) {
        failedCount += 1;
      } finally {
        completedCount += 1;
        setMessage(`正在导入 ${completedCount}/${validFiles.length}`);
        await waitForNextFrame();
      }
    }

    if (remainingFiles.length > 0) {
      let nextFileIndex = 0;
      let nextAppendIndex = 0;
      let lastRenderCompletedCount = completedCount;
      const loadedPhotos = new Array(remainingFiles.length);
      const settledFiles = new Array(remainingFiles.length).fill(false);

      function flushImportedPhotos(force = false) {
        if (!force && completedCount - lastRenderCompletedCount < IMPORT_RENDER_BATCH_SIZE) {
          return;
        }

        const readyPhotos = [];

        while (settledFiles[nextAppendIndex]) {
          if (loadedPhotos[nextAppendIndex]) {
            readyPhotos.push(loadedPhotos[nextAppendIndex]);
            loadedPhotos[nextAppendIndex] = null;
          }

          nextAppendIndex += 1;
        }

        if (readyPhotos.length > 0) {
          appendPhotos(readyPhotos);
          renderThumbnails();
          refreshPreview();
        }

        lastRenderCompletedCount = completedCount;
      }

      async function importWorker() {
        while (nextFileIndex < remainingFiles.length) {
          const index = nextFileIndex;
          nextFileIndex += 1;

          try {
            loadedPhotos[index] = await loadPhotoFile(remainingFiles[index]);
            importedCount += 1;
          } catch (error) {
            failedCount += 1;
          } finally {
            settledFiles[index] = true;
            completedCount += 1;
            setMessage(`正在导入 ${completedCount}/${validFiles.length}`);
            flushImportedPhotos(false);
            await waitForNextFrame();
          }
        }
      }

      await Promise.all(Array.from({ length: getImportConcurrency(remainingFiles.length) }, importWorker));
      flushImportedPhotos(true);
    }

    if (importedCount > 0) {
      selectSinglePhoto(state.photos.length - 1);
      renderThumbnails();
      refreshPreview();
    }

    setImportSummaryMessage(importedCount, failedCount);
    event.target.value = "";
  }

  async function handleWatermarkUpload(event) {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    try {
      await loadUploadedWatermark(file);
      updateWatermarkStatus();
      setMessage("PNG 水印已更新。", "success");
      refreshPreview();
    } catch (error) {
      setMessage(error.message, "error");
      event.target.value = "";
    }
  }

  function bindRangeControl(input, key, transform) {
    input.addEventListener("input", () => {
      updateWatermarkSettings({ [key]: transform(input.value) });
      updateControlValues();
      refreshPreview();
    });
  }

  function bindRadioControls(name, key) {
    document.querySelectorAll(`input[name="${name}"]`).forEach((input) => {
      input.addEventListener("change", () => {
        if (input.checked) {
          updateWatermarkSettings({ [key]: input.value });
          updateControlValues();
          refreshPreview();
        }
      });
    });
  }

  function bindTextControl(input, key) {
    input.addEventListener("input", () => {
      updateWatermarkSettings({ [key]: input.value });
    });
  }

  function bindSelectControl(input, key) {
    input.addEventListener("change", () => {
      updateWatermarkSettings({ [key]: input.value });
      updateControlValues();
      refreshPreview();
    });
  }

  function bindTextWatermarkControls() {
    elements.textWatermarkInput.addEventListener("input", () => {
      const text = elements.textWatermarkInput.value;
      updateTextWatermark({
        text,
        enabled: text.trim().length > 0
      });
      refreshPreview();
    });

    elements.textColorInput.addEventListener("input", () => {
      updateTextWatermark({ color: elements.textColorInput.value });
      refreshPreview();
    });
  }

  function bindInvertToggle() {
    elements.invertToggle.addEventListener("change", () => {
      updateWatermarkSettings({ invertWatermark: elements.invertToggle.checked });
      refreshPreview();
    });
  }

  function bindThemeToggle() {
    const savedTheme = localStorage.getItem("watermarkStudioTheme");
    updateWatermarkSettings({ theme: savedTheme === "light" ? "light" : "dark" });
    applyTheme(state.settings.theme);

    elements.themeToggle.addEventListener("change", () => {
      const theme = elements.themeToggle.checked ? "light" : "dark";
      updateWatermarkSettings({ theme });
      applyTheme(theme, { animate: true, sourceElement: elements.themeToggle });
    });
  }

  function getCurrentAspectRatio() {
    if (!state.photo.width || !state.photo.height) {
      return Math.max(1, Number(state.settings.resizeWidth) || 3000) / Math.max(1, Number(state.settings.resizeHeight) || 3000);
    }

    return state.photo.width / state.photo.height;
  }

  function clampNumber(value, min, max, fallback) {
    const number = Number(value);
    if (!Number.isFinite(number)) {
      return fallback;
    }

    return Math.min(max, Math.max(min, number));
  }

  function updateResizeFromWidth() {
    const width = clampNumber(elements.resizeWidthInput.value, 1, 50000, state.settings.resizeWidth);
    const nextSettings = { resizeWidth: width };

    if (state.settings.resizeAspectLocked) {
      nextSettings.resizeHeight = Math.max(1, Math.round(width / getCurrentAspectRatio()));
    }

    updateWatermarkSettings(nextSettings);
    updateControlValues();
  }

  function updateResizeFromHeight() {
    const height = clampNumber(elements.resizeHeightInput.value, 1, 50000, state.settings.resizeHeight);
    const nextSettings = { resizeHeight: height };

    if (state.settings.resizeAspectLocked) {
      nextSettings.resizeWidth = Math.max(1, Math.round(height * getCurrentAspectRatio()));
    }

    updateWatermarkSettings(nextSettings);
    updateControlValues();
  }

  function updateResizeFromPercent() {
    const percent = clampNumber(elements.resizePercentInput.value, 1, 1000, state.settings.resizePercent);
    const baseWidth = state.photo.width || state.settings.resizeWidth || 3000;
    const baseHeight = state.photo.height || state.settings.resizeHeight || 3000;

    updateWatermarkSettings({
      resizePercent: percent,
      resizeWidth: Math.max(1, Math.round(baseWidth * (percent / 100))),
      resizeHeight: Math.max(1, Math.round(baseHeight * (percent / 100)))
    });
    updateControlValues();
  }

  function syncResizeToCurrentPhotoRatio() {
    if (!state.settings.resizeAspectLocked || !state.photo.width || !state.photo.height) {
      return;
    }

    const width = clampNumber(state.settings.resizeWidth, 1, 50000, state.photo.width);
    updateWatermarkSettings({
      resizeWidth: width,
      resizeHeight: Math.max(1, Math.round(width / getCurrentAspectRatio()))
    });
  }

  function saveMetadataDefaults() {
    localStorage.setItem("watermarkStudioMetadata", JSON.stringify({
      author: state.settings.metadataAuthor,
      copyright: state.settings.metadataCopyright,
      contact: state.settings.metadataContact
    }));
  }

  function loadMetadataDefaults() {
    try {
      const savedMetadata = JSON.parse(localStorage.getItem("watermarkStudioMetadata") || "{}");
      updateWatermarkSettings({
        metadataAuthor: savedMetadata.author || "",
        metadataCopyright: savedMetadata.copyright || "",
        metadataContact: savedMetadata.contact || ""
      });
    } catch (error) {
      updateWatermarkSettings({
        metadataAuthor: "",
        metadataCopyright: "",
        metadataContact: ""
      });
    }
  }

  function bindExportSettingsControls() {
    elements.targetFileSizeToggle.addEventListener("change", () => {
      updateWatermarkSettings({ targetFileSizeEnabled: elements.targetFileSizeToggle.checked });
      updateControlValues();
    });

    elements.targetFileSizeInput.addEventListener("input", () => {
      updateWatermarkSettings({
        targetFileSizeKb: clampNumber(elements.targetFileSizeInput.value, 20, 512000, state.settings.targetFileSizeKb)
      });
    });

    elements.resizeWidthInput.addEventListener("input", updateResizeFromWidth);
    elements.resizeHeightInput.addEventListener("input", updateResizeFromHeight);
    elements.resizePercentInput.addEventListener("input", updateResizeFromPercent);

    elements.resizeAspectToggle.addEventListener("change", () => {
      updateWatermarkSettings({ resizeAspectLocked: elements.resizeAspectToggle.checked });
      updateControlValues();
    });

    elements.metadataSelect.addEventListener("change", () => {
      updateWatermarkSettings({ metadataMode: elements.metadataSelect.value });
      updateControlValues();
    });

    elements.metadataAuthorInput.addEventListener("input", () => {
      updateWatermarkSettings({ metadataAuthor: elements.metadataAuthorInput.value });
      saveMetadataDefaults();
    });

    elements.metadataCopyrightInput.addEventListener("input", () => {
      updateWatermarkSettings({ metadataCopyright: elements.metadataCopyrightInput.value });
      saveMetadataDefaults();
    });

    elements.metadataContactInput.addEventListener("input", () => {
      updateWatermarkSettings({ metadataContact: elements.metadataContactInput.value });
      saveMetadataDefaults();
    });

    elements.outputSharpeningSelect.addEventListener("change", () => {
      updateWatermarkSettings({ outputSharpening: elements.outputSharpeningSelect.value });
      updateControlValues();
    });
  }

  function bindDeleteButton() {
    elements.deleteSelectedButton.addEventListener("click", () => {
      const deletedCount = deleteSelectedPhotos();
      renderThumbnails();
      refreshPreview();
      setMessage(deletedCount > 0 ? `已删除 ${deletedCount} 张图片。` : "没有可删除的图片。", deletedCount > 0 ? "success" : "error");
    });
  }

  function bindSelectionActions() {
    elements.selectAllButton.addEventListener("click", () => {
      selectAllPhotos();
      renderThumbnails();
      refreshPreview();
    });

    elements.clearSelectionButton.addEventListener("click", () => {
      clearPhotoSelection();
      renderThumbnails();
      updateDeleteButton();
    });
  }

  function closeExportModal(force = false) {
    if ((!force && exporting) || !elements.exportModal) {
      return;
    }

    elements.exportModal.classList.remove("open");
    elements.exportModal.setAttribute("aria-hidden", "true");
  }

  function openExportModal() {
    if (!elements.exportModal) {
      return;
    }

    syncResizeToCurrentPhotoRatio();
    updateControlValues();
    elements.exportModal.classList.add("open");
    elements.exportModal.setAttribute("aria-hidden", "false");
    window.setTimeout(() => {
      elements.confirmExportButton.focus();
    }, 0);
  }

  function createExportModal() {
    const modal = document.createElement("div");
    modal.id = "exportModal";
    modal.className = "export-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "exportModalTitle");
    modal.setAttribute("aria-hidden", "true");

    const dialog = document.createElement("div");
    dialog.className = "export-dialog";

    const header = document.createElement("div");
    header.className = "export-modal-header";

    const title = document.createElement("h2");
    title.id = "exportModalTitle";
    title.textContent = "导出设置";

    const closeButton = document.createElement("button");
    closeButton.className = "icon-button";
    closeButton.type = "button";
    closeButton.setAttribute("aria-label", "关闭导出设置");
    closeButton.textContent = "×";

    const body = document.createElement("div");
    body.className = "export-modal-body";
    body.appendChild(elements.exportSettings);

    const footer = document.createElement("div");
    footer.className = "export-modal-footer";

    const cancelButton = document.createElement("button");
    cancelButton.className = "secondary-button";
    cancelButton.type = "button";
    cancelButton.textContent = "取消";

    const confirmButton = document.createElement("button");
    confirmButton.id = "confirmExportButton";
    confirmButton.className = "export-button";
    confirmButton.type = "button";
    confirmButton.textContent = "导出";

    header.appendChild(title);
    header.appendChild(closeButton);
    footer.appendChild(cancelButton);
    footer.appendChild(confirmButton);
    dialog.appendChild(header);
    dialog.appendChild(body);
    dialog.appendChild(footer);
    modal.appendChild(dialog);
    document.body.appendChild(modal);

    elements.exportModal = modal;
    elements.confirmExportButton = confirmButton;
    elements.cancelExportButton = cancelButton;
    elements.closeExportButton = closeButton;

    closeButton.addEventListener("click", () => closeExportModal());
    cancelButton.addEventListener("click", () => closeExportModal());
    confirmButton.addEventListener("click", handleExport);
    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        closeExportModal();
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && modal.classList.contains("open")) {
        closeExportModal();
      }
    });
  }

  function bindThumbnailList() {
    elements.thumbnailList.addEventListener("click", (event) => {
      if (event.target !== elements.thumbnailList) {
        return;
      }

      clearPhotoSelection();
      renderThumbnails();
      updateDeleteButton();
    });
  }

  function recommendZipForBulkSeparateExport() {
    const isBulkSeparate = state.settings.exportScope === "all"
      && state.photos.length > 1
      && state.settings.exportDelivery === "separate";

    if (!isBulkSeparate) {
      return true;
    }

    const useZip = window.confirm("全部图片按单张文件导出可能触发多次下载。建议改用 ZIP 包导出。\n\n点击“确定”改用 ZIP 包；点击“取消”继续单张文件导出。");

    if (useZip) {
      updateWatermarkSettings({ exportDelivery: "zip" });
      const zipInput = document.querySelector('input[name="exportDelivery"][value="zip"]');
      if (zipInput) {
        zipInput.checked = true;
      }
      updateControlValues();
    }

    return true;
  }

  async function handleExport() {
    if (exporting) {
      return;
    }

    if (!recommendZipForBulkSeparateExport()) {
      return;
    }

    exporting = true;
    elements.exportButton.disabled = true;
    elements.confirmExportButton.disabled = true;
    elements.exportButton.textContent = "导出中...";
    elements.confirmExportButton.textContent = "导出中...";

    try {
      const result = await exportWatermarkedJpg({
        onProgress(progress) {
          const action = progress.phase === "package" ? "正在打包" : "正在导出";
          const current = progress.current || Math.min(progress.completed + 1, progress.total);
          const suffix = progress.name ? `：${progress.name}` : "";
          setMessage(`${action} ${current}/${progress.total} ${progress.format}${suffix}`);
        }
      });
      setDownloadMessage(result);
      closeExportModal(true);
    } catch (error) {
      setMessage(error.message, "error");
    } finally {
      exporting = false;
      elements.exportButton.disabled = false;
      elements.confirmExportButton.disabled = false;
      updateExportButtonLabel();
    }
  }

  function updateAfterDefaultWatermarkLoad() {
    updateWatermarkStatus();
    refreshPreview();
  }

  function initUi() {
    elements.photoInput = $("#photoInput");
    elements.watermarkInput = $("#watermarkInput");
    elements.previewCanvas = $("#previewCanvas");
    elements.canvasWrap = $(".canvas-wrap");
    elements.faviconLink = $("#faviconLink");
    elements.emptyState = $("#emptyState");
    elements.messageBar = $("#messageBar");
    elements.watermarkStatus = $("#watermarkStatus");
    elements.thumbnailList = $("#thumbnailList");
    elements.photoCount = $("#photoCount");
    elements.sizeRange = $("#sizeRange");
    elements.opacityRange = $("#opacityRange");
    elements.marginRange = $("#marginRange");
    elements.qualityRange = $("#qualityRange");
    elements.outputSizeValue = $("#outputSizeValue");
    elements.filenamePrefixInput = $("#filenamePrefixInput");
    elements.filenameSuffixInput = $("#filenameSuffixInput");
    elements.filenamePreviewValue = $("#filenamePreviewValue");
    elements.formatSelect = $("#formatSelect");
    elements.colorSpaceSelect = $("#colorSpaceSelect");
    elements.qualityHint = $("#qualityHint");
    elements.targetFileSizeToggle = $("#targetFileSizeToggle");
    elements.targetFileSizeInput = $("#targetFileSizeInput");
    elements.resizeWidthInput = $("#resizeWidthInput");
    elements.resizeHeightInput = $("#resizeHeightInput");
    elements.resizePercentInput = $("#resizePercentInput");
    elements.resizeAspectToggle = $("#resizeAspectToggle");
    elements.metadataSelect = $("#metadataSelect");
    elements.metadataFields = $("#metadataFields");
    elements.metadataAuthorInput = $("#metadataAuthorInput");
    elements.metadataCopyrightInput = $("#metadataCopyrightInput");
    elements.metadataContactInput = $("#metadataContactInput");
    elements.outputSharpeningSelect = $("#outputSharpeningSelect");
    elements.textWatermarkInput = $("#textWatermarkInput");
    elements.textColorInput = $("#textColorInput");
    elements.invertToggle = $("#invertToggle");
    elements.watermarkLayoutSelect = $("#watermarkLayoutSelect");
    elements.themeToggle = $("#themeToggle");
    elements.deleteSelectedButton = $("#deleteSelectedButton");
    elements.selectionStatus = $("#selectionStatus");
    elements.selectAllButton = $("#selectAllButton");
    elements.clearSelectionButton = $("#clearSelectionButton");
    elements.sizeValue = $("#sizeValue");
    elements.opacityValue = $("#opacityValue");
    elements.marginValue = $("#marginValue");
    elements.qualityValue = $("#qualityValue");
    elements.exportButton = $("#exportButton");
    elements.exportSettings = $(".export-settings");

    loadMetadataDefaults();
    createExportModal();

    elements.photoInput.addEventListener("change", handlePhotoUploadOptimized);
    elements.watermarkInput.addEventListener("change", handleWatermarkUpload);
    elements.exportButton.addEventListener("click", openExportModal);

    bindRangeControl(elements.sizeRange, "sizePercent", (value) => Number(value));
    bindRangeControl(elements.opacityRange, "opacity", (value) => Number(value) / 100);
    bindRangeControl(elements.marginRange, "margin", (value) => Number(value));
    bindRangeControl(elements.qualityRange, "exportQuality", (value) => Number(value) / 100);
    bindRadioControls("position", "position");
    bindRadioControls("exportDelivery", "exportDelivery");
    bindTextControl(elements.filenamePrefixInput, "filenamePrefix");
    bindTextControl(elements.filenameSuffixInput, "filenameSuffix");
    bindSelectControl(elements.formatSelect, "outputFormat");
    bindSelectControl(elements.colorSpaceSelect, "colorSpace");
    bindSelectControl(elements.watermarkLayoutSelect, "watermarkLayout");
    bindExportSettingsControls();
    bindTextWatermarkControls();
    bindInvertToggle();
    bindThemeToggle();
    bindDeleteButton();
    bindSelectionActions();
    bindThumbnailList();

    window.addEventListener("resize", refreshPreview);

    renderThumbnails();
    updateControlValues();
    setMessage("");
    refreshPreview();
  }

  window.WatermarkStudio.ui = {
    initUi,
    refreshPreview,
    updateAfterDefaultWatermarkLoad
  };
})();
