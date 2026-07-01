(function () {
  const { state } = window.WatermarkStudio.stateModule;
  const { drawWatermark } = window.WatermarkStudio.canvasRenderer;

  function getBaseFileName(fileName) {
    const lastDot = fileName.lastIndexOf(".");
    return lastDot > 0 ? fileName.slice(0, lastDot) : fileName;
  }

  function sanitizeZipName(name) {
    return name.replace(/[\\/:*?"<>|]/g, "_");
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

  function createStoredZip(files) {
    const encoder = new TextEncoder();
    const now = getDosDateTime(new Date());
    const localParts = [];
    const centralParts = [];
    let offset = 0;

    files.forEach((file) => {
      const nameBytes = encoder.encode(file.name);
      const crc = getCrc32(file.bytes);

      const localHeader = [
        uint32(0x04034b50),
        uint16(20),
        uint16(0x0800),
        uint16(0),
        uint16(now.time),
        uint16(now.date),
        uint32(crc),
        uint32(file.bytes.length),
        uint32(file.bytes.length),
        uint16(nameBytes.length),
        uint16(0),
        nameBytes
      ];

      localParts.push(...localHeader, file.bytes);

      centralParts.push(
        uint32(0x02014b50),
        uint16(20),
        uint16(20),
        uint16(0x0800),
        uint16(0),
        uint16(now.time),
        uint16(now.date),
        uint32(crc),
        uint32(file.bytes.length),
        uint32(file.bytes.length),
        uint16(nameBytes.length),
        uint16(0),
        uint16(0),
        uint16(0),
        uint16(0),
        uint32(0),
        uint32(offset),
        nameBytes
      );

      offset += localHeader.reduce((sum, part) => sum + part.length, 0) + file.bytes.length;
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
    const targetLongEdge = Math.max(1, Number(longEdge) || 300);

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

  function renderExportCanvas(photo) {
    const { watermark, settings } = state;
    const outputSize = getOutputSize(photo, settings.outputLongEdge);
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = outputSize.width;
    exportCanvas.height = outputSize.height;

    const ctx = exportCanvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, outputSize.width, outputSize.height);
    ctx.drawImage(photo.image, 0, 0, outputSize.width, outputSize.height);
    drawWatermark(ctx, watermark.image, settings, outputSize.width, outputSize.height);

    return exportCanvas;
  }

  function canvasToBlob(canvas, quality) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("导出图片生成失败"));
        }
      }, "image/jpeg", quality);
    });
  }

  async function createJpgDownload(photo) {
    const canvas = renderExportCanvas(photo);
    const blob = await canvasToBlob(canvas, state.settings.exportQuality);
    const url = URL.createObjectURL(blob);
    const name = `${getBaseFileName(photo.name)}_watermarked.jpg`;

    return { name, blob, url };
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

  async function exportWatermarkedJpg() {
    const { photo, photos, watermark, settings } = state;

    if (!photo.image) {
      throw new Error("请先导入图片");
    }

    if (!watermark.image) {
      throw new Error("请先上传 PNG 水印或放置默认水印");
    }

    const exportPhotos = settings.exportScope === "all" ? photos : [photo];

    if (exportPhotos.length === 1) {
      const download = await createJpgDownload(exportPhotos[0]);
      triggerDownload(download.url, download.name);

      return {
        count: 1,
        downloads: [{ name: download.name, url: download.url, type: "image/jpeg" }]
      };
    }

    const jpgFiles = [];

    for (const exportPhoto of exportPhotos) {
      const download = await createJpgDownload(exportPhoto);
      jpgFiles.push({
        name: sanitizeZipName(download.name),
        bytes: new Uint8Array(await download.blob.arrayBuffer())
      });
      URL.revokeObjectURL(download.url);
    }

    const zipBlob = createStoredZip(jpgFiles);
    const zipUrl = URL.createObjectURL(zipBlob);
    const zipName = `watermarked_${exportPhotos.length}_images.zip`;
    triggerDownload(zipUrl, zipName);

    return {
      count: exportPhotos.length,
      downloads: [{ name: zipName, url: zipUrl, type: "application/zip" }]
    };
  }

  window.WatermarkStudio.exporter = {
    exportWatermarkedJpg
  };
})();
