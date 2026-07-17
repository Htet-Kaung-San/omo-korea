import { useEffect, useRef, useState } from 'react'
import { Brain, Send } from 'lucide-react'
import { api } from '@/api'
import { useLanguage } from '@/context/LanguageContext'
import { ManageMemoryModal } from '@/components/chat/ManageMemoryModal'
import sanjini from '@/assets/pnu-character.png'

interface Message {
  id: string
  role: 'user' | 'assistant'
  text: string
}

export function AiAssistantPage() {
  const { t } = useLanguage()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [sending, setSending] = useState(false)
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false)
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
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: reply || t('chat.unavailable'),
        },
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
    <div className="flex h-[calc(100dvh-8.5rem)] flex-col bg-[#F2F2F7]">
      <header className="flex items-center justify-between border-b border-black/5 bg-white/90 px-4 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <img
            src={sanjini}
            alt="Sanjini"
            className="h-11 w-11 rounded-full bg-sky-50 object-contain ring-1 ring-black/5"
          />
          <div>
            <h1 className="text-[17px] font-semibold tracking-tight text-pnu-text">
              {t('chat.sanjiniTitle')}
            </h1>
            <p className="text-[12px] text-pnu-muted">{t('chat.sanjiniSubtitle')}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsMemoryModalOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F2F2F7] text-pnu-blue"
          title="Memory settings"
        >
          <Brain className="h-5 w-5" />
        </button>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="mx-auto mt-6 max-w-sm text-center">
            <img
              src={sanjini}
              alt=""
              className="mx-auto h-28 w-28 object-contain drop-shadow-sm"
            />
            <p className="mt-4 text-[15px] font-semibold text-pnu-text">{t('chat.emptyHint')}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {suggestions.slice(0, 4).map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => sendMessage(suggestion)}
                  className="rounded-full bg-white px-3.5 py-2 text-[12px] font-medium text-pnu-text shadow-sm ring-1 ring-black/5"
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
            className={message.role === 'user' ? 'flex justify-end' : 'flex items-end gap-2'}
          >
            {message.role === 'assistant' ? (
              <img
                src={sanjini}
                alt=""
                className="mb-0.5 h-8 w-8 shrink-0 rounded-full bg-white object-contain ring-1 ring-black/5"
              />
            ) : null}
            <div
              className={[
                'max-w-[80%] px-3.5 py-2.5 text-[14px] leading-relaxed shadow-sm',
                message.role === 'user'
                  ? 'rounded-[20px] rounded-br-md bg-pnu-blue text-white'
                  : 'rounded-[20px] rounded-bl-md bg-white text-pnu-text ring-1 ring-black/5',
              ].join(' ')}
            >
              {message.text}
            </div>
          </div>
        ))}

        {sending ? (
          <div className="flex items-center gap-2 text-[13px] text-pnu-muted">
            <img src={sanjini} alt="" className="h-7 w-7 rounded-full bg-white object-contain" />
            {t('chat.typing')}
          </div>
        ) : null}
        <div ref={bottomRef} />
      </div>

      <form
        className="border-t border-black/5 bg-white/95 px-3 py-3 backdrop-blur-xl"
        onSubmit={(event) => {
          event.preventDefault()
          sendMessage(input)
        }}
      >
        <div className="flex items-end gap-2 rounded-[22px] bg-[#F2F2F7] px-3 py-2 ring-1 ring-black/5">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={t('chat.placeholder')}
            className="min-h-10 flex-1 bg-transparent px-1 text-[15px] text-pnu-text outline-none placeholder:text-pnu-muted"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            aria-label={t('chat.send')}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pnu-blue text-white disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>

      {isMemoryModalOpen ? (
        <ManageMemoryModal isOpen={isMemoryModalOpen} onClose={() => setIsMemoryModalOpen(false)} />
      ) : null}
    </div>
  )
}
