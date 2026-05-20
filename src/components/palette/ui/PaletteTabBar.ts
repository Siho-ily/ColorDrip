/**
 * 팔레트 사이드바 왼쪽 탭 바.
 *
 * - 프리셋 목록을 탭으로 표시하고 선택/더블클릭 이름 편집/우클릭 메뉴를 처리한다.
 * - 탭을 드래그하면 순서를 바꿀 수 있다. 나머지 탭들은 CSS transition으로 비켜난다.
 * - 탭이 아닌 빈 영역을 드래그하면 스크롤된다.
 */
import type { Preset } from '@/types/palette';
import { hslToCss } from '@/lib/color';
import ContextMenu from '@/components/ContextMenu/ContextMenu';

export default class PaletteTabBar {
    private $el: HTMLDivElement;
    private editingPresetId: string | null = null;
    private contextMenu: ContextMenu;

    private readonly onAddPreset: () => void;
    private readonly onSelectPreset: (presetId: string) => void;
    private readonly onRenamePreset: (presetId: string, name: string) => void;
    private readonly onDeletePreset: (presetId: string) => void;
    private readonly onDuplicatePreset: (presetId: string) => void;
    private readonly onReorderPresets: (orderedIds: string[]) => void;

    constructor({
        $target,
        onAddPreset,
        onSelectPreset,
        onRenamePreset,
        onDeletePreset,
        onDuplicatePreset,
        onReorderPresets,
    }: {
        $target: HTMLElement;
        onAddPreset: () => void;
        onSelectPreset: (presetId: string) => void;
        onRenamePreset: (presetId: string, name: string) => void;
        onDeletePreset: (presetId: string) => void;
        onDuplicatePreset: (presetId: string) => void;
        onReorderPresets: (orderedIds: string[]) => void;
    }) {
        this.onAddPreset = onAddPreset;
        this.onSelectPreset = onSelectPreset;
        this.onRenamePreset = onRenamePreset;
        this.onDeletePreset = onDeletePreset;
        this.onDuplicatePreset = onDuplicatePreset;
        this.onReorderPresets = onReorderPresets;
        this.contextMenu = new ContextMenu({ onClose: () => {} });

        this.$el = document.createElement('div');
        this.$el.className = [
            'flex flex-col gap-1 p-2 overflow-y-auto overflow-x-hidden scrollbar-hidden',
            'bg-background/90 backdrop-blur border-l border-border w-16',
        ].join(' ');
        $target.appendChild(this.$el);

        this.attachBehavior();
    }

    render(presets: Preset[], activePresetId: string | null) {
        this.$el.innerHTML = '';

        for (const preset of presets) {
            this.$el.appendChild(this.buildTab(preset, preset.id === activePresetId));
        }

        const $addBtn = document.createElement('button');
        $addBtn.className = [
            'w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0',
            'text-xl text-muted-foreground hover:text-foreground',
            'hover:bg-accent transition-colors mt-1',
        ].join(' ');
        $addBtn.textContent = '+';
        $addBtn.title = '새 프리셋';
        $addBtn.addEventListener('click', () => this.onAddPreset());
        this.$el.appendChild($addBtn);
    }

