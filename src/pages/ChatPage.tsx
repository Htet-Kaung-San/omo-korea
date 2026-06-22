import { useEffect, useRef, useState } from 'react'
import { Send } from 'lucide-react'
import { api } from '@/api'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'

interface Message {
  id: string
  role: 'user' | 'assistant'
  text: string
}

export function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    api.getChatSuggestions().then(setSuggestions).catch(() => {})
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  async function sendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed || sending) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      text: trimmed,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setSending(true)

    try {
      const { reply } = await api.sendChatMessage({ message: trimmed })
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', text: reply },
      ])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: err instanceof Error ? err.message : 'Something went wrong.',
        },
      ])
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex h-[calc(100dvh-56px)] flex-col">
      <PageHeader title="Campus Assistant" subtitle="Predefined answers for academics & campus life" />

      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {messages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-pnu-border bg-white p-4">
            <p className="text-sm text-pnu-muted">
              Ask about course registration, credits, housing, or campus services.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => sendMessage(s)}
                  className="rounded-full border border-pnu-border bg-pnu-surface px-3 py-1.5 text-xs font-medium text-pnu-text hover:border-pnu-blue-light"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={['flex', msg.role === 'user' ? 'justify-end' : 'justify-start'].join(' ')}
          >
            <div
              className={[
                'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                msg.role === 'user'
                  ? 'rounded-br-md bg-pnu-blue text-white'
                  : 'rounded-bl-md border border-pnu-border bg-white text-pnu-text',
              ].join(' ')}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {sending ? <p className="text-xs text-pnu-muted">Assistant is typing…</p> : null}
        <div ref={bottomRef} />
      </div>

      <form
        className="border-t border-pnu-border bg-white px-4 py-3"
        onSubmit={(e) => {
          e.preventDefault()
          sendMessage(input)
        }}
      >
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question…"
            className="min-h-11 flex-1 rounded-xl border border-pnu-border px-3.5 text-sm outline-none focus:border-pnu-blue-light focus:ring-2 focus:ring-pnu-blue-light/20"
          />
          <Button type="submit" disabled={sending || !input.trim()} aria-label="Send message">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}
