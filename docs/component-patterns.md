# ColorDrip — 컴포넌트 작성 패턴

## 기본 시그니처

모든 컴포넌트는 `$target` DOM 엘리먼트를 받아 자식을 삽입하고, 루트 엘리먼트를 반환한다.

```js
export const ComponentName = ($target) => {
    const $el = document.createElement("tag");
    // ...
    $target.appendChild($el);
    return $el;
};
```

---

## ui 레이어 예시

로직 없음. props를 받아 시각만 렌더링.

```js
// IconButton.js
import "./IconButton.css";

export const IconButton = ($target, { icon, onClick }) => {
    const $btn = document.createElement("button");
    $btn.className = "icon-button";
    $btn.textContent = icon;
    $btn.addEventListener("click", onClick);
    $target.appendChild($btn);
    return $btn;
};
```

```css
/* IconButton.css — Tailwind 유틸로 충분하지 않을 때만 작성 */
.icon-button {
    /* ... */
}
```

shadcn/ui 프리미티브(Button 등)는 JSX 컴포넌트로 `@/components/global/ui/`에 위치한다. 바닐라 JS 컴포넌트에서 shadcn 버튼의 클래스만 빌려 쓸 수 있다:

```js
import { buttonVariants } from "@/components/global/ui/button.jsx";

const $btn = document.createElement("button");
$btn.className = buttonVariants({ variant: "outline" });
```

---

## layout 레이어 예시

ui 컴포넌트를 조합해 구조적 배치. 도메인 로직 없음.

```js
// TopBar.js
import "./TopBar.css";
import { IconButton } from "@/components/global/ui/IconButton/IconButton.js";

export const TopBar = ($target) => {
    const $el = document.createElement("header");
    $el.className = "top-bar";

    IconButton($el, { icon: "⚙", onClick: () => {} });

    $target.appendChild($el);
    return $el;
};
```

---

## feature 레이어 예시

ui/layout에 도메인 로직(이벤트 처리, 색상 계산 등)을 결합.

```js
// ColorWheelPicker.js
import "./ColorWheelPicker.css";
import chroma from "chroma-js";

export const ColorWheelPicker = ($target, { onPick }) => {
    const $el = document.createElement("div");
    $el.className = "color-wheel-picker";

    // 색상 선택 로직 ...
    const handleSelect = (hue) => {
        const color = chroma.hsl(hue, 1, 0.5).hex();
        onPick(color);
    };

    $target.appendChild($el);
    return $el;
};
```

---

## CSS import

Vite 환경에서 CSS는 JS에서 직접 import 가능.

```js
import "./TopBar.css";  // 첫 줄에 선언
```

컴포넌트별 CSS는 해당 컴포넌트 폴더 안에만 작성.
전역 스타일(폰트, 색상 토큰, 레이아웃 기준)은 `src/app/globals.css`.

---

## 앱 조립 패턴 (app.js)

```js
// app.js
// CSS는 main.js에서 import됨 — app.js에서 다시 import 불필요
import { TopBar } from "@/components/global/layout/TopBar/TopBar.js";
import { Canvas } from "@/components/canvas/layout/Canvas/Canvas.js";
import { BottomBar } from "@/components/global/layout/BottomBar/BottomBar.js";
import { PaletteSidebar } from "@/components/palette/layout/PaletteSidebar/PaletteSidebar.js";

export const App = ($target) => {
    TopBar($target);
    Canvas($target);          // flex: 1, 남은 공간 전부
    BottomBar($target);
    PaletteSidebar($target);  // position: absolute overlay
};
```
