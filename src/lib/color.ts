import chroma from 'chroma-js';
import type { HslColor } from '@/types/bubble';
import type { ColorSpace } from '@/types/settings';
import type { PresetColor } from '@/types/palette';

/** mixColors에 넘기는 색상 항목. weight가 클수록 혼합 결과에서 해당 색이 차지하는 비중이 커진다. 생략하면 1. */
export interface ColorEntry {
    color: HslColor;
    weight?: number;
}

/**
 * HslColor → chroma 객체 변환.
 *
 * chroma.hsl()은 s/l을 0–1 범위로 받는다.
 * 우리 내부 표현은 s/l이 0–100이므로 100으로 나눠서 전달한다.
 */
function hslToChroma(c: HslColor) {
    return chroma.hsl(c.h, c.s / 100, c.l / 100);
}

/**
 * 여러 색상을 가중치(weight) 기반으로 혼합한다.
 *
 * @param entries    혼합할 색상 배열. 각 항목에 { color, weight } 지정.
 *                   weight는 비율이므로 합이 1일 필요 없음 — 내부에서 정규화한다.
 *                   예) [{color: red, weight: 2}, {color: blue, weight: 1}]
 *                       → red가 2/3, blue가 1/3 비중으로 혼합
 * @param colorSpace 혼합에 사용할 색 공간 — settings.colorSpace 값을 그대로 넘긴다.
 * @returns          혼합 결과를 HslColor로 반환.
 *
 * 결과를 HslColor로 돌려주는 이유:
 * 내부 상태와 ColorWheelPicker 모두 HSL 기준이라 별도 변환 없이 바로 쓸 수 있다.
 */
export function mixColors(entries: ColorEntry[], colorSpace: ColorSpace): HslColor {
    if (entries.length === 0) return { h: 0, s: 0, l: 0 };
    const colors = entries.map(e => hslToChroma(e.color));
    const weights = entries.map(e => e.weight ?? 1);

    // chroma.average()는 colors 배열과 가중치 배열을 받아 지정한 색 공간에서 평균을 낸다.
    // chroma.mix()와 달리 2개 이상의 색상을 한 번에 처리할 수 있다.
    const [h, s, l] = chroma.average(colors, colorSpace, weights).hsl();

    // 무채색(흰색·검정·회색)은 hue가 수학적으로 정의되지 않아 NaN이 된다.
    // 0으로 대체해 HslColor 타입 제약(number)을 만족시킨다.
    return { h: h ?? 0, s: s * 100, l: l * 100 };
}

export function hslToHex(hsl: HslColor): string {
    return chroma.hsl(hsl.h, hsl.s / 100, hsl.l / 100).hex();
}

export function hslToCss(hsl: HslColor): string {
    return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
}

export function createPresetColor(color: HslColor): PresetColor {
    return { id: crypto.randomUUID(), color, label: null };
}
