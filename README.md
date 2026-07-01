# Watermark Studio

Watermark Studio 是一个纯前端、本地运行的图片水印工具。它使用 HTML、CSS、JavaScript 和 Canvas 在浏览器里完成图片预览、水印叠加和导出，不需要后端服务，也不会上传你的图片。

## 功能特性

- 批量导入 JPG、PNG、WEBP 图片。
- 缩略图列表支持追加导入、单选、Ctrl / Cmd 多选、Shift 连选。
- 支持删除当前选中的一张或多张图片。
- 自动加载默认水印：`assets/watermarks/watermark.png`。
- 支持上传自定义透明 PNG 水印。
- 可调整水印大小、透明度、边距、反色和九宫格位置。
- Canvas 实时预览，导出时按原图重新绘制。
- 可设置 JPG 导出质量和长边分辨率。
- 支持导出当前图片，或将全部图片打包为一个 ZIP 下载。
- 支持深色和浅色主题。

## 快速开始

直接用浏览器打开：

```text
index.html
```

也可以用静态服务器运行。进入项目目录后执行：

```bash
python -m http.server 8080
```

然后访问：

```text
http://localhost:8080
```

## 使用方法

1. 点击左侧缩略图区域的 `+`，选择一张或多张图片。
2. 等待默认水印加载，或点击“上传 PNG 水印”选择自己的水印文件。
3. 在右侧调整水印大小、透明度、边距、位置和反色。
4. 在“导出设置”中选择 JPG 质量、长边分辨率和导出范围。
5. 点击“导出 JPG”。

导出当前图片时，会直接下载一张 JPG。导出全部图片时，会生成一个 ZIP，里面包含每张图片对应的 `原文件名_watermarked.jpg`。

## 默认水印

默认水印文件路径是：

```text
assets/watermarks/watermark.png
```

建议使用透明背景 PNG。若默认水印不存在，页面会提示上传 PNG 水印，或者把 `watermark.png` 放回该目录。

## 图片选择

- 单击缩略图：选中并预览该图片。
- Ctrl / Cmd 单击缩略图：追加选择或取消选择。
- Shift 单击缩略图：从上次选中位置到当前图片连续选择。
- 点击预览区右下角“删除选中”：删除当前选中的图片。

再次导入图片会追加到现有列表，并自动切换到第一张新导入图片。

## 导出说明

- 导出格式固定为 JPG。
- 导出时会先铺白底，再绘制原图和 PNG 水印。
- “长边分辨率”控制导出图片最长边的像素值，短边按比例缩放。
- 水印大小和边距会根据输出画布自动限制，避免小尺寸导出时水印跑出画布。
- 批量导出使用单个 ZIP，减少浏览器拦截多文件下载的概率。

## 项目结构

```text
Watermark-Studio/
├─ index.html
├─ styles.css
├─ README.md
├─ assets/
│  └─ watermarks/
│     └─ watermark.png
└─ js/
   ├─ main.js
   ├─ state.js
   ├─ ui.js
   ├─ canvas-renderer.js
   ├─ watermark-image.js
   └─ export.js
```

## 技术说明

- `state.js` 管理图片、水印和参数状态。
- `ui.js` 负责界面事件、缩略图、提示信息和控件同步。
- `canvas-renderer.js` 负责预览和导出时的水印绘制。
- `watermark-image.js` 负责加载默认水印和上传水印。
- `export.js` 负责生成 JPG、触发下载，并在批量导出时生成 ZIP。

## 隐私

所有图片处理都发生在本地浏览器中。项目没有网络上传逻辑，也没有服务器端存储逻辑。
