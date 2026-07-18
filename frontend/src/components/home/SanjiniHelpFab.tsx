import { useNavigate } from 'react-router-dom'
import { useLanguage } from '@/context/LanguageContext'
import sanjini from '@/assets/pnu-character.png'

export function SanjiniHelpFab() {
  const navigate = useNavigate()
  const { t } = useLanguage()

  return (
    <button
      type="button"
      onClick={() => navigate('/ai')}
      aria-label={t('nav.aiAssistant')}
      className="fixed bottom-[calc(4.25rem+env(safe-area-inset-bottom))] right-[max(0.75rem,calc((100vw-28rem)/2+0.75rem))] z-30 flex items-end gap-2 transition active:scale-[0.98]"
    >
      <span className="mb-2 max-w-[9.5rem] rounded-2xl rounded-br-md border border-[#B7D3F5] bg-white px-3 py-2 text-left shadow-md">
        <span className="block text-[11px] font-medium leading-tight text-pnu-muted">
          {t('home.askSanjiniNeedHelp')}
        </span>
        <span className="mt-0.5 block text-[12px] font-bold leading-tight text-pnu-blue">
          {t('home.askSanjiniCta')}
        </span>
      </span>
      <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-white shadow-lg ring-1 ring-black/8">
        <img src={sanjini} alt="" className="h-12 w-12 object-contain" draggable={false} />
      </span>
    </button>
  )
}
