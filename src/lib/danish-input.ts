/**
 * Insert a character at the cursor position of an input or textarea element.
 * Preserves cursor position after insertion.
 */
export function insertAtCursor(
  el: HTMLInputElement | HTMLTextAreaElement,
  char: string
): void {
  const start = el.selectionStart ?? el.value.length
  const end = el.selectionEnd ?? el.value.length

  const before = el.value.slice(0, start)
  const after = el.value.slice(end)

  el.value = before + char + after

  // Move cursor after inserted char
  const newPos = start + char.length
  el.selectionStart = newPos
  el.selectionEnd = newPos

  // Trigger React's synthetic onChange
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    el instanceof HTMLTextAreaElement
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype,
    'value'
  )?.set
  nativeInputValueSetter?.call(el, el.value)
  el.dispatchEvent(new Event('input', { bubbles: true }))
}

/** The three special Danish characters available as virtual keys. */
export const DANISH_CHARS = ['æ', 'ø', 'å'] as const
export type DanishChar = (typeof DANISH_CHARS)[number]
