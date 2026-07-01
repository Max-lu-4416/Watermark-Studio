# Watermark Studio

一个纯前端、本地运行的图片水印工具，用于给摄影作品批量添加 PNG 水印和文本水印。图片处理全部在浏览器本地完成，不需要后端服务，也不会上传你的图片。

## 在线使用

[打开 Watermark Studio](https://max-lu-4416.github.io/Watermark-Studio/)

也可以复制下面的地址到浏览器打开：

```text
https://max-lu-4416.github.io/Watermark-Studio/
```

## 功能特点

- 支持批量导入 JPG、PNG、WEBP 图片。
- 多张高像素图片导入时逐张显示，第一张处理完成后就会出现在缩略图和预览区。
- 使用压缩预览图和缩略图降低大图导入后的卡顿。
- 左侧照片列表使用 1:1 正方形缩略图，支持滚动浏览。
- 支持缩略图单选、多选、Shift 范围选择、全选、取消选择和批量删除。
- 支持自动加载默认 PNG 水印，也可以上传自定义透明 PNG 水印。
- 支持文本水印，可设置文字内容、颜色、字体、字重、斜体和阴影 / 描边。
- PNG 水印和文本水印可以叠加显示。
- 支持 PNG + 文本横排、竖排、仅 PNG、仅文本四种排列方式。
- 支持调整水印大小、透明度、百分比边距、反色和九宫格位置。
- 支持图形化九宫格定位，预览和导出共用同一套 Canvas 绘制逻辑。
- 支持导出当前图片或全部图片。
- 支持 JPG、PNG、WEBP 导出格式。
- 支持设置 JPG / WEBP 质量、长边分辨率、文件名前缀、文件名后缀和色彩空间。
- 支持单张文件导出或 ZIP 打包导出。
- 批量导出时显示处理进度，例如 `正在导出 3/25`，失败时会提示具体图片名称。
- 在支持 File System Access API 的浏览器中可以选择保存位置；不支持时会回退到浏览器下载。
- 支持深色 / 浅色主题，主题切换按钮位于标题旁边。

## 使用方式

1. 打开在线网站或本地 `index.html`。
2. 在左侧“照片列表”中点击 `+`，选择一张或多张图片。
3. 在“水印内容”中使用默认 PNG 水印，或上传自己的透明 PNG 水印。
4. 如果需要文本水印，输入文字并设置颜色、字体、字重、斜体和文字效果。
5. 在右侧“水印样式”中调整水印大小、透明度、边距、反色和 PNG / 文本排列方式。
6. 在“锚点位置”中选择水印出现的位置。
7. 在“导出”中设置保存格式、质量、长边分辨率、命名规则、色彩空间、导出范围和导出方式。
8. 点击导出按钮，下载处理后的图片或 ZIP 包。

## 默认水印

默认水印文件路径：

```text
assets/watermarks/watermark.png
```

建议使用透明背景 PNG，例如个人签名、摄影 Logo 或品牌水印。如果默认水印不存在，页面会提示上传 PNG 水印；也可以只使用文本水印导出。

## 本地运行

### 直接打开

下载项目后，双击打开：

```text
index.html
```

### 使用本地服务器

进入项目目录后执行：

```bash
python -m http.server 8080
```

然后在浏览器打开：

```text
http://localhost:8080
```

## 项目结构

```text
Watermark-Studio/
├── index.html
├── styles.css
├── README.md
├── assets/
│   └── watermarks/
│       └── watermark.png
├── js/
│   ├── main.js
│   ├── state.js
│   ├── ui.js
│   ├── canvas-renderer.js
│   ├── watermark-image.js
│   └── export.js
└── tests/
    └── watermark-layout.test.js
```

## 主要文件说明

- `index.html`：页面结构和表单控件。
- `styles.css`：深色 / 浅色主题、布局、缩略图、表单、按钮和焦点样式。
- `js/state.js`：管理图片、水印、文本水印、选择状态和导出参数。
- `js/ui.js`：负责导入、缩略图、多选、控件绑定、导出进度和界面刷新。
- `js/canvas-renderer.js`：负责预览绘制、水印布局和 PNG / 文本叠加。
- `js/watermark-image.js`：负责默认水印加载和自定义 PNG 水印上传。
- `js/export.js`：负责原图加载、导出尺寸计算、文件命名、保存和 ZIP 打包。
- `tests/watermark-layout.test.js`：验证九宫格位置和极端参数下水印不会越界。

## 开发检查

可以使用下面的命令做基础检查：

```bash
node --check js/state.js
node --check js/ui.js
node --check js/canvas-renderer.js
node --check js/export.js
node tests/watermark-layout.test.js
```

布局测试会覆盖 9 个水印位置、横图 / 竖图、极端大小和边距参数。

## 隐私说明

Watermark Studio 没有服务器端上传逻辑。你导入的图片只会在浏览器本地处理，不会上传到 GitHub 或其他服务器。
