export type OneStopInlinePart =
  | { type: 'text'; value: string }
  | { type: 'link'; label: string; href: string }

const LINK_PATTERN = /\[([^\]]+)\]\(([^)]+)\)/g

export function parseOneStopStep(text: string): OneStopInlinePart[] {
  const parts: OneStopInlinePart[] = []
  let lastIndex = 0

  for (const match of text.matchAll(LINK_PATTERN)) {
    const index = match.index ?? 0

    if (index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, index) })
    }

    parts.push({ type: 'link', label: match[1], href: match[2] })
    lastIndex = index + match[0].length
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) })
  }

  if (parts.length === 0) {
    parts.push({ type: 'text', value: text })
  }

  return parts
}
