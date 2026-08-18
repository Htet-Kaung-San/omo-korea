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
  'Course registration',
  'Graduation credits',
  'Dorm housing',
]

/** Turns kept as context. Enough to follow a thread, short enough to stay cheap. */
const HISTORY_TURNS = 6

/**
 * Fold the rendered transcript into the {question, answer} pairs the backend
 * expects. Only completed exchanges count: a user message with no reply yet
 * would send an empty answer and teach the model that questions go unanswered.
 */
function buildHistory(messages: Message[]) {
  const turns: { question: string; answer: string }[] = []

  for (let i = 0; i < messages.length - 1; i += 1) {
    const question = messages[i]
    const answer = messages[i + 1]
    if (question.role !== 'user' || answer.role !== 'assistant') continue
    if (!question.text.trim() || !answer.text.trim()) continue
    turns.push({ question: question.text, answer: answer.text })
  }

  return turns.slice(-HISTORY_TURNS)
}

function formatTime(ts: number, locale: string) {
  return new Date(ts).toLocaleTimeString(locale, {
    hour: 'numeric',
    minute: '2-digit',
  })
}

/**
 * Questions where a wrong answer has a real cost — a visa refused, a job that
 * breaches a permit, a graduation missed. The ungrounded caution is shown only
 * for these. Without the gate it fires on "hi" and "where is the cafeteria",
 * which trains students to dismiss it exactly where it matters, and adds a
 * legal-sounding warning to a greeting.
 */
const CONSEQUENTIAL_TOPIC =
  /visa|d-?2|immigration|alien|arc|residence|permit|work|job|part.?time|employ|insurance|tax|graduat|credit|scholarship|tuition|deport|extend|extension/i

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
  const [ratedIds, setRatedIds] = useState<Record<string, 'up' | 'down'>>({})
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

    // Pair up the turns already on screen and send them as context. Without
    // this the assistant answers every message in isolation — asking "how do I
    // apply for it?" after a work-permit answer used to return "what does 'it'
    // refer to?". Capped so a long thread cannot blow the model's context.
    const history = buildHistory(messages)

    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: 'user', text: trimmed, at: Date.now() },
    ])
    setInput('')
    setSending(true)

    const replyId = crypto.randomUUID()
    const consequential = CONSEQUENTIAL_TOPIC.test(trimmed)
    let streamed = ''

    try {
      // Placeholder the tokens stream into, so text appears as it is generated
      // rather than after the whole answer is ready.
      setMessages((prev) => [
        ...prev,
        { id: replyId, role: 'assistant', text: '', at: Date.now() },
      ])

      await api.streamChatMessage(
        { message: trimmed, history },
        {
          onText: (chunk) => {
            streamed += chunk
            setMessages((prev) =>
              prev.map((m) => (m.id === replyId ? { ...m, text: streamed } : m)),
            )
          },
          onFollowUps: (followUps) => {
            if (followUps.length > 0) setSuggestions(followUps)
          },
          onGrounding: (grounding) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === replyId
                  ? { ...m, grounding: { ...grounding, consequential } }
                  : m,
              ),
            )
          },
        },
      )

      if (!streamed.trim()) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === replyId ? { ...m, text: t('chat.unavailable') } : m,
          ),
        )
      }
    } catch (err) {
      // Drop the empty placeholder before appending the error bubble.
      setMessages((prev) => prev.filter((m) => m.id !== replyId))
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

  /**
   * Rates an answer. These two buttons were decorative — styled, labelled and
   * inert — on the one surface where "this visa answer is wrong" is the most
   * valuable thing a student can tell us. A thumbs-down now files a real
   * report against the question and the answer it applies to.
   */
  async function rateAnswer(message: ChatMessage, helpful: boolean) {
    if (ratedIds[message.id]) return
    setRatedIds((prev) => ({ ...prev, [message.id]: helpful ? 'up' : 'down' }))

    const asked = [...messages].reverse().find((m) => m.role === 'user' && m.at <= message.at)
    try {
      await api.submitFeedback({
        kind: 'feedback',
        message: [
          `Assistant answer rated ${helpful ? 'helpful' : 'NOT helpful'}.`,
          asked ? `Question: ${asked.text}` : null,
          `Answer: ${message.text}`,
        ]
          .filter(Boolean)
          .join('\n\n')
          .slice(0, 4000),
      })
    } catch {
      // A rating is not worth an error banner over the conversation; the
      // button stays marked so the student is not asked to repeat it.
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
                  {message.text ? (
                    message.text
                  ) : (
                    // The reply streams in, so this bubble exists before its
                    // first token. Showing the dots here — rather than an empty
                    // box plus a separate "typing" row — keeps one element per
                    // reply, in the place the answer is about to appear.
                    <span className="flex items-center gap-1 py-1" aria-label={t('chat.typing')}>
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-pnu-muted [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-pnu-muted [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-pnu-muted" />
                    </span>
                  )}
                </div>
                {/* Says what the answer rests on. An ungrounded reply to a visa
                    question is the app's worst failure mode — it reads exactly
                    like a sourced one — so the caution is stated on the answer
                    itself rather than in a footer nobody reads.
                    
                    The caution keys off "no citable source", not off ragUsed.
                    Measured against the live index, a health-insurance question
                    retrieves three machine-generated curriculum payloads and
                    nothing else: ragUsed is true, yet the answer rests on
                    nothing relevant to what was asked. Keying off ragUsed would
                    stay silent there. The topic gate is what keeps this off
                    greetings and ordinary course questions — those retrieve
                    curriculum too, but being wrong about them costs nothing. */}
                {message.text && message.grounding ? (
                  message.grounding.sources.length > 0 ? (
                    <p className="mt-1 px-1 text-[10px] leading-relaxed text-pnu-muted">
                      {t('chat.groundedIn')}{' '}
                      <span className="font-medium">
                        {message.grounding.sources.join(' · ')}
                      </span>
                    </p>
                  ) : message.grounding.consequential ? (
                    <p className="mt-1.5 rounded-[12px] bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-900 ring-1 ring-amber-100">
                      {t('chat.ungroundedNotice')}
                    </p>
                  ) : null
                ) : null}

                {/* Timestamp and the rating / copy controls only make sense once
                    there is an answer to time-stamp, rate or copy. */}
                {message.text ? (
                  <p className="mt-1 px-1 text-[10px] font-medium text-pnu-muted">
                    {formatTime(message.at, locale)}
                  </p>
                ) : null}
                <div
                  className={`mt-1.5 flex items-center gap-1.5 px-0.5 ${message.text ? '' : 'hidden'}`}
                >
                  <button
                    type="button"
                    onClick={() => rateAnswer(message, true)}
                    disabled={Boolean(ratedIds[message.id])}
                    className={`rounded-full border border-black/10 p-1.5 transition hover:text-pnu-blue disabled:opacity-40 ${
                      ratedIds[message.id] === 'up' ? 'text-pnu-blue' : 'text-pnu-muted'
                    }`}
                    aria-label={t('chat.feedbackUp')}
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => rateAnswer(message, false)}
                    disabled={Boolean(ratedIds[message.id])}
                    className={`rounded-full border border-black/10 p-1.5 transition hover:text-pnu-blue disabled:opacity-40 ${
                      ratedIds[message.id] === 'down' ? 'text-pnu-blue' : 'text-pnu-muted'
                    }`}
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

        {/* Only shown when no streaming bubble is standing in for it — otherwise
            one pending reply drew two indicators at once. */}
        {sending && !messages.some((m) => m.role === 'assistant' && !m.text) ? (
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
