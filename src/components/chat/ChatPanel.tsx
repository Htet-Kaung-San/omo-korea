import { useEffect, useRef, useState } from 'react'
import { Send } from 'lucide-react'
import { api } from '@/api'
import { useLanguage } from '@/context/LanguageContext'

interface Message {
  id: string
  role: 'user' | 'assistant'
  text: string
}

export function ChatPanel() {
  const { t } = useLanguage()
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

    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: 'user', text: trimmed },
    ])
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
          text: err instanceof Error ? err.message : t('chat.error'),
        },
      ])
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="flex max-h-[60dvh] min-h-[360px] flex-col overflow-hidden rounded-3xl border border-pnu-border bg-white shadow-2xl shadow-blue-950/20">
      <header className="border-b border-pnu-border bg-pnu-surface px-4 py-3">
        <h2 className="text-sm font-bold text-pnu-text">{t('chat.title')}</h2>
        <p className="text-xs text-pnu-muted">{t('chat.subtitle')}</p>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-pnu-border bg-pnu-surface/60 p-3">
            <p className="text-xs leading-relaxed text-pnu-muted">{t('chat.emptyHint')}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {suggestions.slice(0, 4).map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => sendMessage(suggestion)}
                  className="rounded-full border border-pnu-border bg-white px-2.5 py-1 text-[11px] font-medium text-pnu-text hover:border-pnu-blue-light"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {messages.map((message) => (
          <div
            key={message.id}
            className={message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
          >
            <div
              className={[
                'max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed',
                message.role === 'user'
                  ? 'rounded-br-md bg-pnu-blue text-white'
                  : 'rounded-bl-md border border-pnu-border bg-pnu-surface text-pnu-text',
              ].join(' ')}
            >
              {message.text}
            </div>
          </div>
        ))}

        {sending ? <p className="text-xs text-pnu-muted">{t('chat.typing')}</p> : null}
        <div ref={bottomRef} />
      </div>

      <form
        className="border-t border-pnu-border bg-white p-3"
        onSubmit={(event) => {
          event.preventDefault()
          sendMessage(input)
        }}
      >
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={t('chat.placeholder')}
            className="min-h-10 flex-1 rounded-xl border border-pnu-border px-3 text-sm outline-none focus:border-pnu-blue-light focus:ring-2 focus:ring-pnu-blue-light/20"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            aria-label={t('chat.send')}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pnu-blue text-white transition hover:bg-pnu-blue-light disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </section>
  )
}
