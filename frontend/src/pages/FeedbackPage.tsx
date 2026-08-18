import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { api } from '@/api'
import { useLanguage } from '@/context/LanguageContext'

/**
 * This form used to call setSent(true) and discard the text.
 *
 * A student reporting "the visa information on page X is wrong" is the single
 * most valuable message an app about official information can receive, and it
 * was being answered with a green confirmation and a shrug. Success is now
 * shown only when the backend has actually stored the report.
 */
export function FeedbackPage() {
  const { t } = useLanguage()
  const [feedback, setFeedback] = useState('')
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const message = feedback.trim()
    if (!message || sending) return

    setSending(true)
    setError('')
    try {
      await api.submitFeedback({ message, kind: 'feedback' })
      setSent(true)
      setFeedback('')
    } catch (err) {
      // Not err.message: apiFetch always throws HttpError, so that branch
      // would show the student developer text like "Check that the API server
      // is running." and make the translated string unreachable.
      void err
      setError(t('support.sendFailed'))
    } finally {
      setSending(false)
    }
  }

  return (
    <div>
      <PageHeader title={t('support.more.feedback')} subtitle={t('support.more.feedbackDesc')} back />
      <form onSubmit={handleSubmit} className="space-y-4 px-4 py-4">
        {sent ? (
          <p className="rounded-[18px] bg-emerald-50 px-4 py-3 text-sm text-emerald-700 ring-1 ring-emerald-100">
            {t('support.feedback.sent')}
          </p>
        ) : null}
        {error ? (
          <p className="rounded-[18px] bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-100">
            {error}
          </p>
        ) : null}
        <textarea
          value={feedback}
          onChange={(e) => {
            setSent(false)
            setError('')
            setFeedback(e.target.value)
          }}
          rows={7}
          placeholder={t('support.feedback.placeholder')}
          className="w-full resize-none rounded-[18px] border-0 bg-white px-4 py-3 text-sm text-pnu-text shadow-sm ring-1 ring-black/5 outline-none placeholder:text-pnu-muted focus:ring-pnu-blue/30"
        />
        <Button type="submit" className="w-full" disabled={!feedback.trim() || sending}>
          {sending ? t('common.sending') : t('support.feedback.submit')}
        </Button>
      </form>
    </div>
  )
}
