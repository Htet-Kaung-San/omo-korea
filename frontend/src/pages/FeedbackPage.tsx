import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/context/LanguageContext'

export function FeedbackPage() {
  const { t } = useLanguage()
  const [feedback, setFeedback] = useState('')
  const [sent, setSent] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!feedback.trim()) return
    setSent(true)
    setFeedback('')
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
        <textarea
          value={feedback}
          onChange={(e) => {
            setSent(false)
            setFeedback(e.target.value)
          }}
          rows={7}
          placeholder={t('support.feedback.placeholder')}
          className="w-full resize-none rounded-[18px] border-0 bg-white px-4 py-3 text-sm text-pnu-text shadow-sm ring-1 ring-black/5 outline-none placeholder:text-pnu-muted focus:ring-pnu-blue/30"
        />
        <Button type="submit" className="w-full" disabled={!feedback.trim()}>
          {t('support.feedback.submit')}
        </Button>
      </form>
    </div>
  )
}
