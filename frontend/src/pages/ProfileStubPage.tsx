import { useNavigate } from 'react-router-dom'
import { ChevronLeft, FileText } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

type StubKind = 'documents'

const META: Record<
  StubKind,
  { titleKey: string; bodyKey: string; icon: typeof FileText }
> = {
  documents: {
    titleKey: 'profile.documents',
    bodyKey: 'profile.documentsEmpty',
    icon: FileText,
  },
}

export function ProfileStubPage({ kind }: { kind: StubKind }) {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const meta = META[kind]
  const Icon = meta.icon

  return (
    <div className="pb-8">
      <div className="flex items-center gap-2 px-4 pb-2 pt-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-pnu-text shadow-sm ring-1 ring-black/5"
          aria-label={t('common.back')}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-[18px] font-bold text-pnu-text">{t(meta.titleKey)}</h1>
      </div>

      <div className="mx-4 mt-8 flex flex-col items-center rounded-[22px] bg-white px-6 py-12 text-center shadow-sm ring-1 ring-black/5">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-pnu-blue/10 text-pnu-blue">
          <Icon className="h-7 w-7" />
        </div>
        <p className="text-[15px] font-semibold text-pnu-text">{t(meta.titleKey)}</p>
        <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-pnu-muted">
          {t(meta.bodyKey)}
        </p>
      </div>
    </div>
  )
}
