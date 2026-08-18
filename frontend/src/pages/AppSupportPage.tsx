import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { api } from '@/api'
import { useLanguage } from '@/context/LanguageContext'

export function AppSupportPage() {
  const { t } = useLanguage()
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  // Success is shown only once the backend confirms the report was stored;
  // this form previously flipped `sent` and dropped the text.
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = message.trim()
    if (!text || sending) return

    setSending(true)
    setError('')
    try {
      await api.submitFeedback({ message: text, kind: 'app-support' })
      setSent(true)
      setMessage('')
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
      <PageHeader
        title={t('support.topic.appSupport')}
        subtitle={t('support.topic.appSupportDesc')}
        back
      />
      <form onSubmit={handleSubmit} className="space-y-4 px-4 py-4">
        {sent ? (
          <p className="rounded-[18px] bg-emerald-50 px-4 py-3 text-sm text-emerald-700 ring-1 ring-emerald-100">
            {t('support.app.sent')}
          </p>
        ) : null}
        {error ? (
          <p className="rounded-[18px] bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-100">
            {error}
          </p>
        ) : null}
        <label className="block">
          <span className="mb-2 block text-[13px] font-semibold text-pnu-text">
            {t('support.app.messageLabel')}
          </span>
          <textarea
            value={message}
            onChange={(e) => {
              setSent(false)
              setError('')
              setMessage(e.target.value)
            }}
            rows={6}
            placeholder={t('support.app.messagePlaceholder')}
            className="w-full resize-none rounded-[18px] border-0 bg-white px-4 py-3 text-sm text-pnu-text shadow-sm ring-1 ring-black/5 outline-none placeholder:text-pnu-muted focus:ring-pnu-blue/30"
          />
        </label>
        <Button type="submit" className="w-full" disabled={!message.trim() || sending}>
          {sending ? t('common.sending') : t('support.app.submit')}
        </Button>
        <p className="text-center text-[12px] text-pnu-muted">{t('support.app.hint')}</p>
      </form>
    </div>
  )
}
