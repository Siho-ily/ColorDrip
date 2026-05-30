/**
 * 인라인 스타일을 적용한 DOM 요소를 한 줄로 만든다.
 *
 * document.createElement + Object.assign(style, ...)를 매번 쓰는 대신
 * el('div', { display: 'flex' }) 처럼 호출한다.
 *
 * 제네릭 K 덕분에 반환 타입이 태그에 맞게 좁혀진다.
 * 예) el('input', {}) 의 반환 타입은 HTMLInputElement.
 */
export function el<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    styles: Partial<CSSStyleDeclaration>,
): HTMLElementTagNameMap[K] {
    const node = document.createElement(tag);
    Object.assign(node.style, styles);
    return node;
}
