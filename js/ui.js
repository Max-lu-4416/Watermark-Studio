(function () {
  const {
    appendPhotos,
    clearPhotoSelection,
    deleteSelectedPhotos,
    previewPhoto,
    selectPhotoRange,
    selectAllPhotos,
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

  function $(selector) {
    return document.querySelector(selector);
  }

  function setMessage(text, type = "") {
    clearFallbackDownloadUrls();
    elements.messageBar.textContent = text;
    elements.messageBar.className = `message-bar ${type}`.trim();
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
  }

  function updateWatermarkStatus() {
    elements.watermarkStatus.textContent = state.watermark.message;
    elements.watermarkStatus.className = `notice ${state.watermark.status === "ready" ? "success" : "error"}`;
  }

  function applyTheme(theme) {
    document.body.dataset.theme = theme === "light" ? "light" : "dark";
    elements.themeToggle.checked = theme === "light";
    localStorage.setItem("watermarkStudioTheme", document.body.dataset.theme);
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
    const longEdge = Math.max(1, Number(settings.outputLongEdge) || 3000);

    if (!photo.width || !photo.height) {
      return `${longEdge} x --`;
    }

    if (photo.width >= photo.height) {
      return `${longEdge} x ${Math.max(1, Math.round((photo.height / photo.width) * longEdge))}`;
    }

    return `${Math.max(1, Math.round((photo.width / photo.height) * longEdge))} x ${longEdge}`;
  }

  function updateExportButtonLabel() {
    elements.exportButton.textContent = `导出 ${getOutputFormatLabel(state.settings.outputFormat)}`;
  }

  function updateControlValues() {
    elements.sizeValue.textContent = String(state.settings.sizePercent);
    elements.opacityValue.textContent = String(Math.round(state.settings.opacity * 100));
    elements.marginValue.textContent = `${state.settings.margin}%`;
    elements.qualityValue.textContent = String(Math.round(state.settings.exportQuality * 100));
    elements.longEdgeInput.value = String(state.settings.outputLongEdge);
    elements.outputSizeValue.textContent = getOutputSizeLabel();
    elements.filenamePrefixInput.value = state.settings.filenamePrefix;
    elements.filenameSuffixInput.value = state.settings.filenameSuffix;
    elements.formatSelect.value = state.settings.outputFormat;
    elements.colorSpaceSelect.value = state.settings.colorSpace;
    if (document.activeElement !== elements.textWatermarkInput) {
      elements.textWatermarkInput.value = state.textWatermark.text;
    }
    elements.textColorInput.value = state.textWatermark.color;
    elements.textFontSelect.value = state.textWatermark.fontFamily;
    elements.textWeightSelect.value = state.textWatermark.fontWeight;
    elements.textItalicToggle.checked = state.textWatermark.italic;
    elements.textEffectSelect.value = state.textWatermark.effect;
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
          previewPhoto(index);
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

  function createResizedImageUrl(sourceImage, size, quality) {
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
          resolve(URL.createObjectURL(blob));
        } else {
          reject(new Error("Preview image generation failed"));
        }
      }, "image/jpeg", quality);
    });
  }

  async function createDerivedPhotoImages(sourceImage) {
    const width = sourceImage.naturalWidth;
    const height = sourceImage.naturalHeight;
    const previewSize = getScaledSize(width, height, PREVIEW_MAX_LONG_EDGE);
    const thumbnailSize = getScaledSize(width, height, THUMBNAIL_MAX_LONG_EDGE);
    const previewUrl = await createResizedImageUrl(sourceImage, previewSize, PREVIEW_JPEG_QUALITY);

    try {
      const thumbnailUrl = await createResizedImageUrl(sourceImage, thumbnailSize, THUMBNAIL_JPEG_QUALITY);
      return { previewUrl, thumbnailUrl };
    } catch (error) {
      URL.revokeObjectURL(previewUrl);
      throw error;
    }
  }

  async function loadPhotoFile(file) {
    const objectUrl = URL.createObjectURL(file);
    let previewUrl = "";
    let thumbnailUrl = "";

    try {
      const sourceImage = await loadImageFromUrl(objectUrl);
      const derivedImages = await createDerivedPhotoImages(sourceImage);
      previewUrl = derivedImages.previewUrl;
      thumbnailUrl = derivedImages.thumbnailUrl;

      const image = await loadImageFromUrl(previewUrl);
      const width = sourceImage.naturalWidth;
      const height = sourceImage.naturalHeight;
      sourceImage.removeAttribute("src");

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
      [objectUrl, previewUrl, thumbnailUrl].forEach((url) => {
        if (url) {
          URL.revokeObjectURL(url);
        }
      });
      throw error;
    }
  }

  async function handlePhotoUpload(event) {
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

    if (unsupportedCount > 0) {
      setMessage(`已跳过 ${unsupportedCount} 个不支持的文件，继续导入有效图片。`, "error");
      await waitForNextFrame();
    }

    for (let index = 0; index < validFiles.length; index += 1) {
      const file = validFiles[index];
      setMessage(`正在导入 ${index + 1}/${validFiles.length}：${file.name}`);
      await waitForNextFrame();

      try {
        const photo = await loadPhotoFile(file);
        importedCount += 1;
        appendPhotos([photo]);
        renderThumbnails();
        refreshPreview();
        setMessage(`已导入 ${importedCount}/${validFiles.length}：${file.name}`, "success");
      } catch (error) {
        failedCount += 1;
      }
    }

    if (importedCount === 0) {
      setMessage("图片加载失败，请选择有效图片。", "error");
    } else {
      setMessage(
        failedCount > 0
          ? `已导入 ${importedCount} 张图片，${failedCount} 张加载失败或格式不支持。`
          : `已追加导入 ${importedCount} 张图片。`,
        failedCount > 0 ? "error" : "success"
      );
    }

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

    elements.textFontSelect.addEventListener("change", () => {
      updateTextWatermark({ fontFamily: elements.textFontSelect.value });
      updateControlValues();
      refreshPreview();
    });

    elements.textWeightSelect.addEventListener("change", () => {
      updateTextWatermark({ fontWeight: elements.textWeightSelect.value });
      updateControlValues();
      refreshPreview();
    });

    elements.textItalicToggle.addEventListener("change", () => {
      updateTextWatermark({ italic: elements.textItalicToggle.checked });
      refreshPreview();
    });

    elements.textEffectSelect.addEventListener("change", () => {
      updateTextWatermark({ effect: elements.textEffectSelect.value });
      updateControlValues();
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
      applyTheme(theme);
    });
  }

  function bindLongEdgeInput() {
    elements.longEdgeInput.addEventListener("input", () => {
      const value = Math.min(10000, Math.max(50, Number(elements.longEdgeInput.value) || 3000));
      updateWatermarkSettings({ outputLongEdge: value });
      updateControlValues();
    });

    elements.longEdgeInput.addEventListener("blur", () => {
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
    elements.exportButton.textContent = "导出中...";

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
    } catch (error) {
      setMessage(error.message, "error");
    } finally {
      exporting = false;
      elements.exportButton.disabled = false;
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
    elements.emptyState = $("#emptyState");
    elements.messageBar = $("#messageBar");
    elements.watermarkStatus = $("#watermarkStatus");
    elements.thumbnailList = $("#thumbnailList");
    elements.photoCount = $("#photoCount");
    elements.sizeRange = $("#sizeRange");
    elements.opacityRange = $("#opacityRange");
    elements.marginRange = $("#marginRange");
    elements.qualityRange = $("#qualityRange");
    elements.longEdgeInput = $("#longEdgeInput");
    elements.outputSizeValue = $("#outputSizeValue");
    elements.filenamePrefixInput = $("#filenamePrefixInput");
    elements.filenameSuffixInput = $("#filenameSuffixInput");
    elements.formatSelect = $("#formatSelect");
    elements.colorSpaceSelect = $("#colorSpaceSelect");
    elements.textWatermarkInput = $("#textWatermarkInput");
    elements.textColorInput = $("#textColorInput");
    elements.textFontSelect = $("#textFontSelect");
    elements.textWeightSelect = $("#textWeightSelect");
    elements.textItalicToggle = $("#textItalicToggle");
    elements.textEffectSelect = $("#textEffectSelect");
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

    elements.photoInput.addEventListener("change", handlePhotoUpload);
    elements.watermarkInput.addEventListener("change", handleWatermarkUpload);
    elements.exportButton.addEventListener("click", handleExport);

    bindRangeControl(elements.sizeRange, "sizePercent", (value) => Number(value));
    bindRangeControl(elements.opacityRange, "opacity", (value) => Number(value) / 100);
    bindRangeControl(elements.marginRange, "margin", (value) => Number(value));
    bindRangeControl(elements.qualityRange, "exportQuality", (value) => Number(value) / 100);
    bindRadioControls("position", "position");
    bindRadioControls("exportScope", "exportScope");
    bindRadioControls("exportDelivery", "exportDelivery");
    bindTextControl(elements.filenamePrefixInput, "filenamePrefix");
    bindTextControl(elements.filenameSuffixInput, "filenameSuffix");
    bindSelectControl(elements.formatSelect, "outputFormat");
    bindSelectControl(elements.colorSpaceSelect, "colorSpace");
    bindSelectControl(elements.watermarkLayoutSelect, "watermarkLayout");
    bindTextWatermarkControls();
    bindInvertToggle();
    bindThemeToggle();
    bindLongEdgeInput();
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
