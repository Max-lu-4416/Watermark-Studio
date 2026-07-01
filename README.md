# Watermark Studio｜摄影图片水印工具

一个纯前端、本地运行的图片水印工具，用来给摄影作品批量添加 PNG 水印。

## 🌐 在线使用

👉 **点击这里打开网站：**  
[https://max-lu-4416.github.io/Watermark-Studio/](https://max-lu-4416.github.io/Watermark-Studio/)

也可以复制下面的网址到浏览器打开：

```text
https://max-lu-4416.github.io/Watermark-Studio/
```

## 项目简介

Watermark Studio 使用 **HTML + CSS + JavaScript + Canvas** 开发。  
图片处理全部在浏览器本地完成，不需要后端服务器，也不会上传你的图片。

它适合用于：

- 给摄影作品添加个人 Logo / 签名水印
- 批量给 JPG、PNG、WEBP 图片加水印
- 快速导出带水印的 JPG 图片
- 作为一个轻量级在线水印工具远程使用

## 功能特性

- 支持批量导入 JPG、PNG、WEBP 图片
- 支持自动加载默认 PNG 水印
- 支持上传自定义透明 PNG 水印
- 支持调整水印大小、透明度、边距和位置
- 支持水印反色
- 支持九宫格水印位置选择
- 支持 Canvas 实时预览
- 支持设置 JPG 导出质量
- 支持设置导出图片长边分辨率
- 支持导出当前图片
- 支持批量导出 ZIP
- 支持深色 / 浅色主题

## 如何使用

1. 打开在线网站：  
   [https://max-lu-4416.github.io/Watermark-Studio/](https://max-lu-4416.github.io/Watermark-Studio/)

2. 点击左侧缩略图区域的 `+`，选择一张或多张图片。

3. 等待默认水印加载，或点击“上传 PNG 水印”选择自己的透明 PNG 水印。

4. 在右侧调整水印参数：
   - 大小
   - 透明度
   - 边距
   - 位置
   - 反色

5. 在导出设置中选择：
   - JPG 质量
   - 长边分辨率
   - 导出当前图片或全部图片

6. 点击“导出 JPG”即可下载带水印的图片。

## 默认水印位置

默认水印文件路径：

```text
assets/watermarks/watermark.png
```

建议使用透明背景 PNG，例如个人签名、摄影 Logo 或品牌水印。

如果默认水印不存在，页面会提示你上传 PNG 水印。

## 本地运行

你也可以把项目下载到本地运行。

### 方法一：直接打开

下载项目后，双击打开：

```text
index.html
```

### 方法二：使用本地服务器

进入项目目录，执行：

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

- `index.html`：页面结构
- `styles.css`：界面样式
- `state.js`：管理图片、水印和参数状态
- `ui.js`：负责按钮、滑块、缩略图和界面交互
- `canvas-renderer.js`：负责图片预览和水印绘制
- `watermark-image.js`：负责默认水印加载和自定义水印上传
- `export.js`：负责导出 JPG 和批量 ZIP

## 隐私说明

本项目没有服务器端上传逻辑。  
你导入的图片只会在浏览器本地处理，不会上传到 GitHub 或其他服务器。

## 在线地址

[点击访问 Watermark Studio](https://max-lu-4416.github.io/Watermark-Studio/)
