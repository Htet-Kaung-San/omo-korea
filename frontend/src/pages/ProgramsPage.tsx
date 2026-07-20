import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, Sparkles } from 'lucide-react'
import { api } from '@/api'
import type { ProgramItem } from '@/types/api'
import { PageHeader } from '@/components/layout/PageHeader'
import { useLanguage } from '@/context/LanguageContext'
import { getProgramIconForItem } from '@/utils/programIcons'

type AiProgramItem = ProgramItem & {
  score?: number
  matchHint?: string
  aiRecommended?: boolean
}

function normalizeText(value?: string | null): string {
  return String(value ?? '').trim().replace(/\s+/g, ' ').toLowerCase()
}

function hasAny(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword))
}

function programDedupeKey(program: ProgramItem): string {
  return [
    normalizeText(program.title),
    normalizeText(program.date),
    normalizeText(program.category),
  ].join('|')
}

function inferProgramMatchHint(program: ProgramItem, fallback?: string): string {
  const text = normalizeText([
    program.title,
    program.description,
    program.category,
    program.sourceUrl,
  ].filter(Boolean).join(' '))

  const reasons: string[] = []

  if (fallback && fallback !== 'Available for your year') {
    reasons.push(fallback)
  }

  if (hasAny(text, ['international', 'topik', 'korean', 'buddy', 'visa', 'dorm'])) {
    reasons.push('International student support')
  }

  if (hasAny(text, ['career', 'job', 'intern', 'resume', 'interview', 'startup', 'mentor', 'mentoring'])) {
    reasons.push('Career preparation')
  }

  if (hasAny(text, ['ai', 'sw', 'software', 'digital', 'data', 'gemini', 'coding', 'startup'])) {
    reasons.push('Digital / AI skill building')
  }

  if (hasAny(text, ['culture', 'festival', 'busan', 'global'])) {
    reasons.push('Cultural adaptation')
  }

  if (hasAny(text, ['counsel', 'mental', 'wellbeing', 'health'])) {
    reasons.push('Student wellbeing support')
  }

  reasons.push('Available for your academic year')

  return [...new Set(reasons)].slice(0, 3).join(' · ')
}

function dedupePrograms(programs: AiProgramItem[]): AiProgramItem[] {
  const byKey = new Map<string, AiProgramItem>()

  programs.forEach((program) => {
    const key = programDedupeKey(program)
    const existing = byKey.get(key)

    if (!existing) {
      byKey.set(key, program)
      return
    }

    const existingScore = existing.score ?? 0
    const currentScore = program.score ?? 0

    if (
      (program.aiRecommended && !existing.aiRecommended) ||
      currentScore > existingScore ||
      (!existing.sourceUrl && program.sourceUrl)
    ) {
      byKey.set(key, program)
    }
  })

  return [...byKey.values()]
}

function mergeAiPrograms(aiPrograms: ProgramItem[], allPrograms: ProgramItem[]): AiProgramItem[] {
  const merged = new Map<string, AiProgramItem>()

  allPrograms.forEach((program) => {
    merged.set(String(program.id), {
      ...program,
      aiRecommended: false,
    })
  })

  aiPrograms.forEach((program, index) => {
    const id = String(program.id)
    const existing = merged.get(id)
    const rawHint = (program as AiProgramItem).matchHint

    merged.set(id, {
      ...existing,
      ...program,
      id,
      aiRecommended: true,
      score: (program as AiProgramItem).score ?? Math.max(60, 95 - index * 3),
      matchHint: inferProgramMatchHint(program, rawHint),
    })
  })

  return dedupePrograms([...merged.values()]).sort((a, b) => {
    if (a.aiRecommended !== b.aiRecommended) return a.aiRecommended ? -1 : 1
    if ((b.score ?? 0) !== (a.score ?? 0)) return (b.score ?? 0) - (a.score ?? 0)
    return normalizeText(a.title).localeCompare(normalizeText(b.title))
  })
}

