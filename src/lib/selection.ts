/**
 * 다중 선택 목록(id 배열)을 다루는 순수 헬퍼.
 *
 * 버블 선택(number[])과 색상 슬롯 선택(string[])이 똑같은 토글/병합 로직을
 * 쓰고 있어서 제네릭으로 묶었다.
 */

/** additive 토글: 이미 들어 있으면 빼고, 없으면 더한 새 배열을 반환한다. */
export function toggleId<T>(list: T[], id: T): T[] {
    return list.includes(id) ? list.filter(x => x !== id) : [...list, id];
}

/** 기존 목록에 새 id들을 합치되 중복을 제거한 새 배열을 반환한다. */
export function mergeIds<T>(list: T[], ids: T[]): T[] {
    return Array.from(new Set([...list, ...ids]));
}
