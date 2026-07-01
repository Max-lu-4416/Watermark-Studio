# Watermark Studio

언어: [English](README.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | **한국어** | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md)

Watermark Studio는 사진에 PNG 워터마크와 텍스트 워터마크를 일괄 적용할 수 있는 순수 프론트엔드 로컬 이미지 워터마크 도구입니다. 모든 이미지 처리는 브라우저에서 로컬로 이루어지며, 백엔드 서비스가 필요하지 않고 이미지가 업로드되지 않습니다.

## 온라인 데모

[Watermark Studio 열기](https://max-lu-4416.github.io/Watermark-Studio/)

```text
https://max-lu-4416.github.io/Watermark-Studio/
```

## 기능

- JPG, PNG, WEBP 이미지 일괄 가져오기.
- 고해상도 이미지를 여러 장 가져올 때 처리된 이미지부터 순차적으로 표시.
- 압축된 미리보기 이미지와 썸네일로 큰 이미지 작업 시 지연 감소.
- 1:1 정사각형 썸네일, 스크롤, 다중 선택, Shift 범위 선택, 전체 선택, 선택 해제, 일괄 삭제 지원.
- 기본 PNG 워터마크 로드 및 사용자 지정 투명 PNG 워터마크 업로드 지원.
- 텍스트 워터마크는 색상, 글꼴, 굵기, 이탤릭, 그림자 / 외곽선 설정 가능.
- PNG 워터마크와 텍스트 워터마크를 함께 표시 가능.
- 가로, 세로, PNG만, 텍스트만 네 가지 배치 방식 지원.
- 워터마크 크기, 불투명도, 백분율 여백, 반전, 9점 앵커 위치 조정 가능.
- 그래픽 9점 위치 선택기.
- 미리보기와 내보내기는 동일한 Canvas 렌더링 로직 사용.
- 현재 이미지 또는 전체 이미지를 JPG, PNG, WEBP로 내보내기.
- 품질, 긴 변 해상도, 파일명 접두사 / 접미사, 색 공간 설정 가능.
- 개별 파일 또는 ZIP 패키지로 내보내기.
- 일괄 내보내기 진행률 표시 및 실패한 이미지 이름 안내.
- 다크 / 라이트 테마 지원.

## 사용 방법

1. 온라인 데모 또는 로컬 `index.html`을 엽니다.
2. 왼쪽 사진 목록에서 `+`를 클릭하고 이미지를 하나 이상 선택합니다.
3. 기본 PNG 워터마크를 사용하거나 투명 PNG 워터마크를 업로드합니다.
4. 필요한 경우 텍스트 워터마크를 입력하고 스타일을 설정합니다.
5. 크기, 불투명도, 여백, 반전, 배치 방식, 앵커 위치를 조정합니다.
6. 내보내기 형식, 품질, 긴 변 해상도, 이름 규칙, 색 공간, 범위, 전달 방식을 설정합니다.
7. 내보내기 버튼을 클릭하여 처리된 이미지 또는 ZIP 파일을 다운로드합니다.

## 기본 워터마크

```text
assets/watermarks/watermark.png
```

서명, 사진 로고, 브랜드 워터마크와 같은 투명 배경 PNG 사용을 권장합니다. 기본 워터마크가 없으면 PNG 워터마크 업로드를 안내합니다. 텍스트 워터마크만으로도 내보낼 수 있습니다.

## 로컬 실행

`index.html`을 직접 열거나 로컬 서버를 실행합니다.

```bash
python -m http.server 8080
```

그 다음 아래 주소를 엽니다.

```text
http://localhost:8080
```

## 프로젝트 구조

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

## 주요 파일

- `index.html`: 페이지 구조와 폼 컨트롤.
- `styles.css`: 테마, 레이아웃, 썸네일, 폼, 버튼, 포커스 스타일.
- `js/state.js`: 이미지, 워터마크, 텍스트 워터마크, 선택 상태, 내보내기 설정.
- `js/ui.js`: 가져오기, 썸네일, 다중 선택, 컨트롤 바인딩, 내보내기 진행률, UI 갱신.
- `js/canvas-renderer.js`: 미리보기 렌더링, 워터마크 레이아웃, PNG / 텍스트 합성.
- `js/watermark-image.js`: 기본 워터마크 로드와 사용자 지정 PNG 워터마크 업로드.
- `js/export.js`: 원본 이미지 로드, 내보내기 크기, 파일명, 저장, ZIP 패키징.
- `tests/watermark-layout.test.js`: 9점 위치와 극단 설정에 대한 레이아웃 테스트.

## 개발 확인

```bash
node --check js/state.js
node --check js/ui.js
node --check js/canvas-renderer.js
node --check js/export.js
node tests/watermark-layout.test.js
```

## 개인정보 보호

Watermark Studio에는 서버 측 업로드 흐름이 없습니다. 가져온 이미지는 브라우저에서 로컬로만 처리되며 GitHub나 다른 서버로 업로드되지 않습니다.
