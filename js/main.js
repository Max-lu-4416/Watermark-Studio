window.addEventListener("DOMContentLoaded", async () => {
  const { loadDefaultWatermark } = window.WatermarkStudio.watermarkImage;
  const { initUi, updateAfterDefaultWatermarkLoad } = window.WatermarkStudio.ui;

  initUi();
  await loadDefaultWatermark();
  updateAfterDefaultWatermarkLoad();
});
