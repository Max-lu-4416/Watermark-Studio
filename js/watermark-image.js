(function () {
  const {
    DEFAULT_WATERMARK_PATH,
    setWatermark,
    setWatermarkMissing
  } = window.WatermarkStudio.stateModule;

  function loadImageFromUrl(url) {
    return new Promise((resolve, reject) => {
      const image = new Image();

      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`无法加载图片：${url}`));
      image.src = url;
    });
  }

  async function loadDefaultWatermark() {
    try {
      const image = await loadImageFromUrl(DEFAULT_WATERMARK_PATH);
      setWatermark(image, "default");
      return true;
    } catch (error) {
      setWatermarkMissing();
      return false;
    }
  }

  async function loadUploadedWatermark(file) {
    if (!file || file.type !== "image/png") {
      throw new Error("请上传 PNG 水印文件。");
    }

    const objectUrl = URL.createObjectURL(file);

    try {
      const image = await loadImageFromUrl(objectUrl);
      setWatermark(image, "upload", file, objectUrl);
      return image;
    } catch (error) {
      URL.revokeObjectURL(objectUrl);
      throw new Error("水印图片加载失败，请确认文件是有效 PNG。");
    }
  }

  window.WatermarkStudio.watermarkImage = {
    loadImageFromUrl,
    loadDefaultWatermark,
    loadUploadedWatermark
  };
})();
