(function () {
  const {
    appendPhotos,
    deleteSelectedPhotos,
    selectPhotoRange,
    selectSinglePhoto,
    state,
    togglePhotoSelection,
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

    const text = document.createElement("span");
    text.textContent = result.downloads[0]?.type === "application/zip"
      ? `已生成 ${result.count} 张 JPG，并打包为 ZIP。`
      : `已生成 ${result.count} 张 JPG 导出文件。`;
    elements.messageBar.appendChild(text);

    const links = document.createElement("span");
    links.className = "download-links";

    result.downloads.forEach((item, index) => {
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

  function updateControlValues() {
    elements.sizeValue.textContent = String(state.settings.sizePercent);
    elements.opacityValue.textContent = String(Math.round(state.settings.opacity * 100));
    elements.marginValue.textContent = String(state.settings.margin);
    elements.qualityValue.textContent = String(Math.round(state.settings.exportQuality * 100));
    elements.longEdgeInput.value = String(state.settings.outputLongEdge);
    elements.invertToggle.checked = state.settings.invertWatermark;
  }

  function updateDeleteButton() {
    const selectedCount = state.selectedPhotoIndices.length;
    elements.deleteSelectedButton.classList.toggle("visible", selectedCount > 0);
    elements.deleteSelectedButton.textContent = selectedCount > 1 ? `删除选中 ${selectedCount}` : "删除选中";
  }

  function refreshPreview() {
    if (renderQueued) {
      return;
    }

    renderQueued = true;
    requestAnimationFrame(() => {
      renderQueued = false;
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
      image.src = photo.objectUrl;
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

  async function loadPhotoFile(file) {
    const objectUrl = URL.createObjectURL(file);

    try {
      const image = await loadImageFromUrl(objectUrl);
      return {
        file,
        image,
        objectUrl,
        name: file.name,
        width: image.naturalWidth,
        height: image.naturalHeight
      };
    } catch (error) {
      URL.revokeObjectURL(objectUrl);
      throw error;
    }
  }

  async function handlePhotoUpload(event) {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) {
      return;
    }

    const validFiles = files.filter((file) => ["image/jpeg", "image/png", "image/webp"].includes(file.type));

    if (validFiles.length !== files.length) {
      setMessage("请上传 JPG、PNG 或 WEBP 图片。", "error");
      event.target.value = "";
      return;
    }

    try {
      const photos = await Promise.all(validFiles.map(loadPhotoFile));
      appendPhotos(photos);
      renderThumbnails();
      setMessage(`已追加导入 ${photos.length} 张图片。`, "success");
      refreshPreview();
    } catch (error) {
      setMessage("图片加载失败，请选择有效图片。", "error");
    } finally {
      event.target.value = "";
    }
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
          refreshPreview();
        }
      });
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
      const value = Math.min(10000, Math.max(50, Number(elements.longEdgeInput.value) || 300));
      updateWatermarkSettings({ outputLongEdge: value });
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

  async function handleExport() {
    if (exporting) {
      return;
    }

    exporting = true;
    elements.exportButton.disabled = true;
    elements.exportButton.textContent = "导出中...";

    try {
      const result = await exportWatermarkedJpg();
      setDownloadMessage(result);
    } catch (error) {
      setMessage(error.message, "error");
    } finally {
      exporting = false;
      elements.exportButton.disabled = false;
      elements.exportButton.textContent = "导出 JPG";
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
    elements.invertToggle = $("#invertToggle");
    elements.themeToggle = $("#themeToggle");
    elements.deleteSelectedButton = $("#deleteSelectedButton");
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
    bindInvertToggle();
    bindThemeToggle();
    bindLongEdgeInput();
    bindDeleteButton();

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
