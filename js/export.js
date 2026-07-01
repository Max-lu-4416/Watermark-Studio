(function () {
  const { state } = window.WatermarkStudio.stateModule;
  const { drawWatermark } = window.WatermarkStudio.canvasRenderer;
  const { loadImageFromUrl } = window.WatermarkStudio.watermarkImage;

  function getBaseFileName(fileName) {
    const lastDot = fileName.lastIndexOf(".");
    return lastDot > 0 ? fileName.slice(0, lastDot) : fileName;
  }

  function sanitizeZipName(name) {
    return name.replace(/[\\/:*?"<>|]/g, "_");
  }

  function getFormatConfig(format) {
    const configs = {
      jpeg: { mimeType: "image/jpeg", extension: "jpg", label: "JPG" },
      png: { mimeType: "image/png", extension: "png", label: "PNG" },
      webp: { mimeType: "image/webp", extension: "webp", label: "WEBP" }
    };

    return configs[format] || configs.jpeg;
  }

  function getExportFileName(photo) {
    const { settings } = state;
    const format = getFormatConfig(settings.outputFormat);
    const prefix = settings.filenamePrefix || "";
    const suffix = settings.filenameSuffix || "";
    const baseName = sanitizeZipName(`${prefix}${getBaseFileName(photo.name)}${suffix}`);

    return `${baseName || "watermarked"}.${format.extension}`;
  }

  function isAbortError(error) {
    return error && (error.name === "AbortError" || error.code === DOMException.ABORT_ERR);
  }

  async function writeBlobToFileHandle(fileHandle, blob) {
    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();
  }

  async function pickSaveFile(name, mimeType, extension) {
    if (typeof window.showSaveFilePicker !== "function") {
      return null;
    }

    try {
      return await window.showSaveFilePicker({
        suggestedName: name,
        types: [{
          description: `${extension.toUpperCase()} file`,
          accept: { [mimeType]: [`.${extension}`] }
        }]
      });
    } catch (error) {
      if (isAbortError(error)) {
        throw new Error("已取消导出。");
      }

      throw error;
    }
  }

  async function pickDirectory() {
    if (typeof window.showDirectoryPicker !== "function") {
      return null;
    }

    try {
      return await window.showDirectoryPicker({ mode: "readwrite" });
    } catch (error) {
      if (isAbortError(error)) {
        throw new Error("已取消导出。");
      }

      throw error;
    }
  }

  function makeCrc32Table() {
    const table = [];

    for (let i = 0; i < 256; i += 1) {
      let value = i;

      for (let bit = 0; bit < 8; bit += 1) {
        value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
      }

      table.push(value >>> 0);
    }

    return table;
  }

  const crc32Table = makeCrc32Table();

  function getCrc32(bytes) {
    let crc = 0xffffffff;

    for (let i = 0; i < bytes.length; i += 1) {
      crc = crc32Table[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
    }

    return (crc ^ 0xffffffff) >>> 0;
  }

  function getDosDateTime(date) {
    const year = Math.max(1980, date.getFullYear());

    return {
      time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
      date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()
    };
  }

  function uint16(value) {
    const bytes = new Uint8Array(2);
    new DataView(bytes.buffer).setUint16(0, value, true);
    return bytes;
  }

  function uint32(value) {
    const bytes = new Uint8Array(4);
    new DataView(bytes.buffer).setUint32(0, value >>> 0, true);
    return bytes;
  }

  async function waitForPaint() {
    await new Promise((resolve) => {
      requestAnimationFrame(resolve);
    });
  }

  function reportProgress(onProgress, progress) {
    if (typeof onProgress === "function") {
      onProgress(progress);
    }
  }

  async function getBlobCrc32(blob) {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    return getCrc32(bytes);
  }

  function createStoredZip(files) {
    const encoder = new TextEncoder();
    const now = getDosDateTime(new Date());
    const localParts = [];
    const centralParts = [];
    let offset = 0;

    files.forEach((file) => {
      const nameBytes = encoder.encode(file.name);

      const localHeader = [
        uint32(0x04034b50),
        uint16(20),
        uint16(0x0800),
        uint16(0),
        uint16(now.time),
        uint16(now.date),
        uint32(file.crc),
        uint32(file.size),
        uint32(file.size),
        uint16(nameBytes.length),
        uint16(0),
        nameBytes
      ];

      localParts.push(...localHeader, file.blob);

      centralParts.push(
        uint32(0x02014b50),
        uint16(20),
        uint16(20),
        uint16(0x0800),
        uint16(0),
        uint16(now.time),
        uint16(now.date),
        uint32(file.crc),
        uint32(file.size),
        uint32(file.size),
        uint16(nameBytes.length),
        uint16(0),
        uint16(0),
        uint16(0),
        uint16(0),
        uint32(0),
        uint32(offset),
        nameBytes
      );

      offset += localHeader.reduce((sum, part) => sum + part.length, 0) + file.size;
    });

    const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
    const endRecord = [
      uint32(0x06054b50),
      uint16(0),
      uint16(0),
      uint16(files.length),
      uint16(files.length),
      uint32(centralSize),
      uint32(offset),
      uint16(0)
    ];

    return new Blob([...localParts, ...centralParts, ...endRecord], { type: "application/zip" });
  }

  function getOutputSize(photo, longEdge) {
    const targetLongEdge = Math.max(1, Number(longEdge) || 3000);

    if (photo.width >= photo.height) {
      return {
        width: targetLongEdge,
        height: Math.max(1, Math.round((photo.height / photo.width) * targetLongEdge))
      };
    }

    return {
      width: Math.max(1, Math.round((photo.width / photo.height) * targetLongEdge)),
      height: targetLongEdge
    };
  }

  async function renderExportCanvas(photo) {
    const { watermark, settings, textWatermark } = state;
    const outputSize = getOutputSize(photo, settings.outputLongEdge);
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = outputSize.width;
    exportCanvas.height = outputSize.height;
    const sourceImage = await loadImageFromUrl(photo.objectUrl);

    try {
      const ctx = exportCanvas.getContext("2d", {
        colorSpace: settings.colorSpace === "display-p3" ? "display-p3" : "srgb"
      });
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, outputSize.width, outputSize.height);
      ctx.drawImage(sourceImage, 0, 0, outputSize.width, outputSize.height);
      drawWatermark(ctx, watermark.image, settings, outputSize.width, outputSize.height, textWatermark);

      return exportCanvas;
    } finally {
      sourceImage.removeAttribute("src");
    }
  }

  function canvasToBlob(canvas, mimeType, quality) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("导出图片生成失败"));
        }
      }, mimeType, quality);
    });
  }

  async function createImageDownload(photo, options = {}) {
    const { createUrl = true } = options;
    const format = getFormatConfig(state.settings.outputFormat);
    const canvas = await renderExportCanvas(photo);

    try {
      const blob = await canvasToBlob(canvas, format.mimeType, state.settings.exportQuality);
      const url = createUrl ? URL.createObjectURL(blob) : "";
      const name = getExportFileName(photo);

      return { name, blob, url, type: format.mimeType };
    } finally {
      canvas.width = 1;
      canvas.height = 1;
    }
  }

  function triggerDownload(url, name) {
    const link = document.createElement("a");

    link.href = url;
    link.download = name;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
    link.remove();
  }

  async function exportWatermarkedJpg(options = {}) {
    const { onProgress } = options;
    const { photo, photos, watermark, settings, textWatermark } = state;

    if (!photo.image) {
      throw new Error("请先导入图片");
    }

    const hasTextWatermark = textWatermark.enabled && String(textWatermark.text || "").trim();

    if (!watermark.image && !hasTextWatermark) {
      throw new Error("请先上传 PNG 水印或放置默认水印");
    }

    const exportPhotos = settings.exportScope === "all" ? photos : [photo];
    const format = getFormatConfig(settings.outputFormat);
    const delivery = exportPhotos.length > 1 ? settings.exportDelivery : "separate";
    const total = exportPhotos.length;

    if (delivery === "separate") {
      const directoryHandle = exportPhotos.length > 1 ? await pickDirectory() : null;
      const singleFileHandle = exportPhotos.length === 1
        ? await pickSaveFile(getExportFileName(exportPhotos[0]), format.mimeType, format.extension)
        : null;
      const downloads = [];

      for (let index = 0; index < exportPhotos.length; index += 1) {
        const exportPhoto = exportPhotos[index];
        const needsUrl = !directoryHandle && !(exportPhotos.length === 1 && singleFileHandle);
        reportProgress(onProgress, {
          phase: "render",
          completed: index,
          current: index + 1,
          total,
          name: exportPhoto.name,
          format: format.label
        });
        await waitForPaint();
        try {
          const download = await createImageDownload(exportPhoto, { createUrl: needsUrl });

          if (directoryHandle) {
            const fileHandle = await directoryHandle.getFileHandle(download.name, { create: true });
            await writeBlobToFileHandle(fileHandle, download.blob);
            URL.revokeObjectURL(download.url);
            downloads.push({ name: download.name, url: "", type: download.type, saved: true });
          } else if (exportPhotos.length === 1) {
            if (singleFileHandle) {
              await writeBlobToFileHandle(singleFileHandle, download.blob);
              URL.revokeObjectURL(download.url);
              downloads.push({ name: download.name, url: "", type: download.type, saved: true });
            } else {
              triggerDownload(download.url, download.name);
              downloads.push({ name: download.name, url: download.url, type: download.type });
            }
          } else {
            triggerDownload(download.url, download.name);
            downloads.push({ name: download.name, url: download.url, type: download.type });
          }
        } catch (error) {
          throw new Error(`导出失败：${exportPhoto.name}。${error.message}`);
        }

        reportProgress(onProgress, {
          phase: "render",
          completed: index + 1,
          current: index + 1,
          total,
          name: exportPhoto.name,
          format: format.label
        });
      }

      return {
        count: exportPhotos.length,
        formatLabel: format.label,
        downloads
      };
    }

    const zipName = `watermarked_${exportPhotos.length}_${format.extension}_images.zip`;
    const fileHandle = await pickSaveFile(zipName, "application/zip", "zip");
    const imageFiles = [];

    for (let index = 0; index < exportPhotos.length; index += 1) {
      const exportPhoto = exportPhotos[index];
      reportProgress(onProgress, {
        phase: "zip",
        completed: index,
        current: index + 1,
        total,
        name: exportPhoto.name,
        format: format.label
      });
      await waitForPaint();
      try {
        const download = await createImageDownload(exportPhoto, { createUrl: false });
        imageFiles.push({
          name: sanitizeZipName(download.name),
          blob: download.blob,
          crc: await getBlobCrc32(download.blob),
          size: download.blob.size
        });
      } catch (error) {
        throw new Error(`导出失败：${exportPhoto.name}。${error.message}`);
      }
      reportProgress(onProgress, {
        phase: "zip",
        completed: index + 1,
        current: index + 1,
        total,
        name: exportPhoto.name,
        format: format.label
      });
    }

    reportProgress(onProgress, {
      phase: "package",
      completed: total,
      current: total,
      total,
      name: zipName,
      format: format.label
    });
    await waitForPaint();
    const zipBlob = createStoredZip(imageFiles);

    if (fileHandle) {
      await writeBlobToFileHandle(fileHandle, zipBlob);
      return {
        count: exportPhotos.length,
        formatLabel: format.label,
        downloads: [{ name: zipName, url: "", type: "application/zip", saved: true }]
      };
    }

    const zipUrl = URL.createObjectURL(zipBlob);
    triggerDownload(zipUrl, zipName);

    return {
      count: exportPhotos.length,
      formatLabel: format.label,
      downloads: [{ name: zipName, url: zipUrl, type: "application/zip" }]
    };
  }

  window.WatermarkStudio.exporter = {
    exportWatermarkedJpg
  };
})();
