import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { BookOpen, Bot, Home, User, X } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { ChatPanel } from '@/components/chat/ChatPanel'

const tabs = [
  { to: '/', labelKey: 'nav.home', icon: Home, end: true },
  { to: '/academic', labelKey: 'nav.academic', icon: BookOpen },
  { to: '/my', labelKey: 'nav.my', icon: User },
]

const topPills = [
  { to: '/', labelKey: 'topNav.home', end: true },
  { to: '/campus-life', labelKey: 'topNav.campusLife' },
  { to: '/career-opportunities', labelKey: 'topNav.careerOpportunities' },
  { to: '/community', labelKey: 'topNav.community' },
  { to: '/support', labelKey: 'topNav.support' },
]

export function AppShell() {
  const { t } = useLanguage()
  const [chatOpen, setChatOpen] = useState(false)

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col bg-pnu-surface shadow-xl">
      <main className="flex-1 overflow-y-auto pb-24">
        <nav
          aria-label="Section navigation"
          className="border-b border-pnu-border bg-pnu-surface px-5 py-3"
        >
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-0.5">
            {topPills.map(({ to, labelKey, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  [
                    'shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition',
                    isActive
                      ? 'border-pnu-blue bg-pnu-blue text-white shadow-sm'
                      : 'border-pnu-border bg-white text-pnu-muted hover:text-pnu-text',
                  ].join(' ')
                }
              >
                {t(labelKey)}
              </NavLink>
            ))}
          </div>
        </nav>
        <Outlet />
      </main>

      {chatOpen ? (
        <>
          <button
            type="button"
            aria-label="Close chat"
            onClick={() => setChatOpen(false)}
            className="fixed inset-0 z-20 bg-slate-950/30 backdrop-blur-[1px]"
          />
          <div className="chat-panel-enter fixed bottom-36 right-[max(1rem,calc((100vw-28rem)/2+1rem))] z-30 w-[calc(100vw-2rem)] max-w-sm">
            <ChatPanel />
          </div>
        </>
      ) : null}

      <button
        type="button"
        aria-label={t('nav.aiChat')}
        aria-expanded={chatOpen}
        onClick={() => setChatOpen((open) => !open)}
        className="fixed bottom-20 right-[max(1rem,calc((100vw-28rem)/2+1rem))] z-40 flex h-14 w-14 items-center justify-center rounded-full bg-pnu-blue text-white shadow-lg shadow-blue-900/25 transition hover:scale-105 hover:bg-pnu-blue-light active:scale-95"
      >
        {chatOpen ? (
          <X className="h-6 w-6" strokeWidth={1.9} />
        ) : (
          <Bot className="h-6 w-6" strokeWidth={1.9} />
        )}
      </button>

      <nav
        aria-label="Main navigation"
        className="fixed bottom-0 left-1/2 z-10 w-full max-w-md -translate-x-1/2 border-t border-pnu-border bg-white/95 backdrop-blur"
      >
        <ul className="grid grid-cols-3">
          {tabs.map(({ to, labelKey, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  [
                    'flex min-h-[56px] flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-medium transition',
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
