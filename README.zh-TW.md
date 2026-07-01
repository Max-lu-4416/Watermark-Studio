# Watermark Studio

語言：[English](README.md) | [简体中文](README.zh-CN.md) | **繁體中文** | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md)

一個純前端、本機執行的圖片浮水印工具，用於替攝影作品批次加入 PNG 浮水印與文字浮水印。所有圖片處理都在瀏覽器本機完成，不需要後端服務，也不會上傳你的圖片。

## 線上使用

[開啟 Watermark Studio](https://max-lu-4416.github.io/Watermark-Studio/)

```text
https://max-lu-4416.github.io/Watermark-Studio/
```

## 功能特色

- 支援批次匯入 JPG、PNG、WEBP 圖片。
- 匯入多張高解析圖片時逐張顯示，處理完成一張就立即出現在縮圖和預覽區。
- 使用壓縮預覽圖和縮圖，降低大圖匯入後的卡頓。
- 1:1 正方形縮圖，支援捲動、多選、Shift 範圍選取、全選、取消選取和批次刪除。
- 支援預設 PNG 浮水印和自訂透明 PNG 浮水印。
- 支援文字浮水印，可設定顏色、字體、字重、斜體和陰影 / 描邊。
- PNG 浮水印與文字浮水印可以組合顯示。
- 支援橫排、直排、僅 PNG、僅文字四種排列方式。
- 可調整浮水印大小、透明度、百分比邊距、反色和九宮格位置。
- 圖形化九宮格定位，預覽與匯出共用同一套 Canvas 繪製邏輯。
- 支援匯出目前圖片或全部圖片，格式包含 JPG、PNG、WEBP。
- 支援品質、長邊解析度、檔名前後綴與色彩空間設定。
- 支援單張檔案匯出或 ZIP 打包匯出。
- 批次匯出時顯示進度，失敗時提示具體圖片名稱。
- 支援深色 / 淺色主題。

## 使用方式

1. 開啟線上網站或本機 `index.html`。
2. 在左側照片列表點擊 `+`，選擇一張或多張圖片。
3. 使用預設 PNG 浮水印，或上傳自己的透明 PNG 浮水印。
4. 可選：輸入文字浮水印並設定樣式。
5. 調整大小、透明度、邊距、反色、排列方式和錨點位置。
6. 設定匯出格式、品質、長邊解析度、命名規則、色彩空間、匯出範圍和匯出方式。
7. 點擊匯出按鈕，下載處理後的圖片或 ZIP 包。

## 預設浮水印

```text
assets/watermarks/watermark.png
```

建議使用透明背景 PNG，例如個人簽名、攝影 Logo 或品牌浮水印。如果預設浮水印不存在，頁面會提示上傳 PNG 浮水印；也可以只使用文字浮水印匯出。

## 本機執行

可以直接開啟 `index.html`，也可以啟動本機伺服器：

```bash
python -m http.server 8080
```

然後開啟：

```text
http://localhost:8080
```

## 專案結構

```text
Watermark-Studio/
|-- index.html
|-- styles.css
|-- README.md
|-- README.zh-CN.md
|-- README.zh-TW.md
|-- README.ja.md
|-- README.ko.md
|-- README.es.md
|-- README.fr.md
|-- README.de.md
|-- assets/
|   `-- watermarks/
|       `-- watermark.png
|-- js/
|   |-- main.js
|   |-- state.js
|   |-- ui.js
|   |-- canvas-renderer.js
|   |-- watermark-image.js
|   `-- export.js
`-- tests/
    `-- watermark-layout.test.js
```

## 主要檔案

- `index.html`：頁面結構和表單控制項。
- `styles.css`：主題、版面、縮圖、表單、按鈕和焦點樣式。
- `js/state.js`：圖片、浮水印、文字浮水印、選取狀態和匯出設定。
- `js/ui.js`：匯入、縮圖、多選、控制項綁定、匯出進度和介面刷新。
- `js/canvas-renderer.js`：預覽繪製、浮水印布局和 PNG / 文字合成。
- `js/watermark-image.js`：預設浮水印載入和自訂 PNG 浮水印上傳。
- `js/export.js`：原圖載入、匯出尺寸、檔案命名、儲存和 ZIP 打包。
- `tests/watermark-layout.test.js`：九宮格位置和極端參數的布局測試。

## 開發檢查

```bash
node --check js/state.js
node --check js/ui.js
node --check js/canvas-renderer.js
node --check js/export.js
node tests/watermark-layout.test.js
```

## 隱私說明

Watermark Studio 沒有伺服器端上傳流程。你匯入的圖片只會在瀏覽器本機處理，不會上傳到 GitHub 或其他伺服器。
