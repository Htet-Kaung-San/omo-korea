import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CheckCheck,
  Copy,
  Mic,
  MoreHorizontal,
  Paperclip,
  RefreshCw,
  Send,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react'
import { api } from '@/api'
import { useLanguage } from '@/context/LanguageContext'
import { ChatHistoryDrawer } from '@/components/chat/ChatHistoryDrawer'
import sanjini from '@/assets/pnu-character.png'
import {
  loadChatThreads,
  saveChatThreads,
  togglePinThread,
  upsertChatThread,
  type ChatMessage,
  type ChatThread,
} from '@/utils/chatHistory'

type Message = ChatMessage

const DEFAULT_SUGGESTIONS = [
  'How to extend my visa?',
  'Part-time job rules?',
  'Course registration',
]

function formatTime(ts: number, locale: string) {
  return new Date(ts).toLocaleTimeString(locale, {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function AiAssistantPage() {
  const { locale, t } = useLanguage()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>(DEFAULT_SUGGESTIONS)
  const [suggestionOffset, setSuggestionOffset] = useState(0)
  const [sending, setSending] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [threads, setThreads] = useState<ChatThread[]>(() => loadChatThreads())
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const activeThreadIdRef = useRef<string | null>(null)

  useEffect(() => {
    api
      .getChatSuggestions()
      .then((items) => {
        if (items.length > 0) setSuggestions(items)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  useEffect(() => {
    activeThreadIdRef.current = activeThreadId
  }, [activeThreadId])

  useEffect(() => {
    if (messages.length === 0) return
    setThreads((prev) => {
      const { threads: next, threadId } = upsertChatThread(
        prev,
        activeThreadIdRef.current,
        messages,
      )
      if (threadId !== activeThreadIdRef.current) {
        activeThreadIdRef.current = threadId
        setActiveThreadId(threadId)
      }
      saveChatThreads(next)
      return next
    })
  }, [messages])

  const visibleSuggestions = useMemo(() => {
    if (suggestions.length === 0) return DEFAULT_SUGGESTIONS
    const start = suggestionOffset % suggestions.length
    const rotated = [...suggestions.slice(start), ...suggestions.slice(0, start)]
    return rotated.slice(0, 3)
  }, [suggestions, suggestionOffset])

  async function sendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed || sending) return

    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: 'user', text: trimmed, at: Date.now() },
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
          at: Date.now(),
        },
      ])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: err instanceof Error ? err.message : t('chat.error'),
          at: Date.now(),
        },
      ])
    } finally {
      setSending(false)
    }
  }

  async function copyText(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      window.setTimeout(() => setCopiedId(null), 1500)
    } catch {
      /* ignore */
    }
  }

  function handleNewChat() {
    setMessages([])
    setActiveThreadId(null)
    activeThreadIdRef.current = null
    setInput('')
  }

  function handleSelectThread(thread: ChatThread) {
    setActiveThreadId(thread.id)
    activeThreadIdRef.current = thread.id
    setMessages(thread.messages)
    setInput('')
  }

  function handleTogglePin(id: string) {
    setThreads((prev) => {
      const next = togglePinThread(prev, id)
      saveChatThreads(next)
      return next
    })
  }

  const showWelcome = messages.length === 0 && !sending

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-white">
      <ChatHistoryDrawer
        open={historyOpen}
        threads={threads}
        activeId={activeThreadId}
        onClose={() => setHistoryOpen(false)}
        onSelect={handleSelectThread}
        onNewChat={handleNewChat}
        onTogglePin={handleTogglePin}
      />

      {/* Header */}
      <header className="flex shrink-0 items-center gap-2 border-b border-black/5 px-3 py-2.5">
        <button
          type="button"
          onClick={() => setHistoryOpen(true)}
          className="rounded-lg p-1.5 text-pnu-muted transition hover:bg-black/5 hover:text-pnu-text"
          aria-label={t('chat.historyTitle')}
          title={t('chat.historyTitle')}
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>

        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <img
            src={sanjini}
            alt=""
            className="h-10 w-10 shrink-0 rounded-full bg-[#E8F3FF] object-contain ring-1 ring-black/5"
          />
          <div className="min-w-0">
            <h1 className="truncate text-[16px] font-bold tracking-tight text-pnu-text">
              {t('chat.assistantTitle')}
            </h1>
            <p className="truncate text-[11px] font-medium text-pnu-muted">
              {t('chat.assistantSubtitle')}
            </p>
            <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold text-[#34C759]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#34C759]" />
              {t('chat.online')}
            </p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-3 py-3">
        {showWelcome ? (
          <div className="flex items-end gap-2">
            <img
              src={sanjini}
              alt=""
              className="mb-5 h-8 w-8 shrink-0 rounded-full bg-[#E8F3FF] object-contain ring-1 ring-black/5"
            />
            <div className="max-w-[85%]">
              <div className="rounded-[18px] rounded-bl-md border border-black/8 bg-white px-3.5 py-3 text-[14px] leading-relaxed text-pnu-text shadow-sm">
                {t('chat.welcome')}
              </div>
              <p className="mt-1 px-1 text-[10px] font-medium text-pnu-muted">
                {formatTime(Date.now(), locale)}
              </p>
            </div>
          </div>
        ) : null}

        {messages.map((message) =>
          message.role === 'user' ? (
            <div key={message.id} className="flex flex-col items-end gap-1">
              <div className="max-w-[82%] rounded-[18px] rounded-br-md bg-pnu-blue px-3.5 py-2.5 text-[14px] leading-relaxed text-white shadow-sm">
                {message.text}
              </div>
              <div className="flex items-center gap-1 px-1 text-[10px] font-medium text-pnu-muted">
                <span>{formatTime(message.at, locale)}</span>
                <CheckCheck className="h-3.5 w-3.5 text-pnu-blue" strokeWidth={2} />
              </div>
            </div>
          ) : (
            <div key={message.id} className="flex items-end gap-2">
              <img
                src={sanjini}
                alt=""
                className="mb-8 h-8 w-8 shrink-0 rounded-full bg-[#E8F3FF] object-contain ring-1 ring-black/5"
              />
              <div className="max-w-[82%]">
                <div className="whitespace-pre-wrap rounded-[18px] rounded-bl-md border border-black/8 bg-white px-3.5 py-2.5 text-[14px] leading-relaxed text-pnu-text shadow-sm">
                  {message.text}
                </div>
                <p className="mt-1 px-1 text-[10px] font-medium text-pnu-muted">
                  {formatTime(message.at, locale)}
                </p>
                <div className="mt-1.5 flex items-center gap-1.5 px-0.5">
                  <button
                    type="button"
                    className="rounded-full border border-black/10 p-1.5 text-pnu-muted transition hover:text-pnu-blue"
                    aria-label={t('chat.feedbackUp')}
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-black/10 p-1.5 text-pnu-muted transition hover:text-pnu-blue"
                    aria-label={t('chat.feedbackDown')}
                  >
                    <ThumbsDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => copyText(message.id, message.text)}
                    className="rounded-full border border-black/10 p-1.5 text-pnu-muted transition hover:text-pnu-blue"
                    aria-label={t('chat.copy')}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  {copiedId === message.id ? (
                    <span className="text-[10px] font-medium text-pnu-blue">
                      {t('chat.copied')}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          ),
        )}

        {sending ? (
          <div className="flex items-center gap-2 text-[13px] text-pnu-muted">
            <img
              src={sanjini}
              alt=""
              className="h-7 w-7 rounded-full bg-[#E8F3FF] object-contain"
            />
            {t('chat.typing')}
          </div>
        ) : null}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      <div className="flex shrink-0 items-center gap-2 border-t border-black/5 px-3 py-2">
        <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {visibleSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => sendMessage(suggestion)}
              disabled={sending}
              className="shrink-0 rounded-full border border-pnu-blue/40 bg-white px-3 py-1.5 text-[11px] font-semibold text-pnu-blue transition active:scale-[0.98] disabled:opacity-50"
            >
              {suggestion}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setSuggestionOffset((n) => n + 1)}
          className="shrink-0 rounded-full p-1.5 text-pnu-blue transition hover:bg-pnu-blue/10"
          aria-label={t('chat.refreshSuggestions')}
        >
          <RefreshCw className="h-4 w-4" strokeWidth={2.2} />
        </button>
      </div>

      {/* Composer */}
      <form
        className="shrink-0 px-3 pb-2 pt-1"
        onSubmit={(event) => {
          event.preventDefault()
          sendMessage(input)
        }}
      >
        <div className="flex items-center gap-2">
          <div className="flex min-h-11 flex-1 items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 shadow-sm">
            <button
              type="button"
              className="shrink-0 p-1 text-pnu-muted"
              aria-label={t('chat.attach')}
              disabled
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={t('chat.askAnything')}
              className="min-w-0 flex-1 bg-transparent py-2 text-[14px] text-pnu-text outline-none placeholder:text-pnu-muted"
            />
            <button
              type="button"
              className="shrink-0 p-1 text-pnu-muted"
              aria-label={t('chat.voice')}
              disabled
            >
              <Mic className="h-4 w-4" />
            </button>
          </div>
          <button
            type="submit"
            disabled={sending || !input.trim()}
            aria-label={t('chat.send')}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pnu-blue text-white shadow-sm transition active:scale-95 disabled:opacity-40"
          >
            <Send className="h-4 w-4" strokeWidth={2.2} />
          </button>
        </div>
        <p className="mt-2 text-center text-[10px] font-medium text-pnu-muted">
          {t('chat.disclaimer')}
        </p>
      </form>

    </div>
  )
}
