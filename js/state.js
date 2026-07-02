(function () {
  const DEFAULT_WATERMARK_PATH = "assets/watermarks/watermark.png";

  const state = {
    photos: [],
    selectedPhotoIndex: -1,
    selectedPhotoIndices: [],
    selectionAnchorIndex: -1,
    photo: emptyPhoto(),
    watermark: {
      file: null,
      image: null,
      objectUrl: "",
      source: "",
      status: "loading",
      message: "正在加载默认水印..."
    },
    textWatermark: {
      enabled: false,
      text: "",
      color: "#ffffff"
    },
    settings: {
      sizePercent: 15,
      opacity: 1,
      position: "bottom-center",
      margin: 6,
      watermarkLayout: "horizontal",
      invertWatermark: false,
      exportQuality: 0.95,
      exportScope: "all",
      exportDelivery: "zip",
      outputFormat: "jpeg",
      colorSpace: "srgb",
      filenamePrefix: "",
      filenameSuffix: "_watermarked",
      exportDestinationMode: "picker",
      exportSubfolderEnabled: false,
      exportSubfolderName: "Watermarked",
      existingFileAction: "rename",
      targetFileSizeEnabled: false,
      targetFileSizeKb: 1024,
      resizeWidth: 3000,
      resizeHeight: 3000,
      resizePercent: 100,
      resizeAspectLocked: true,
      metadataMode: "copyright-contact",
      metadataAuthor: "",
      metadataCopyright: "",
      metadataContact: "",
      outputSharpening: "none",
      theme: "dark"
    }
  };

  function emptyPhoto() {
    return {
      file: null,
      image: null,
      objectUrl: "",
      previewUrl: "",
      thumbnailUrl: "",
      name: "",
      width: 0,
      height: 0
    };
  }

  function revokePhotoUrls(photo) {
    ["objectUrl", "previewUrl", "thumbnailUrl"].forEach((key) => {
      if (photo[key]) {
        URL.revokeObjectURL(photo[key]);
      }
    });

    if (photo.image && typeof photo.image.close === "function") {
      photo.image.close();
    }
  }

  function setActivePhoto(index) {
    if (index < 0 || index >= state.photos.length) {
      state.selectedPhotoIndex = -1;
      state.photo = emptyPhoto();
      return;
    }

    state.selectedPhotoIndex = index;
    state.photo = state.photos[index];
  }

  function normalizeSelection() {
    const unique = Array.from(new Set(state.selectedPhotoIndices))
      .filter((index) => index >= 0 && index < state.photos.length)
      .sort((a, b) => a - b);
    state.selectedPhotoIndices = unique;

    if (!unique.includes(state.selectedPhotoIndex)) {
      setActivePhoto(unique.length > 0 ? unique[unique.length - 1] : -1);
    }
  }

  function clearPhotos() {
    state.photos.forEach((photo) => {
      revokePhotoUrls(photo);
    });

    state.photos = [];
    state.selectedPhotoIndices = [];
    state.selectionAnchorIndex = -1;
    setActivePhoto(-1);
  }

  function appendPhotos(photos) {
    const firstNewIndex = state.photos.length;
    state.photos = state.photos.concat(photos);

    if (photos.length > 0) {
      selectSinglePhoto(firstNewIndex);
    } else {
      normalizeSelection();
    }
  }

  function selectSinglePhoto(index) {
    if (index < 0 || index >= state.photos.length) {
      state.selectedPhotoIndices = [];
      state.selectionAnchorIndex = -1;
      setActivePhoto(-1);
      return;
    }

    state.selectedPhotoIndices = [index];
    state.selectionAnchorIndex = index;
    setActivePhoto(index);
  }

  function previewPhoto(index) {
    if (index < 0 || index >= state.photos.length) {
      return;
    }

    setActivePhoto(index);
  }

  function clearPhotoSelection() {
    state.selectedPhotoIndices = [];
    state.selectionAnchorIndex = -1;
  }

  function selectAllPhotos() {
    state.selectedPhotoIndices = state.photos.map((photo, index) => index);
    state.selectionAnchorIndex = state.selectedPhotoIndex >= 0 ? state.selectedPhotoIndex : 0;
    normalizeSelection();
  }

  function togglePhotoSelection(index) {
    if (index < 0 || index >= state.photos.length) {
      return;
    }

    const selected = new Set(state.selectedPhotoIndices);
    if (selected.has(index) && selected.size > 1) {
      selected.delete(index);
    } else {
      selected.add(index);
      setActivePhoto(index);
    }

    state.selectedPhotoIndices = Array.from(selected).sort((a, b) => a - b);
    state.selectionAnchorIndex = index;
    normalizeSelection();
  }

  function selectPhotoRange(index) {
    if (index < 0 || index >= state.photos.length) {
      return;
    }

    const anchor = state.selectionAnchorIndex >= 0 ? state.selectionAnchorIndex : state.selectedPhotoIndex;
    const start = Math.min(anchor, index);
    const end = Math.max(anchor, index);
    state.selectedPhotoIndices = [];

    for (let i = start; i <= end; i += 1) {
      state.selectedPhotoIndices.push(i);
    }

    setActivePhoto(index);
  }

  function deleteSelectedPhotos() {
    if (state.photos.length === 0) {
      return 0;
    }

    const selected = new Set(state.selectedPhotoIndices.length > 0 ? state.selectedPhotoIndices : [state.selectedPhotoIndex]);
    const previousActive = state.selectedPhotoIndex;
    const nextPhotos = [];
    let deletedCount = 0;

    state.photos.forEach((photo, index) => {
      if (selected.has(index)) {
        deletedCount += 1;
        revokePhotoUrls(photo);
      } else {
        nextPhotos.push(photo);
      }
    });

    state.photos = nextPhotos;

    if (state.photos.length === 0) {
      selectSinglePhoto(-1);
      return deletedCount;
    }

    const nextIndex = Math.min(previousActive, state.photos.length - 1);
    selectSinglePhoto(nextIndex);
    return deletedCount;
  }

  function setWatermark(image, source, file = null, objectUrl = "") {
    if (state.watermark.objectUrl && state.watermark.objectUrl !== objectUrl) {
      URL.revokeObjectURL(state.watermark.objectUrl);
    }

    state.watermark = {
      file,
      image,
      objectUrl,
      source,
      status: "ready",
      message: source === "default" ? "已加载默认水印。" : "已加载上传的 PNG 水印。"
    };
  }

  function setWatermarkMissing() {
    if (state.watermark.objectUrl) {
      URL.revokeObjectURL(state.watermark.objectUrl);
    }

    state.watermark = {
      file: null,
      image: null,
      objectUrl: "",
      source: "",
      status: "missing",
      message: "未找到默认水印，请上传 PNG 水印，或将 watermark.png 放到 assets/watermarks/ 目录。"
    };
  }

  function updateWatermarkSettings(nextSettings) {
    state.settings = {
      ...state.settings,
      ...nextSettings
    };
  }

  function updateTextWatermark(nextTextWatermark) {
    state.textWatermark = {
      ...state.textWatermark,
      ...nextTextWatermark
    };
  }

  window.WatermarkStudio = window.WatermarkStudio || {};
  window.WatermarkStudio.stateModule = {
    DEFAULT_WATERMARK_PATH,
    state,
    clearPhotos,
    clearPhotoSelection,
    selectAllPhotos,
    appendPhotos,
    previewPhoto,
    selectSinglePhoto,
    togglePhotoSelection,
    selectPhotoRange,
    deleteSelectedPhotos,
    setWatermark,
    setWatermarkMissing,
    updateTextWatermark,
    updateWatermarkSettings
  };
})();
