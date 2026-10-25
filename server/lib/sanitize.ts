const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

/** Trims and HTML-escapes user text before it is stored, so it can never inject markup. */
export function sanitizeText(value: string): string {
  return value.trim().replace(/[&<>"']/g, (char) => HTML_ENTITIES[char] ?? char)
}
