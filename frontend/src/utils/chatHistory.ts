export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  at: number
}

export type ChatCategory = 'all' | 'pinned' | 'courses' | 'visa' | 'campus'

export interface ChatThread {
  id: string
  title: string
  preview: string
  updatedAt: number
  pinned: boolean
  category: Exclude<ChatCategory, 'all' | 'pinned'>
  messages: ChatMessage[]
}

const STORAGE_KEY = 'heypnu.chatHistory.v1'

function inferCategory(text: string): ChatThread['category'] {
  const lower = text.toLowerCase()
  if (/visa|d-2|alien|arc|immigration/.test(lower)) return 'visa'
  if (/course|credit|graduat|register|class|timetable/.test(lower)) return 'courses'
  if (/campus|dorm|library|bus|cafeteria|map|housing/.test(lower)) return 'campus'
  return 'campus'
}

function titleFromMessages(messages: ChatMessage[]): string {
  const firstUser = messages.find((m) => m.role === 'user')
  if (!firstUser) return 'New chat'
  const text = firstUser.text.trim()
  return text.length > 42 ? `${text.slice(0, 42)}…` : text
}

function previewFromMessages(messages: ChatMessage[]): string {
  const last = [...messages].reverse().find((m) => m.text.trim())
  if (!last) return ''
  const text = last.text.trim()
  return text.length > 72 ? `${text.slice(0, 72)}…` : text
}

export function loadChatThreads(): ChatThread[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ChatThread[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveChatThreads(threads: ChatThread[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(threads.slice(0, 40)))
}

export function upsertChatThread(
  threads: ChatThread[],
  threadId: string | null,
  messages: ChatMessage[],
): { threads: ChatThread[]; threadId: string } {
  if (messages.length === 0) {
    return { threads, threadId: threadId ?? crypto.randomUUID() }
  }

  const id = threadId ?? crypto.randomUUID()
  const existing = threads.find((t) => t.id === id)
  const firstUser = messages.find((m) => m.role === 'user')
  const next: ChatThread = {
    id,
    title: titleFromMessages(messages),
    preview: previewFromMessages(messages),
    updatedAt: Date.now(),
    pinned: existing?.pinned ?? false,
    category: firstUser ? inferCategory(firstUser.text) : (existing?.category ?? 'campus'),
    messages,
  }

  const others = threads.filter((t) => t.id !== id)
  return {
    threads: [next, ...others].sort((a, b) => b.updatedAt - a.updatedAt),
    threadId: id,
  }
}

export function togglePinThread(threads: ChatThread[], id: string): ChatThread[] {
  return threads
    .map((t) => (t.id === id ? { ...t, pinned: !t.pinned } : t))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt)
}

export function deleteChatThread(threads: ChatThread[], id: string): ChatThread[] {
  return threads.filter((t) => t.id !== id)
}
