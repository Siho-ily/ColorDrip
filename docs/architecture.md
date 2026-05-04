# ColorDrip — 아키텍처

## 디렉토리 구조

```
ColorDrip/
├── index.html
├── package.json
├── vite.config.js
├── CLAUDE.md
│
├── styles/
│   ├── reset.css          ← Meyer reset (수정 금지)
│   └── global.css         ← 폰트, html/body, #App 레이아웃
│
└── scripts/
    ├── main.js            ← 진입점, App 마운트
    ├── app.js             ← 루트 컴포넌트, 자식 조립
    └── components/
        ├── global/        ← 앱 전역 공유 요소
        │   ├── ui/        ← 가장 작은 재사용 시각 요소
        │   └── layout/    ← TopBar, BottomBar
        ├── canvas/        ← 메인 캔버스 도메인
        │   ├── ui/        ← Drop, Blob (개별 시각 요소)
        │   ├── layout/    ← Canvas, RainLayer, BlobLayer
        │   └── feature/   ← ColorWheelPicker
        ├── palette/       ← 팔레트 도메인
        │   ├── ui/        ← PaletteSlot, ColorSwatch
        │   ├── layout/    ← PaletteSidebar, PresetTabs
        │   └── feature/   ← ExportActions
        └── settings/      ← 설정 도메인
            ├── ui/        ← Toggle, Slider
            ├── layout/    ← SettingsPanel
            └── feature/
```

## 컴포넌트 폴더 규칙

각 컴포넌트는 자신의 폴더를 갖고, JS와 CSS를 같은 위치에 둔다.

```
TopBar/
├── TopBar.js
└── TopBar.css
```

## 컴포넌트 레이어 분류

| 레이어 | 정의 | 예시 |
|--------|------|------|
| **ui** | 가장 작은 시각 단위. 로직 없음, 시각만. | IconButton, ColorSwatch, Slider |
| **layout** | ui를 조합한 구조적 컨테이너. 배치/구조적 의미만. | TopBar, Canvas, PaletteSidebar |
| **feature** | ui/layout + 도메인 로직 (이벤트, 계산, 상태). | ColorWheelPicker, ExportActions |

## 도메인 분류

| 도메인 | 담당 범위 |
|--------|----------|
| **global** | 앱 전역에서 재사용되는 요소. 도메인 의존성 없음. |
| **canvas** | 빗방울 낙하, blob floating, 물리 엔진 연동 |
| **palette** | 색상 저장/불러오기, 프리셋, 내보내기 |
| **settings** | 색공간, 혼합 방식, Rain 파라미터 설정 |

