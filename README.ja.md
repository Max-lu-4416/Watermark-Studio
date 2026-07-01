# Watermark Studio

言語：[English](README.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | **日本語** | [한국어](README.ko.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md)

Watermark Studio は、写真に PNG 透かしとテキスト透かしを一括追加できる、フロントエンドのみで動作するローカル画像透かしツールです。画像処理はすべてブラウザ内で行われ、バックエンドサービスは不要です。画像がアップロードされることもありません。

## オンラインデモ

[Watermark Studio を開く](https://max-lu-4416.github.io/Watermark-Studio/)

```text
https://max-lu-4416.github.io/Watermark-Studio/
```

## 機能

- JPG、PNG、WEBP 画像の一括インポート。
- 高解像度画像を複数読み込む場合でも、処理が終わった画像から順に表示。
- 圧縮プレビュー画像とサムネイルにより、大きな画像でも操作を軽く保ちます。
- 1:1 の正方形サムネイル、スクロール、複数選択、Shift 範囲選択、全選択、選択解除、一括削除に対応。
- デフォルト PNG 透かしの読み込みと、透明 PNG 透かしのアップロードに対応。
- テキスト透かしは色、フォント、太さ、斜体、影 / アウトラインを設定可能。
- PNG 透かしとテキスト透かしを組み合わせて表示可能。
- 横並び、縦並び、PNG のみ、テキストのみの 4 種類の配置。
- 透かしサイズ、不透明度、パーセント余白、反転、9 点アンカー位置を調整可能。
- グラフィカルな 9 点位置ピッカー。
- プレビューとエクスポートは同じ Canvas 描画ロジックを使用。
- 現在の画像またはすべての画像を JPG、PNG、WEBP でエクスポート。
- 品質、長辺解像度、ファイル名の接頭辞 / 接尾辞、色空間を設定可能。
- 個別ファイルまたは ZIP パッケージで出力。
- 一括エクスポート中は進捗を表示し、失敗時は対象画像名を表示。
- ダーク / ライトテーマに対応。

## 使い方

1. オンラインデモ、またはローカルの `index.html` を開きます。
2. 左側の写真リストで `+` をクリックし、画像を 1 枚以上選択します。
3. デフォルト PNG 透かしを使うか、透明 PNG 透かしをアップロードします。
4. 必要に応じてテキスト透かしを入力し、スタイルを設定します。
5. サイズ、不透明度、余白、反転、配置、アンカー位置を調整します。
6. 出力形式、品質、長辺解像度、命名規則、色空間、範囲、出力方法を設定します。
7. エクスポートボタンをクリックし、処理済み画像または ZIP をダウンロードします。

## デフォルト透かし

```text
assets/watermarks/watermark.png
```

署名、写真ロゴ、ブランド透かしなど、透明背景の PNG を推奨します。デフォルト透かしが存在しない場合は、PNG 透かしのアップロードを求められます。テキスト透かしのみで出力することもできます。

## ローカル実行

`index.html` を直接開くか、ローカルサーバーを起動します。

```bash
python -m http.server 8080
```

その後、以下を開きます。

```text
http://localhost:8080
```

## プロジェクト構成

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

## 主なファイル

- `index.html`: ページ構造とフォームコントロール。
- `styles.css`: テーマ、レイアウト、サムネイル、フォーム、ボタン、フォーカススタイル。
- `js/state.js`: 画像、透かし、テキスト透かし、選択状態、エクスポート設定。
- `js/ui.js`: インポート、サムネイル、複数選択、コントロール連携、進捗表示、UI 更新。
- `js/canvas-renderer.js`: プレビュー描画、透かしレイアウト、PNG / テキスト合成。
- `js/watermark-image.js`: デフォルト透かし読み込みとカスタム PNG 透かしアップロード。
- `js/export.js`: 元画像読み込み、出力サイズ、ファイル名、保存、ZIP 作成。
- `tests/watermark-layout.test.js`: 9 点位置と極端な設定でのレイアウトテスト。

## 開発チェック

```bash
node --check js/state.js
node --check js/ui.js
node --check js/canvas-renderer.js
node --check js/export.js
node tests/watermark-layout.test.js
```

## プライバシー

Watermark Studio にはサーバー側のアップロード処理がありません。インポートした画像はブラウザ内でのみ処理され、GitHub や他のサーバーへアップロードされません。
