import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/context/LanguageContext'

export function AppSupportPage() {
  const { t } = useLanguage()
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) return
    setSent(true)
    setMessage('')
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
        <label className="block">
          <span className="mb-2 block text-[13px] font-semibold text-pnu-text">
            {t('support.app.messageLabel')}
          </span>
          <textarea
            value={message}
            onChange={(e) => {
              setSent(false)
              setMessage(e.target.value)
            }}
            rows={6}
            placeholder={t('support.app.messagePlaceholder')}
            className="w-full resize-none rounded-[18px] border-0 bg-white px-4 py-3 text-sm text-pnu-text shadow-sm ring-1 ring-black/5 outline-none placeholder:text-pnu-muted focus:ring-pnu-blue/30"
          />
        </label>
        <Button type="submit" className="w-full" disabled={!message.trim()}>
          {t('support.app.submit')}
        </Button>
        <p className="text-center text-[12px] text-pnu-muted">{t('support.app.hint')}</p>
      </form>
    </div>
  )
}
