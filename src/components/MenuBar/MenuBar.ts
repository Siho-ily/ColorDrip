import { animate } from 'motion';
import type { State } from '@/types/state';

const FADE_DELAY = 5000;
const SNAP_MARGIN = 16;

type SnapEdge = 'top' | 'bottom' | 'left' | 'right';

const RAIN_ICON = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/>
  <path d="M8 19v1"/><path d="M8 14v1"/>
  <path d="M16 19v1"/><path d="M16 14v1"/>
  <path d="M12 21v1"/><path d="M12 16v1"/>
</svg>`;

const PALETTE_ICON = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/>
  <circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/>
  <circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/>
  <circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/>
  <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
</svg>`;

const MOON_ICON = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
</svg>`;

const SUN_ICON = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="4"/>
  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
</svg>`;

const SETTINGS_ICON = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
  <circle cx="12" cy="12" r="3"/>
</svg>`;

export default class MenuBar {
  private $el: HTMLDivElement;
  private $sep1: HTMLDivElement;
  private $sep2: HTMLDivElement;
  private $rainBtn: HTMLButtonElement;
  private $paletteBtn: HTMLButtonElement;
  private $darkBtn: HTMLButtonElement;
  private $settingsBtn: HTMLButtonElement;

  private edge: SnapEdge = 'top';
  private isDragging = false;
  private dragOffsetX = 0;
  private dragOffsetY = 0;
  private fadeTimer: ReturnType<typeof setTimeout> | null = null;
  private currentOpacity = 1;
  private lastMousemove = 0;

  private readonly getOccupiedRightWidth: () => number;
  private prevOccupiedRightWidth = 0;

  constructor({
    $target,
    onRainToggle,
    onPaletteToggle,
    onDarkModeToggle,
    onSettingsToggle,
    getOccupiedRightWidth,
  }: {
    $target: HTMLElement;
    onRainToggle: () => void;
    onPaletteToggle: () => void;
    onDarkModeToggle: () => void;
    onSettingsToggle: (anchor: HTMLElement) => void;
    getOccupiedRightWidth: () => number;
  }) {
    this.getOccupiedRightWidth = getOccupiedRightWidth;
    this.$el = document.createElement('div');
    Object.assign(this.$el.style, {
      position: 'fixed',
      zIndex: '50',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      padding: '6px',
      background: 'var(--glass-bg)',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      border: '1px solid var(--glass-border)',
      borderRadius: '16px',
      boxShadow: 'var(--glass-shadow)',
      cursor: 'grab',
      userSelect: 'none',
      touchAction: 'none'
    });

    this.$rainBtn = this.createBtn(RAIN_ICON, '빗방울 토글');
    this.$sep1 = this.createSep();
    this.$paletteBtn = this.createBtn(PALETTE_ICON, '팔레트 열기');
    this.$darkBtn = this.createBtn(MOON_ICON, '다크 모드');
    this.$sep2 = this.createSep();
    this.$settingsBtn = this.createBtn(SETTINGS_ICON, '설정');

    this.$el.append(
      this.$rainBtn,
      this.$sep1,
      this.$paletteBtn,
      this.$darkBtn,
      this.$sep2,
      this.$settingsBtn
    );
    $target.appendChild(this.$el);

    requestAnimationFrame(() => this.applySnap('top', false));

    this.$rainBtn.addEventListener('click', onRainToggle);
    this.$paletteBtn.addEventListener('click', onPaletteToggle);
    this.$darkBtn.addEventListener('click', onDarkModeToggle);
    this.$settingsBtn.addEventListener('click', () =>
      onSettingsToggle(this.$settingsBtn)
    );

    this.$el.addEventListener('mouseenter', () => this.showBar());
    // mousemove는 마우스를 움직이는 동안 초당 수십 번 발생한다. 250ms 쓰로틀로
    // showBar()의 clearTimeout/setTimeout 반복 호출과 그에 따른 GC 부담을 줄인다.
    document.addEventListener('mousemove', () => {
      const now = performance.now();
      if (now - this.lastMousemove < 250) return;
      this.lastMousemove = now;
      this.showBar();
    }, { passive: true });

    this.bindDrag();
    this.scheduleFade();

    // 창 크기가 바뀌면 현재 edge 기준으로 위치를 재계산한다.
    // transition: false — 사용자가 창을 드래그하는 동안 매 프레임 즉시 따라가야 자연스럽다.
    window.addEventListener('resize', () => this.applySnap(this.edge, false));
  }

  setSettingsActive(active: boolean) {
    this.setActive(this.$settingsBtn, active);
  }

  private createBtn(icon: string, title: string): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.title = title;
    btn.innerHTML = icon;
    Object.assign(btn.style, {
      width: '32px',
      height: '32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: '0',
      border: 'none',
      borderRadius: '10px',
      background: 'transparent',
      color: 'var(--glass-text)',
      cursor: 'pointer',
      transition: 'background 0.15s',
      padding: '0'
    });
    btn.addEventListener('mouseenter', () => {
      if (btn.dataset.active !== 'true') btn.style.background = 'var(--glass-hover)';
    });
    btn.addEventListener('mouseleave', () => {
      if (btn.dataset.active !== 'true') btn.style.background = 'transparent';
    });
    return btn;
  }

  private createSep(): HTMLDivElement {
    const sep = document.createElement('div');
    Object.assign(sep.style, { flexShrink: '0', background: 'var(--glass-sep)' });
    return sep;
  }

  private updateSeps() {
    const horiz = this.edge === 'top' || this.edge === 'bottom';
    const size = horiz ? { width: '1px', height: '18px' } : { width: '18px', height: '1px' };
    Object.assign(this.$sep1.style, size);
    Object.assign(this.$sep2.style, size);
  }

  private applySnap(edge: SnapEdge, withTransition: boolean) {
    this.edge = edge;
    const horiz = edge === 'top' || edge === 'bottom';
    this.$el.style.flexDirection = horiz ? 'row' : 'column';
    this.updateSeps();

    this.$el.style.transition = withTransition
      ? 'left 0.28s cubic-bezier(0.25,0.46,0.45,0.94), top 0.28s cubic-bezier(0.25,0.46,0.45,0.94)'
      : 'none';

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // 팔레트가 열려 있으면 화면 우측 일부를 차지하므로 effectiveRight = vw - 팔레트 너비로 계산.
    // 이걸로 top/bottom의 가로 중앙과 right의 x 좌표를 잡으면 메뉴바가 팔레트 왼쪽 영역 안에 들어온다.
    const effectiveRight = vw - this.getOccupiedRightWidth();
    const { width: bw, height: bh } = this.$el.getBoundingClientRect();

    let x: number, y: number;
    switch (edge) {
      case 'top':
        x = (effectiveRight - bw) / 2;
        y = SNAP_MARGIN;
        break;
      case 'bottom':
        x = (effectiveRight - bw) / 2;
        y = vh - bh - SNAP_MARGIN;
        break;
      case 'left':
        x = SNAP_MARGIN;
        y = (vh - bh) / 2;
        break;
      case 'right':
        x = effectiveRight - bw - SNAP_MARGIN;
        y = (vh - bh) / 2;
        break;
    }

    this.$el.style.left = `${x}px`;
    this.$el.style.top = `${y}px`;
  }

  private nearestEdge(cx: number, cy: number): SnapEdge {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const dists: [number, SnapEdge][] = [
      [cy, 'top'],
      [vh - cy, 'bottom'],
      [cx, 'left'],
      [vw - cx, 'right']
    ];
    return dists.reduce((a, b) => (a[0] < b[0] ? a : b))[1];
  }

  private bindDrag() {
    this.$el.addEventListener('pointerdown', e => {
      if ((e.target as HTMLElement).closest('button')) return;

      e.preventDefault();
      this.isDragging = true;
      this.$el.style.cursor = 'grabbing';
      this.$el.style.transition = 'none';

      const rect = this.$el.getBoundingClientRect();
      this.dragOffsetX = e.clientX - rect.left;
      this.dragOffsetY = e.clientY - rect.top;
      this.$el.setPointerCapture(e.pointerId);

      this.cancelFade();
      if (this.currentOpacity < 1) {
        this.currentOpacity = 1;
        this.$el.style.pointerEvents = 'auto';
        animate(this.$el, { opacity: 1 }, { duration: 0.2 });
      }
    });

    this.$el.addEventListener('pointermove', e => {
      if (!this.isDragging) return;
      this.$el.style.left = `${e.clientX - this.dragOffsetX}px`;
      this.$el.style.top = `${e.clientY - this.dragOffsetY}px`;
    });

    // pointerup과 pointercancel(시스템 알림·터치 제스처 중단 등) 모두 동일하게 처리.
    // pointercancel을 다루지 않으면 isDragging이 풀리지 않아 커서가 grabbing으로 멈춘다.
    const endDrag = () => {
      if (!this.isDragging) return;
      this.isDragging = false;
      this.$el.style.cursor = 'grab';

      const rect = this.$el.getBoundingClientRect();
      const edge = this.nearestEdge(rect.left + rect.width / 2, rect.top + rect.height / 2);
      this.applySnap(edge, true);
      this.scheduleFade();
    };
    this.$el.addEventListener('pointerup', endDrag);
    this.$el.addEventListener('pointercancel', endDrag);
  }

  private showBar() {
    if (this.isDragging) return;
    this.cancelFade();

    if (this.currentOpacity < 1) {
      this.currentOpacity = 1;
      this.$el.style.pointerEvents = 'auto';
      animate(this.$el, { opacity: 1 }, { duration: 0.25 });
    }

    this.scheduleFade();
  }

  private scheduleFade() {
    this.cancelFade();
    this.fadeTimer = setTimeout(() => {
      this.fadeTimer = null;
      this.currentOpacity = 0;
      // 페이드 아웃이 끝나면 pointer-events: none. 투명한 div가 캔버스 클릭을 가로채지 않도록.
      // 페이드 도중 showBar()가 호출되면 currentOpacity가 1로 바뀌므로 .then 가드로 덮어쓰기 방지.
      animate(this.$el, { opacity: 0 }, { duration: 0.6 }).finished.then(() => {
        if (this.currentOpacity === 0) this.$el.style.pointerEvents = 'none';
      });
    }, FADE_DELAY);
  }

  private cancelFade() {
    if (this.fadeTimer !== null) {
      clearTimeout(this.fadeTimer);
      this.fadeTimer = null;
    }
  }

  private setActive(btn: HTMLButtonElement, active: boolean) {
    btn.dataset.active = String(active);
    btn.style.background = active ? 'var(--glass-active)' : 'transparent';
    btn.style.color = 'var(--glass-text)';
  }

  setState(state: State) {
    this.setActive(this.$rainBtn, state.rainMode);
    this.setActive(this.$paletteBtn, state.palette.open);
    const dark = state.settings.darkMode;
    this.$darkBtn.innerHTML = dark ? SUN_ICON : MOON_ICON;
    this.$darkBtn.title = dark ? '라이트 모드' : '다크 모드';
    this.setActive(this.$darkBtn, dark);

    // 팔레트 점유 너비가 바뀐 경우에만 재배치. setState는 빈번히 호출되지만
    // 너비가 같으면 transition을 새로 시작하지 않는다.
    // PaletteSidebar.setState가 먼저 실행되어 translate 클래스가 갱신된 뒤에 호출된다는 점에 의존한다.
    const w = this.getOccupiedRightWidth();
    if (w !== this.prevOccupiedRightWidth) {
      this.prevOccupiedRightWidth = w;
      this.applySnap(this.edge, true);
    }
  }
}
