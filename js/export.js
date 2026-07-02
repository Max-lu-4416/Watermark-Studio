(function () {
  const { state } = window.WatermarkStudio.stateModule;
  const { drawWatermark } = window.WatermarkStudio.canvasRenderer;
  const { loadImageFromUrl } = window.WatermarkStudio.watermarkImage;

  function getBaseFileName(fileName) {
    const lastDot = fileName.lastIndexOf(".");
    return lastDot > 0 ? fileName.slice(0, lastDot) : fileName;
  }

  function sanitizeZipName(name) {
    return String(name || "").replace(/[\\/:*?"<>|]/g, "_").trim();
  }

  function getFormatConfig(format) {
    const configs = {
      jpeg: { mimeType: "image/jpeg", extension: "jpg", label: "JPG", supportsQuality: true },
      png: { mimeType: "image/png", extension: "png", label: "PNG", supportsQuality: false },
      webp: { mimeType: "image/webp", extension: "webp", label: "WEBP", supportsQuality: true }
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
    if (state.settings.exportDestinationMode === "browser" || typeof window.showSaveFilePicker !== "function") {
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
    if (state.settings.exportDestinationMode === "browser" || typeof window.showDirectoryPicker !== "function") {
      return null;
    }

    try {
      let directoryHandle = await window.showDirectoryPicker({ mode: "readwrite" });
      if (state.settings.exportSubfolderEnabled) {
        const folderName = sanitizeZipName(state.settings.exportSubfolderName || "Watermarked") || "Watermarked";
        directoryHandle = await directoryHandle.getDirectoryHandle(folderName, { create: true });
      }
      return directoryHandle;
    } catch (error) {
      if (isAbortError(error)) {
        throw new Error("已取消导出。");
      }

      throw error;
    }
  }

  async function getUniqueFileHandle(directoryHandle, name) {
    if (state.settings.existingFileAction !== "rename") {
      return directoryHandle.getFileHandle(name, { create: true });
    }

    const lastDot = name.lastIndexOf(".");
    const base = lastDot > 0 ? name.slice(0, lastDot) : name;
    const extension = lastDot > 0 ? name.slice(lastDot) : "";

    for (let index = 0; index < 1000; index += 1) {
      const candidate = index === 0 ? name : `${base}-${index}${extension}`;
      try {
        await directoryHandle.getFileHandle(candidate, { create: false });
      } catch (error) {
        if (error && error.name === "NotFoundError") {
          return directoryHandle.getFileHandle(candidate, { create: true });
        }
        throw error;
      }
    }

    return directoryHandle.getFileHandle(`${base}-${Date.now()}${extension}`, { create: true });
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

  function uint16be(value) {
    const bytes = new Uint8Array(2);
    new DataView(bytes.buffer).setUint16(0, value, false);
    return bytes;
  }

  function uint32be(value) {
    const bytes = new Uint8Array(4);
    new DataView(bytes.buffer).setUint32(0, value >>> 0, false);
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

  function getOutputSize(photo) {
    const targetWidth = Math.max(1, Number(state.settings.resizeWidth) || photo.width || 1);
    const targetHeight = Math.max(1, Number(state.settings.resizeHeight) || photo.height || 1);
    const scale = Math.min(targetWidth / Math.max(1, photo.width), targetHeight / Math.max(1, photo.height));

    return {
      width: Math.max(1, Math.round(photo.width * scale)),
      height: Math.max(1, Math.round(photo.height * scale))
    };
  }

  function applyOutputSharpening(ctx, width, height, level) {
    const amounts = {
      low: 0.18,
      standard: 0.32,
      high: 0.5
    };
    const amount = amounts[level] || 0;

    if (!amount || width < 3 || height < 3) {
      return;
    }

    const source = ctx.getImageData(0, 0, width, height);
    const output = ctx.createImageData(width, height);
    const input = source.data;
    const data = output.data;

    data.set(input);

    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const offset = (y * width + x) * 4;

        for (let channel = 0; channel < 3; channel += 1) {
          const center = input[offset + channel];
          const top = input[((y - 1) * width + x) * 4 + channel];
          const bottom = input[((y + 1) * width + x) * 4 + channel];
          const left = input[(y * width + x - 1) * 4 + channel];
          const right = input[(y * width + x + 1) * 4 + channel];
          data[offset + channel] = Math.max(0, Math.min(255, center * (1 + amount * 4) - (top + bottom + left + right) * amount));
        }
      }
    }

    ctx.putImageData(output, 0, 0);
  }

  async function renderExportCanvas(photo) {
    const { watermark, settings, textWatermark } = state;
    const outputSize = getOutputSize(photo);
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = outputSize.width;
    exportCanvas.height = outputSize.height;
    const sourceImage = await loadImageFromUrl(photo.objectUrl);

    try {
      const ctx = exportCanvas.getContext("2d", {
        colorSpace: settings.colorSpace === "display-p3" ? "display-p3" : "srgb"
      });
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, outputSize.width, outputSize.height);
      ctx.drawImage(sourceImage, 0, 0, outputSize.width, outputSize.height);
      applyOutputSharpening(ctx, outputSize.width, outputSize.height, settings.outputSharpening);
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

  function escapeXml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  function getMetadataXml() {
    const { metadataMode, metadataAuthor, metadataCopyright, metadataContact } = state.settings;
    const includeContact = ["copyright-contact", "all-except-camera", "all"].includes(metadataMode);
    const author = escapeXml(includeContact ? metadataAuthor : "");
    const rights = escapeXml(metadataCopyright);
    const contact = escapeXml(includeContact ? metadataContact : "");

    return `<?xpacket begin="\uFEFF" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about=""
   xmlns:dc="http://purl.org/dc/elements/1.1/"
   xmlns:xmpRights="http://ns.adobe.com/xap/1.0/rights/"
   xmlns:Iptc4xmpCore="http://iptc.org/std/Iptc4xmpCore/1.0/xmlns/">
   <dc:creator><rdf:Seq><rdf:li>${author}</rdf:li></rdf:Seq></dc:creator>
   <dc:rights><rdf:Alt><rdf:li xml:lang="x-default">${rights}</rdf:li></rdf:Alt></dc:rights>
   <xmpRights:Marked>True</xmpRights:Marked>
   <Iptc4xmpCore:CreatorContactInfo rdf:parseType="Resource"><Iptc4xmpCore:CiEmailWork>${contact}</Iptc4xmpCore:CiEmailWork></Iptc4xmpCore:CreatorContactInfo>
  </rdf:Description>
 </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
  }

  function hasMetadataContent() {
    const { metadataMode, metadataAuthor, metadataCopyright, metadataContact } = state.settings;
    return metadataMode !== "none" && Boolean(`${metadataAuthor}${metadataCopyright}${metadataContact}`.trim());
  }

  function concatBytes(parts) {
    const size = parts.reduce((sum, part) => sum + part.length, 0);
    const bytes = new Uint8Array(size);
    let offset = 0;

    parts.forEach((part) => {
      bytes.set(part, offset);
      offset += part.length;
    });

    return bytes;
  }

  function addJpegMetadata(bytes, xmpBytes) {
    if (bytes[0] !== 0xff || bytes[1] !== 0xd8) {
      throw new Error("不是有效 JPEG 文件");
    }

    const header = new TextEncoder().encode("http://ns.adobe.com/xap/1.0/\0");
    const payload = concatBytes([header, xmpBytes]);
    const length = payload.length + 2;

    if (length > 65535) {
      throw new Error("XMP 元数据过大");
    }

    const segment = concatBytes([new Uint8Array([0xff, 0xe1]), uint16be(length), payload]);
    return concatBytes([bytes.slice(0, 2), segment, bytes.slice(2)]);
  }

  function makePngChunk(type, data) {
    const typeBytes = new TextEncoder().encode(type);
    const crcBytes = concatBytes([typeBytes, data]);
    return concatBytes([uint32be(data.length), typeBytes, data, uint32be(getCrc32(crcBytes))]);
  }

  function addPngMetadata(bytes, xmpBytes) {
    const signature = [137, 80, 78, 71, 13, 10, 26, 10];
    if (!signature.every((value, index) => bytes[index] === value)) {
      throw new Error("不是有效 PNG 文件");
    }

    let offset = 8;
    let iendOffset = -1;
    const decoder = new TextDecoder();

    while (offset + 12 <= bytes.length) {
      const length = new DataView(bytes.buffer, bytes.byteOffset + offset, 4).getUint32(0, false);
      const type = decoder.decode(bytes.slice(offset + 4, offset + 8));
      if (type === "IEND") {
        iendOffset = offset;
        break;
      }
      offset += 12 + length;
    }

    if (iendOffset < 0) {
      throw new Error("PNG 文件缺少 IEND");
    }

    const keyword = new TextEncoder().encode("XML:com.adobe.xmp");
    const data = concatBytes([
      keyword,
      new Uint8Array([0, 0, 0, 0, 0]),
      xmpBytes
    ]);
    const chunk = makePngChunk("iTXt", data);

    return concatBytes([bytes.slice(0, iendOffset), chunk, bytes.slice(iendOffset)]);
  }

  function addWebpMetadata(bytes, xmpBytes) {
    const decoder = new TextDecoder();
    if (decoder.decode(bytes.slice(0, 4)) !== "RIFF" || decoder.decode(bytes.slice(8, 12)) !== "WEBP") {
      throw new Error("不是有效 WEBP 文件");
    }

    const pad = xmpBytes.length % 2 ? new Uint8Array([0]) : new Uint8Array();
    const chunk = concatBytes([new TextEncoder().encode("XMP "), uint32(xmpBytes.length), xmpBytes, pad]);
    const output = concatBytes([bytes.slice(0, 12), bytes.slice(12), chunk]);
    new DataView(output.buffer).setUint32(4, output.length - 8, true);
    return output;
  }

  async function addMetadata(blob, format, warnings, name) {
    if (!hasMetadataContent()) {
      return blob;
    }

    try {
      const bytes = new Uint8Array(await blob.arrayBuffer());
      const xmpBytes = new TextEncoder().encode(getMetadataXml());
      let outputBytes;

      if (format.extension === "jpg") {
        outputBytes = addJpegMetadata(bytes, xmpBytes);
      } else if (format.extension === "png") {
        outputBytes = addPngMetadata(bytes, xmpBytes);
      } else if (format.extension === "webp") {
        outputBytes = addWebpMetadata(bytes, xmpBytes);
      } else {
        return blob;
      }

      return new Blob([outputBytes], { type: format.mimeType });
    } catch (error) {
      warnings.push(`${name} 元数据写入失败：${error.message}`);
      return blob;
    }
  }

  async function createEncodedBlob(canvas, format, warnings, name) {
    const quality = Math.min(1, Math.max(0.01, Number(state.settings.exportQuality) || 0.95));
    const targetBytes = state.settings.targetFileSizeEnabled
      ? Math.max(1, Number(state.settings.targetFileSizeKb) || 1) * 1024
      : 0;

    if (!targetBytes || !format.supportsQuality) {
      if (targetBytes && !format.supportsQuality) {
        warnings.push(`${format.label} 不支持通过品质限制文件大小，已按原设置导出。`);
      }
      return canvasToBlob(canvas, format.mimeType, quality);
    }

    let currentQuality = quality;
    let blob = await canvasToBlob(canvas, format.mimeType, currentQuality);

    while (blob.size > targetBytes && currentQuality > 0.4) {
      currentQuality = Math.max(0.4, currentQuality - 0.05);
      blob = await canvasToBlob(canvas, format.mimeType, currentQuality);
    }

    if (blob.size > targetBytes) {
      warnings.push(`${name} 已降到最低品质 40%，仍超过目标大小。`);
    }

    return blob;
  }

  async function createImageDownload(photo, options = {}) {
    const { createUrl = true, warnings = [] } = options;
    const format = getFormatConfig(state.settings.outputFormat);
    const canvas = await renderExportCanvas(photo);

    try {
      let blob = await createEncodedBlob(canvas, format, warnings, photo.name);
      const name = getExportFileName(photo);
      blob = await addMetadata(blob, format, warnings, name);
      if (
        state.settings.targetFileSizeEnabled
        && format.supportsQuality
        && blob.size > Math.max(1, Number(state.settings.targetFileSizeKb) || 1) * 1024
      ) {
        warnings.push(`${name} 最终文件超过目标大小。`);
      }
      const url = createUrl ? URL.createObjectURL(blob) : "";

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
    const warnings = [];

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

    if (settings.exportDestinationMode === "picker" && typeof window.showSaveFilePicker !== "function") {
      warnings.push("当前浏览器不支持保存位置选择，已退回浏览器默认下载。");
    }

    if (["all-except-camera", "all"].includes(settings.metadataMode)) {
      warnings.push("浏览器 Canvas 导出无法完整保留原始元数据，已尽量写入版权和联系信息。");
    }

    if (delivery === "separate") {
      const directoryHandle = exportPhotos.length > 1 ? await pickDirectory() : null;
      if (exportPhotos.length > 1 && settings.exportDestinationMode === "picker" && !directoryHandle) {
        warnings.push("当前浏览器不支持选择文件夹，批量文件将逐个下载。");
      }
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
          const download = await createImageDownload(exportPhoto, { createUrl: needsUrl, warnings });

          if (directoryHandle) {
            const fileHandle = await getUniqueFileHandle(directoryHandle, download.name);
            const savedName = fileHandle.name || download.name;
            await writeBlobToFileHandle(fileHandle, download.blob);
            downloads.push({ name: savedName, url: "", type: download.type, saved: true });
          } else if (exportPhotos.length === 1) {
            if (singleFileHandle) {
              await writeBlobToFileHandle(singleFileHandle, download.blob);
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
        downloads,
        warnings
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
        const download = await createImageDownload(exportPhoto, { createUrl: false, warnings });
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
        downloads: [{ name: zipName, url: "", type: "application/zip", saved: true }],
        warnings
      };
    }

    const zipUrl = URL.createObjectURL(zipBlob);
    triggerDownload(zipUrl, zipName);

    return {
      count: exportPhotos.length,
      formatLabel: format.label,
      downloads: [{ name: zipName, url: zipUrl, type: "application/zip" }],
      warnings
    };
  }

  window.WatermarkStudio.exporter = {
    exportWatermarkedJpg
  };
})();
