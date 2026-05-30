import type { Preset, PresetColor } from '@/types/palette';

/**
 * 프리셋 배열을 "불변" 방식으로 갱신하는 순수 함수 모음.
 *
 * App의 여러 메서드가 `presets.map(p => p.id !== id ? p : { ...p, ... })`
 * 같은 패턴을 반복하던 것을 한 곳으로 모았다. 상태(setState)는 호출 측이 맡고,
 * 여기서는 새 Preset[] 계산만 책임진다(부작용 없음).
 */

/** 지정한 id의 프리셋만 fn 결과로 교체한 새 배열을 반환한다. 나머지는 그대로 둔다. */
export function updatePreset(
    presets: Preset[],
    presetId: string,
    fn: (preset: Preset) => Preset,
): Preset[] {
    return presets.map(p => (p.id === presetId ? fn(p) : p));
}

/** 지정한 프리셋의 colors 배열만 fn으로 변환한 새 배열을 반환한다. */
export function updatePresetColors(
    presets: Preset[],
    presetId: string,
    fn: (colors: PresetColor[]) => PresetColor[],
): Preset[] {
    return updatePreset(presets, presetId, p => ({ ...p, colors: fn(p.colors) }));
}

/**
 * fromId 프리셋에서 ids에 해당하는 색을 빼서 toId 프리셋 끝에 붙인다.
 * 단일 색 이동과 그룹 이동이 같은 로직을 공유한다.
 * from===to거나 옮길 색이 없으면 원본을 그대로 반환한다.
 */
export function moveColors(
    presets: Preset[],
    fromId: string,
    toId: string,
    ids: string[],
): Preset[] {
    if (fromId === toId || ids.length === 0) return presets;
    const idSet = new Set(ids);
    let moved: PresetColor[] = [];
    return presets
        .map(p => {
            if (p.id !== fromId) return p;
            moved = p.colors.filter(c => idSet.has(c.id));
            return { ...p, colors: p.colors.filter(c => !idSet.has(c.id)) };
        })
        .map(p => {
            if (p.id !== toId || moved.length === 0) return p;
            return { ...p, colors: [...p.colors, ...moved] };
        });
}
