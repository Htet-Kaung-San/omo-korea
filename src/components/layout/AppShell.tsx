import { NavLink, Outlet } from 'react-router-dom'
import { BookOpen, Bot, Building2, Home, MessageSquare, User } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

const tabs = [
  { to: '/', labelKey: 'nav.home', icon: Home, end: true },
  { to: '/academic', labelKey: 'nav.academic', icon: BookOpen },
  { to: '/chat', labelKey: 'nav.aiChat', icon: Bot },
  { to: '/campus-life', labelKey: 'nav.campusLife', icon: Building2 },
  { to: '/community', labelKey: 'nav.community', icon: MessageSquare },
  { to: '/my', labelKey: 'nav.my', icon: User },
]

export function AppShell() {
  const { t } = useLanguage()

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col bg-pnu-surface shadow-xl">
      <main className="flex-1 overflow-y-auto pb-24">
        <Outlet />
      </main>

      <nav
        aria-label="Main navigation"
        className="fixed bottom-0 left-1/2 z-10 w-full max-w-md -translate-x-1/2 border-t border-pnu-border bg-white/95 backdrop-blur"
      >
        <ul className="grid grid-cols-6">
          {tabs.map(({ to, labelKey, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  [
                    'flex min-h-[56px] flex-col items-center justify-center gap-0.5 px-0.5 py-2 text-[9px] font-medium transition',
                    isActive ? 'text-pnu-blue-light' : 'text-pnu-muted hover:text-pnu-text',
                  ].join(' ')
                }
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} />
                {t(labelKey)}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