export function ProgramsPage() {
  const { language, t } = useLanguage()
  const [programs, setPrograms] = useState<AiProgramItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    setLoading(true)
    setError('')

    Promise.all([
      api.getPrograms().catch(() => []),
      api.getAiDashboard().catch(() => null),
    ])
      .then(([allPrograms, dashboard]) => {
        if (cancelled) return

        const aiPrograms = dashboard?.matchedPrograms ?? []
        setPrograms(mergeAiPrograms(aiPrograms, allPrograms))
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t('academic.loadError'))
          setPrograms([])
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [language, t])

  const aiRecommendedPrograms = useMemo(
    () => programs.filter((program) => program.aiRecommended).slice(0, 6),
    [programs],
  )

  const otherPrograms = useMemo(() => {
    const aiIds = new Set(aiRecommendedPrograms.map((program) => String(program.id)))
    return programs.filter((program) => !aiIds.has(String(program.id)))
  }, [aiRecommendedPrograms, programs])

  function renderProgramCard(program: AiProgramItem, variant: 'ai' | 'default') {
    const Icon = getProgramIconForItem(program)

    return (
      <article
        key={`${variant}-${program.id}`}
        className="rounded-2xl border border-pnu-border bg-white p-4 shadow-sm"
      >
        <div className="flex items-start gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
              variant === 'ai' ? 'bg-violet-50 text-violet-600' : 'bg-blue-50 text-pnu-blue'
            }`}
          >
            <Icon className="h-5 w-5" strokeWidth={1.8} />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <Link
                to={`/academic/programs/${program.id}`}
                className="text-sm font-bold text-pnu-text hover:text-pnu-blue-light"
              >
                {program.title}
              </Link>

              {variant === 'ai' ? (
                <span className="shrink-0 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                  AI
                </span>
              ) : null}
            </div>

            {program.category ? (
              <p className="mt-0.5 text-xs font-medium text-pnu-muted">{program.category}</p>
            ) : null}

            {program.date ? (
              <p className="mt-2 text-xs font-semibold text-pnu-blue-light">{program.date}</p>
            ) : null}

            {variant === 'ai' && program.matchHint ? (
              <p className="mt-2 rounded-xl bg-violet-50 px-3 py-2 text-[12px] leading-relaxed text-violet-700">
                {program.matchHint}
              </p>
            ) : null}

            {program.sourceUrl ? (
              <a
                href={program.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-pnu-blue-light hover:bg-blue-100"
              >
                {t('academic.viewAnnouncement')}
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            ) : null}
          </div>
        </div>
      </article>
    )
  }

  return (
    <div>
      <PageHeader title={t('academic.programs')} subtitle={t('academic.programsSubtitle')} back />

      <div className="space-y-5 px-5 py-5">
        <section className="rounded-[22px] bg-gradient-to-br from-violet-600 to-blue-600 p-4 text-white shadow-sm">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-[16px] font-bold">AI Extracurricular Recommendations</h2>
              <p className="mt-1 text-[13px] leading-relaxed text-white/85">
                Ranked using profile signals, academic year, program category, and international student relevance.
              </p>
            </div>
          </div>
        </section>

        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        ) : null}

        {loading ? <p className="text-sm text-pnu-muted">{t('academic.loading')}</p> : null}

        {!loading && !error && programs.length === 0 ? (
          <p className="text-sm text-pnu-muted">{t('academic.noPrograms')}</p>
        ) : null}

        {!loading && !error && aiRecommendedPrograms.length > 0 ? (
          <section className="space-y-3">
            <div className="px-1">
              <h3 className="text-[15px] font-bold text-pnu-text">Recommended for You</h3>
              <p className="mt-0.5 text-[12px] text-pnu-muted">
                Duplicate programs are removed and match reasons are summarized for easier comparison.
              </p>
            </div>
            {aiRecommendedPrograms.map((program) => renderProgramCard(program, 'ai'))}
          </section>
        ) : null}

        {!loading && !error && otherPrograms.length > 0 ? (
          <section className="space-y-3">
            <div className="px-1">
              <h3 className="text-[15px] font-bold text-pnu-text">All Programs</h3>
            </div>
            {otherPrograms.map((program) => renderProgramCard(program, 'default'))}
          </section>
        ) : null}
      </div>
    </div>
  )
}
