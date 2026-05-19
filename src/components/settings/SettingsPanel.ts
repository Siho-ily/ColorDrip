import {
  SHORTCUTS,
  getShortcutLabel,
} from '@/lib/shortcuts'

export class SettingsPanel {
  element: HTMLDivElement

  constructor() {
    this.element = document.createElement('div')

    this.element.className = 'settings-panel'

    this.render()
  }

  render() {
    this.element.innerHTML = `
      <h2>단축키 목록</h2>

      <div class="shortcut-list">
        ${SHORTCUTS.map(
          (shortcut) => `
            <div class="shortcut-row">
              <span>${shortcut.description}</span>

              <kbd>
                ${getShortcutLabel(shortcut)}
              </kbd>
            </div>
          `
        ).join('')}
      </div>
    `
  }

  toggle() {
    this.element.classList.toggle('open')
  }

  mount(parent = document.body) {
    parent.appendChild(this.element)
  }
}