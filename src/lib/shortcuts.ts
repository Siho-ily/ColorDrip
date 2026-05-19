type Shortcut = {
  id: string
  key: string
  meta: boolean
  description: string
  action: () => void
}

function toggleRain() {
  console.log('Rain 토글')
}

function cycleTheme() {
  console.log('테마 변경')
}

function toggleSettings() {
  window.dispatchEvent(
    new CustomEvent('shortcut:toggle-settings')
  )
}

function togglePicker() {
  console.log('컬러 피커 열기')
}

function clearSelection() {
  console.log('선택 해제')
}

export const SHORTCUTS: Shortcut[] = [
  {
    id: 'toggle-rain',
    key: 'r',
    meta: false,
    description: 'Rain 토글',
    action: () => toggleRain(),
  },

  {
    id: 'cycle-theme',
    key: 't',
    meta: false,
    description: '테마 순환 (Dark → Light → System)',
    action: () => cycleTheme(),
  },

  {
    id: 'open-settings',
    key: ',',
    meta: true, // Cmd/Ctrl + ,
    description: '설정 패널 열기/닫기',
    action: () => toggleSettings(),
  },

  {
    id: 'open-picker',
    key: 'p',
    meta: false,
    description: '컬러 피커 열기',
    action: () => togglePicker(),
  },

  {
    id: 'clear-selection',
    key: 'Escape',
    meta: false,
    description: '선택 해제 / 피커 닫기',
    action: () => clearSelection(),
  },
]

export function getShortcutLabel(shortcut: Shortcut) {
  const prefix = shortcut.meta ? '⌘ + ' : ''

  if (shortcut.key === 'Escape') {
    return `${prefix}ESC`
  }

  return `${prefix}${shortcut.key.toUpperCase()}`
}

export function initShortcuts() {
  window.addEventListener('keydown', (e) => {
    const target = e.target as HTMLElement

    // input 입력 중이면 단축키 무시
    if (
      target.closest('input, textarea') ||
      target.isContentEditable
    ) {
      return
    }

    const match = SHORTCUTS.find(
      (shortcut) =>
        shortcut.key.toLowerCase() ===
          e.key.toLowerCase() &&
        shortcut.meta ===
          (e.metaKey || e.ctrlKey)
    )

    if (!match) return

    e.preventDefault()

    match.action()

    console.log(`[Shortcut] ${match.id}`)
  })
}