# Watermark Studio

语言：[English](README.md) | **简体中文** | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md)

一个纯前端、本地运行的图片水印工具，用于给摄影作品批量添加 PNG 水印和文本水印。图片处理全部在浏览器本地完成，不需要后端服务，也不会上传你的图片。

## 在线使用

[打开 Watermark Studio](https://max-lu-4416.github.io/Watermark-Studio/)

```text
https://max-lu-4416.github.io/Watermark-Studio/
```

## 功能特点

- 支持批量导入 JPG、PNG、WEBP 图片。
- 多张高像素图片导入时逐张显示，处理完一张就立即出现在缩略图和预览区。
- 使用压缩预览图和缩略图降低大图导入后的卡顿。
- 1:1 正方形缩略图，支持滚动、多选、Shift 范围选择、全选、取消选择和批量删除。
- 支持默认 PNG 水印和自定义透明 PNG 水印。
- 支持文本水印，可设置颜色、字体、字重、斜体和阴影 / 描边。
- PNG 水印和文本水印可以组合显示。
- 支持横排、竖排、仅 PNG、仅文本四种水印排列方式。
- 支持调整水印大小、透明度、百分比边距、反色和九宫格位置。
- 图形化九宫格定位，预览和导出共用同一套 Canvas 绘制逻辑。
- 支持导出当前图片或全部图片，格式包括 JPG、PNG、WEBP。
- 支持设置质量、长边分辨率、文件名前后缀和色彩空间。
- 支持单张文件导出或 ZIP 打包导出。
- 批量导出时显示进度，失败时提示具体图片名称。
- 支持深色 / 浅色主题。

## 使用方式

1. 打开在线网站或本地 `index.html`。
2. 在左侧照片列表点击 `+`，选择一张或多张图片。
3. 使用默认 PNG 水印，或上传自己的透明 PNG 水印。
4. 可选：输入文本水印并设置样式。
5. 调整大小、透明度、边距、反色、排列方式和锚点位置。
6. 设置导出格式、质量、长边分辨率、命名规则、色彩空间、导出范围和导出方式。
7. 点击导出按钮，下载处理后的图片或 ZIP 包。

## 默认水印

```text
assets/watermarks/watermark.png
```

建议使用透明背景 PNG，例如个人签名、摄影 Logo 或品牌水印。如果默认水印不存在，页面会提示上传 PNG 水印；也可以只使用文本水印导出。

## 本地运行

可以直接打开 `index.html`，也可以启动本地服务器：

```bash
python -m http.server 8080
```

然后打开：

```text
http://localhost:8080
```

## 项目结构

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

## 主要文件说明

- `index.html`：页面结构和表单控件。
- `styles.css`：主题、布局、缩略图、表单、按钮和焦点样式。
- `js/state.js`：图片、水印、文本水印、选择状态和导出设置。
- `js/ui.js`：导入、缩略图、多选、控件绑定、导出进度和界面刷新。
- `js/canvas-renderer.js`：预览绘制、水印布局和 PNG / 文本叠加。
- `js/watermark-image.js`：默认水印加载和自定义 PNG 水印上传。
- `js/export.js`：原图加载、导出尺寸、文件命名、保存和 ZIP 打包。
- `tests/watermark-layout.test.js`：九宫格位置和极端参数的布局测试。

## 开发检查

```bash
node --check js/state.js
node --check js/ui.js
node --check js/canvas-renderer.js
node --check js/export.js
node tests/watermark-layout.test.js
```

## 隐私说明

Watermark Studio 没有服务器端上传逻辑。你导入的图片只会在浏览器本地处理，不会上传到 GitHub 或其他服务器。