    private buildTab(preset: Preset, isActive: boolean): HTMLDivElement {
        const $tab = document.createElement('div');
        $tab.className = [
            'relative w-12 h-12 rounded-lg cursor-pointer flex flex-col items-center justify-center gap-0.5 px-1 py-1',
            'border transition-all select-none min-w-0 overflow-hidden flex-shrink-0',
            isActive
                ? 'border-primary bg-accent'
                : 'border-transparent hover:border-border hover:bg-accent/50',
        ].join(' ');
        // data-preset-id를 달아두면 attachBehavior에서 탭 요소를 쉽게 찾을 수 있다.
        $tab.dataset.presetId = preset.id;

        // 색상 미리보기 점 (최대 3개)
        const $preview = document.createElement('div');
        $preview.className = 'flex gap-0.5 flex-wrap justify-center';
        preset.colors.slice(0, 3).forEach(pc => {
            const $dot = document.createElement('div');
            $dot.className = 'w-2.5 h-2.5 rounded-full flex-shrink-0';
            $dot.style.background = hslToCss(pc.color);
            $preview.appendChild($dot);
        });
        if (preset.colors.length === 0) {
            const $dot = document.createElement('div');
            $dot.className = 'w-2.5 h-2.5 rounded-full bg-muted-foreground/30';
            $preview.appendChild($dot);
        }
        $tab.appendChild($preview);

        // 이름 영역: 편집 중이면 input, 아니면 span
        if (this.editingPresetId === preset.id) {
            const $input = document.createElement('input');
            $input.className = 'w-full text-center text-xs bg-transparent outline-none border-b border-primary';
            $input.value = preset.name;
            const commit = () => {
                const name = $input.value.trim() || preset.name;
                this.editingPresetId = null;
                this.onRenamePreset(preset.id, name);
            };
            $input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') { e.preventDefault(); $input.blur(); }
                if (e.key === 'Escape') { this.editingPresetId = null; $input.blur(); }
            });
            $input.addEventListener('blur', commit);
            $tab.appendChild($input);
            // DOM에 마운트된 직후에 포커스한다. 마운트 전엔 focus()가 무시된다.
            setTimeout(() => { $input.focus(); $input.select(); }, 0);
        } else {
            const $name = document.createElement('span');
            $name.className = 'block w-full min-w-0 text-xs text-center leading-tight truncate text-foreground';
            $name.textContent = preset.name;
            $tab.appendChild($name);
        }

        $tab.addEventListener('click', () => {
            if (this.editingPresetId === preset.id) return;
            this.onSelectPreset(preset.id);
        });

        // 더블클릭: editingPresetId를 세팅하고 onSelectPreset을 호출한다.
        // onSelectPreset → setState → render 흐름으로 리렌더가 트리거되면
        // buildTab이 다시 실행될 때 editingPresetId === preset.id를 보고 input을 그린다.
        $tab.addEventListener('dblclick', () => {
            this.editingPresetId = preset.id;
            this.onSelectPreset(preset.id);
        });

        $tab.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.contextMenu.show($tab.getBoundingClientRect(), [
                {
                    kind: 'action',
                    id: 'rename',
                    label: '이름 변경',
                    onSelect: () => {
                        this.editingPresetId = preset.id;
                        this.onSelectPreset(preset.id);
                    },
                },
                { kind: 'action', id: 'duplicate', label: '복제', onSelect: () => this.onDuplicatePreset(preset.id) },
                { kind: 'separator' },
                { kind: 'action', id: 'delete', label: '삭제', danger: true, onSelect: () => this.onDeletePreset(preset.id) },
            ]);
        });

        return $tab;
    }

    /**
     * 탭 바에 두 가지 드래그 동작을 붙인다.
     *
     * [드래그 재정렬] 탭(data-preset-id) 위에서 드래그
     *   - DOM 순서는 바꾸지 않고, transform: translateY 로만 시각적 위치를 이동한다.
     *   - 나머지 탭들은 CSS transition으로 부드럽게 비켜난다.
     *   - pointerup 시 가상 순서를 계산해 onReorderPresets를 호출한다.
     *
     * [드래그 스크롤] 빈 배경에서 드래그
     *   - scrollTop을 직접 조작해 스크롤한다.
     */
    private attachBehavior() {
        const $el = this.$el;

        // --- 재정렬 상태 ---
        let dragEl: HTMLElement | null = null;
        let originalIndex = -1;  // 드래그 시작 시 탭의 인덱스
        let targetIndex = -1;    // 현재 드롭 목표 인덱스
        let dragStartY = 0;
        let reordering = false;
        // 드래그 시작 시점에 각 탭의 중심 Y 좌표를 스냅샷으로 저장한다.
        // 드래그 중에 getBoundingClientRect()를 쓰면 transform이 반영된 좌표가 나와
        // 목표 인덱스 계산이 틀어지므로 반드시 시작 시점 값을 사용한다.
        let originCenters: number[] = [];
        let slotHeight = 52;  // 탭 한 칸의 높이 (center-to-center). 측정값으로 대체됨.
        // dy 클램핑 범위: 드래그 탭이 첫 번째 탭 위나 마지막 탭 아래로 나가지 못하게 한다.
        let minDy = -Infinity;
        let maxDy = Infinity;
        // 각 탭에 마지막으로 설정한 offset. 같은 값이면 style.transform을 중복 설정하지 않는다.
        const tabCurrentOffset = new Map<HTMLElement, number>();

        // --- 스크롤 상태 ---
        let scrollStartY = 0;
        let scrollStartTop = 0;
        let scrollActive = false;
        let scrollDragging = false;

        const getTabEls = () => [...$el.querySelectorAll<HTMLElement>('[data-preset-id]')];

        // 드래그 종료/취소 시 인라인 스타일을 초기화한다.
        const resetDragStyles = (tabs: HTMLElement[]) => {
            tabs.forEach(t => {
                t.style.transition = '';
                t.style.transform = '';
                t.style.position = '';
                t.style.zIndex = '';
                t.style.opacity = '';
            });
            tabCurrentOffset.clear();
        };

        $el.addEventListener('pointerdown', (e) => {
            reordering = false;
            scrollDragging = false;
            const tab = (e.target as HTMLElement).closest<HTMLElement>('[data-preset-id]');
            if (tab && !(e.target as HTMLElement).closest('input')) {
                // 탭 위 → 재정렬 준비
                dragEl = tab;
                dragStartY = e.clientY;
                const tabs = getTabEls();
                originalIndex = tabs.indexOf(tab);
                targetIndex = originalIndex;
                originCenters = tabs.map(t => {
                    const r = t.getBoundingClientRect();
                    return r.top + r.height / 2;
                });
                // 인접한 두 탭의 중심 거리 = 실제 슬롯 높이
                if (tabs.length > 1) slotHeight = originCenters[1] - originCenters[0];
                // 드래그 탭이 첫 번째/마지막 슬롯을 넘지 못하도록 dy 범위를 계산한다.
                // setPointerCapture로 포인터가 화면 밖에 나가도 이벤트를 받으므로 클램핑이 필요하다.
                minDy = originCenters[0] - originCenters[originalIndex];
                maxDy = originCenters[originCenters.length - 1] - originCenters[originalIndex];
                tabCurrentOffset.clear();
            } else if (!(e.target as HTMLElement).closest('input,button')) {
                // 빈 배경 → 스크롤 준비
                scrollStartY = e.clientY;
                scrollStartTop = $el.scrollTop;
                scrollActive = true;
            }
        });

        $el.addEventListener('pointermove', (e) => {
            if (dragEl) {
                const dy = e.clientY - dragStartY;
                if (!reordering && Math.abs(dy) > 6) {
                    reordering = true;
                    $el.setPointerCapture(e.pointerId);
                    dragEl.style.position = 'relative';
                    dragEl.style.zIndex = '10';
                    dragEl.style.opacity = '0.85';
                    // 드래그 탭: transition-all(Tailwind 클래스)이 transform에도 걸리므로
                    // none으로 override해야 마우스를 즉시 따라간다.
                    dragEl.style.transition = 'none';
                    // 다른 탭들에 transition을 부여한다. 이후 style.transform 변경 시 브라우저가
                    // 현재 시각적 위치에서 새 목표로 자동 전환한다 (인터럽트도 자동 처리).
                    getTabEls().forEach(t => {
                        if (t !== dragEl) t.style.transition = 'transform 180ms cubic-bezier(0.2, 0, 0, 1)';
                    });
                }
                if (reordering) {
                    // dy를 첫 번째/마지막 슬롯 범위로 클램핑해 탭이 화면 밖으로 나가지 못하게 한다.
                    const clampedDy = Math.max(minDy, Math.min(maxDy, dy));

                    // 드래그 중인 탭: 포인터를 실시간으로 따라야 하므로 transition 없이 직접 적용.
                    dragEl.style.transform = `translateY(${clampedDy}px)`;

                    // 드래그 탭의 현재 중심 Y = 원래 중심 + 클램핑된 이동량
                    const dragCenterY = originCenters[originalIndex] + clampedDy;

                    // 어느 슬롯에 가장 가까운지 계산 → 목표 인덱스 결정
                    let newTarget = originalIndex;
                    let minDist = Infinity;
                    for (let i = 0; i < originCenters.length; i++) {
                        const dist = Math.abs(dragCenterY - originCenters[i]);
                        if (dist < minDist) { minDist = dist; newTarget = i; }
                    }

                    if (newTarget !== targetIndex) {
                        targetIndex = newTarget;
                        // 목표 인덱스가 바뀔 때만 나머지 탭 오프셋을 재계산한다.
                        // 드래그 탭이 아래로 이동(originalIndex < targetIndex):
                        //   사이 탭들은 한 칸 위로 (-slotHeight)
                        // 드래그 탭이 위로 이동(originalIndex > targetIndex):
                        //   사이 탭들은 한 칸 아래로 (+slotHeight)
                        getTabEls().forEach((t, i) => {
                            if (t === dragEl) return;
                            let offset = 0;
                            if (originalIndex < targetIndex && i > originalIndex && i <= targetIndex) offset = -slotHeight;
                            else if (originalIndex > targetIndex && i >= targetIndex && i < originalIndex) offset = slotHeight;
                            if (tabCurrentOffset.get(t) === offset) return;
                            tabCurrentOffset.set(t, offset);
                            t.style.transform = offset !== 0 ? `translateY(${offset}px)` : '';
                        });
                    }
                }
            } else if (scrollActive) {
                const dy = e.clientY - scrollStartY;
                if (!scrollDragging && Math.abs(dy) > 4) {
                    scrollDragging = true;
                    $el.setPointerCapture(e.pointerId);
                }
                if (scrollDragging) $el.scrollTop = scrollStartTop - dy;
            }
        });

        // pointerup: 정상 종료 → 재정렬이면 새 순서를 커밋한다.
        const commit = (e: PointerEvent) => {
            if (dragEl) {
                if ($el.hasPointerCapture(e.pointerId)) $el.releasePointerCapture(e.pointerId);
                if (reordering) {
                    const tabs = getTabEls();
                    resetDragStyles(tabs);
                    if (targetIndex !== originalIndex) {
                        // DOM 순서를 바꾸지 않았으므로 가상으로 splice해서 새 순서를 만든다.
                        const newOrder = [...tabs];
                        newOrder.splice(originalIndex, 1);        // 원래 위치에서 제거
                        newOrder.splice(targetIndex, 0, dragEl);  // 목표 위치에 삽입
                        this.onReorderPresets(newOrder.map(t => t.dataset.presetId!));
                    }
                }
                dragEl = null;
            } else if (scrollActive) {
                if (scrollDragging && $el.hasPointerCapture(e.pointerId)) $el.releasePointerCapture(e.pointerId);
                scrollActive = false;
            }
        };

        // pointercancel: 시스템이 중단(전화 알림 등) → 커밋 없이 원위치 복원
        const cancel = (e: PointerEvent) => {
            if (dragEl) {
                if ($el.hasPointerCapture(e.pointerId)) $el.releasePointerCapture(e.pointerId);
                resetDragStyles(getTabEls());
                dragEl = null;
            } else if (scrollActive) {
                if (scrollDragging && $el.hasPointerCapture(e.pointerId)) $el.releasePointerCapture(e.pointerId);
                scrollActive = false;
            }
        };

        $el.addEventListener('pointerup', commit);
        $el.addEventListener('pointercancel', cancel);

        // pointerup 직후 click 이벤트가 발생한다.
        // 드래그였다면 click을 막아 탭 선택이 의도치 않게 트리거되는 것을 방지한다.
        $el.addEventListener('click', (e) => {
            if (reordering || scrollDragging) {
                e.stopPropagation();
                e.preventDefault();
                reordering = false;
                scrollDragging = false;
            }
        }, true);
    }
}
