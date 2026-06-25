import { useEffect, useState } from 'react'
import { api } from '@/api'
import {
  INTEREST_OPTIONS,
  MAJOR_OPTIONS,
  NATIONALITY_OPTIONS,
} from '@/data/options'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

export function ProfilePage() {
  const { user, logout, refreshUser } = useAuth()
  const { t } = useLanguage()
  const [name, setName] = useState('')
  const [nationality, setNationality] = useState('')
  const [major, setMajor] = useState('')
  const [interests, setInterests] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    setName(user.name)
    setNationality(user.nationality)
    setMajor(user.major)
    setInterests(user.interests)
  }, [user])

  function toggleInterest(tag: string) {
    setInterests((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    )
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!name.trim() || !nationality || !major) {
      setError(t('profile.requiredError'))
      return
    }

    setSaving(true)
    try {
      await api.updateProfile({
        name: name.trim(),
        nationality,
        major,
        interests,
      })
      await refreshUser()
      setMessage(t('profile.saveSuccess'))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('profile.saveError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader title={t('profile.title')} subtitle={t('profile.subtitle')} />

      <form className="space-y-5 px-5 py-5" onSubmit={handleSave}>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-pnu-muted">{t('profile.studentId')}</p>
          <p className="mt-1 text-base font-semibold text-pnu-text">{user?.studentId}</p>
        </Card>

        <Input label={t('profile.fullName')} value={name} onChange={(e) => setName(e.target.value)} />

        <div className="space-y-1.5">
          <label htmlFor="nationality" className="block text-sm font-medium text-pnu-text">
            {t('profile.nationality')}
          </label>
          <select
            id="nationality"
            value={nationality}
            onChange={(e) => setNationality(e.target.value)}
            className="w-full rounded-xl border border-pnu-border bg-white px-3.5 py-3 text-sm outline-none focus:border-pnu-blue-light focus:ring-2 focus:ring-pnu-blue-light/20"
          >
            <option value="">{t('profile.selectNationality')}</option>
            {NATIONALITY_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="major" className="block text-sm font-medium text-pnu-text">
            {t('profile.major')}
          </label>
          <select
            id="major"
            value={major}
            onChange={(e) => setMajor(e.target.value)}
            className="w-full rounded-xl border border-pnu-border bg-white px-3.5 py-3 text-sm outline-none focus:border-pnu-blue-light focus:ring-2 focus:ring-pnu-blue-light/20"
          >
            <option value="">{t('profile.selectMajor')}</option>
            {MAJOR_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-pnu-text">{t('profile.interests')}</p>
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map((tag) => {
              const active = interests.includes(tag)
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleInterest(tag)}
                  className={[
                    'rounded-full px-3 py-1.5 text-xs font-semibold transition',
                    active
                      ? 'bg-pnu-blue text-white'
                      : 'border border-pnu-border bg-white text-pnu-muted hover:text-pnu-text',
                  ].join(' ')}
                >
                  {tag}
                </button>
              )
            })}
          </div>
        </div>

        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        ) : null}
        {message ? (
          <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>
        ) : null}

        <Button type="submit" fullWidth disabled={saving}>
          {saving ? t('profile.saving') : t('profile.save')}
        </Button>

        <Button type="button" variant="danger" fullWidth onClick={() => logout()}>
          {t('profile.logout')}
        </Button>
      </form>
    </div>
  )
}
