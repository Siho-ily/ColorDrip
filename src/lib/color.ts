import chroma from 'chroma-js';
import type { HslColor } from '@/types/bubble';
import type { ColorSpace } from '@/types/settings';

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
 * 두 색상을 지정한 색 공간에서 혼합한다.
 *
 * @param c1        첫 번째 색상 (ratio = 0 이면 이 색만 나옴)
 * @param c2        두 번째 색상 (ratio = 1 이면 이 색만 나옴)
 * @param colorSpace 혼합에 사용할 색 공간 — settings.colorSpace 값을 그대로 넘긴다
 * @param ratio     혼합 비율. 0.5(기본값)이면 정중간
 * @returns         혼합 결과를 HslColor로 반환
 *
 * 결과를 HslColor로 돌려주는 이유:
 * 내부 상태와 ColorWheelPicker 모두 HSL 기준이라 별도 변환 없이 바로 쓸 수 있다.
 */
export function mixColors(
    c1: HslColor,
    c2: HslColor,
    colorSpace: ColorSpace,
    ratio = 0.5,
): HslColor {
    const [h, s, l] = chroma
        .mix(hslToChroma(c1), hslToChroma(c2), ratio, colorSpace)
        .hsl();

    // 무채색(흰색·검정·회색)은 hue가 수학적으로 정의되지 않아 NaN이 된다.
    // 0으로 대체해 HslColor 타입 제약(number)을 만족시킨다.
    return { h: h ?? 0, s: s * 100, l: l * 100 };
}
