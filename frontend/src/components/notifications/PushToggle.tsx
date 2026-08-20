import { BellRing, BellOff, Loader2 } from 'lucide-react'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { useLanguage } from '@/context/LanguageContext'

/**
 * Turns phone notifications on or off.
 *
 * Renders nothing when push cannot work — an unsupported browser or a server
 * without keys. A dead switch is worse than no switch: a student who taps it
 * and sees nothing happen concludes the notifications are broken rather than
 * unavailable.
 *
 * The one case it does render without a working switch is `denied`, because
 * that state is only recoverable from browser settings and the student needs
 * telling.
 */
export function PushToggle() {
  const { t } = useLanguage()
  const { state, error, busy, subscribe, unsubscribe, sendTest } = usePushNotifications()

  if (state === 'loading' || state === 'unsupported' || state === 'unconfigured') return null

  const on = state === 'subscribed'

  return (
    <div className="rounded-[18px] bg-white p-3.5 shadow-sm ring-1 ring-black/5">
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
            on ? 'bg-[#E8F3FF] text-pnu-blue' : 'bg-[#F2F2F7] text-pnu-muted'
          }`}
        >
          {on ? <BellRing className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold text-pnu-text">{t('push.title')}</p>
          <p className="mt-0.5 text-[11.5px] leading-relaxed text-pnu-muted">
            {state === 'denied' ? t('push.blocked') : on ? t('push.on') : t('push.off')}
          </p>

          {error ? (
            <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-900 ring-1 ring-amber-100">
              {error}
            </p>
          ) : null}

          {state !== 'denied' ? (
            <div className="mt-2.5 flex items-center gap-2">
              <button
                type="button"
                onClick={on ? unsubscribe : subscribe}
                disabled={busy}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold transition disabled:opacity-50 ${
                  on
                    ? 'bg-[#F2F2F7] text-pnu-muted hover:text-pnu-text'
                    : 'bg-pnu-blue text-white hover:bg-pnu-blue-light'
                }`}
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                {on ? t('push.turnOff') : t('push.turnOn')}
              </button>

              {on ? (
                <button
                  type="button"
                  onClick={sendTest}
                  disabled={busy}
                  className="rounded-full px-3 py-1.5 text-[11px] font-bold text-pnu-blue transition hover:text-pnu-blue-light disabled:opacity-50"
                >
                  {t('push.sendTest')}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
