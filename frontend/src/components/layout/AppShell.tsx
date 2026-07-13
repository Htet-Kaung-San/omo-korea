import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  BookOpen,
  Bot,
  Building2,
  Home,
  User,
  Users,
  X,
} from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { ChatPanel } from '@/components/chat/ChatPanel'
import pnuSeal from '@/assets/pnu-seal.png'

const tabs = [
  { to: '/', labelKey: 'nav.home', icon: Home, end: true },
  { to: '/campus-life', labelKey: 'nav.campusLife', icon: Building2 },
  { to: '/academic', labelKey: 'nav.academic', icon: BookOpen },
  { to: '/community', labelKey: 'nav.community', icon: Users },
  { to: '/my', labelKey: 'nav.my', icon: User },
]

export function AppShell() {
  const { t } = useLanguage()
  const location = useLocation()
  const [chatOpen, setChatOpen] = useState(false)

  function isTabActive(to: string, end?: boolean) {
    if (end) return location.pathname === '/'
    return location.pathname === to || location.pathname.startsWith(`${to}/`)
  }

  return (
    <div className="relative mx-auto flex min-h-full w-full max-w-md flex-col overflow-hidden bg-pnu-surface shadow-xl">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(ellipse_at_top,_rgba(0,84,166,0.12),_transparent_70%)]"
      />

      <header className="relative z-10 flex items-center justify-between gap-3 border-b border-pnu-border/80 bg-white/80 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <img
            src={pnuSeal}
            alt="Pusan National University"
            className="h-9 w-9 rounded-full object-contain ring-2 ring-pnu-blue/10"
          />
          <div>
            <p className="text-[15px] font-bold leading-none tracking-tight text-pnu-blue">
              Hey! PNU
            </p>
            <p className="mt-0.5 text-[10px] font-medium text-pnu-muted">
              Pusan National University
            </p>
          </div>
        </div>
      </header>

      <main className="relative z-0 flex-1 overflow-y-auto pb-24">
        <Outlet />
      </main>

      {chatOpen ? (
        <>
          <button
            type="button"
            aria-label="Close chat"
            onClick={() => setChatOpen(false)}
            className="fixed inset-0 z-20 bg-slate-950/35 backdrop-blur-[1px]"
          />
          <div className="chat-panel-enter fixed bottom-28 right-[max(1rem,calc((100vw-28rem)/2+1rem))] z-30 w-[calc(100vw-2rem)] max-w-sm">
            <ChatPanel />
          </div>
        </>
      ) : null}

      <button
        type="button"
        aria-label={t('nav.aiChat')}
        aria-expanded={chatOpen}
        onClick={() => setChatOpen((open) => !open)}
        className="fixed bottom-24 right-[max(1rem,calc((100vw-28rem)/2+1rem))] z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-pnu-blue to-pnu-blue-light text-white shadow-lg shadow-blue-900/30 transition hover:scale-105 active:scale-95"
      >
        {chatOpen ? (
          <X className="h-6 w-6" strokeWidth={1.9} />
        ) : (
          <Bot className="h-6 w-6" strokeWidth={1.9} />
        )}
      </button>

      <nav
        aria-label="Main navigation"
        className="fixed bottom-0 left-1/2 z-10 w-full max-w-md -translate-x-1/2 border-t border-pnu-border/80 bg-white/95 px-2 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-md"
      >
        <ul className="grid grid-cols-5 gap-0.5">
          {tabs.map(({ to, labelKey, icon: Icon, end }) => {
            const active = isTabActive(to, end)
            return (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={[
                    'flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1.5 text-[10px] font-semibold transition',
                    active
                      ? 'bg-pnu-blue text-white shadow-md shadow-blue-900/20'
                      : 'text-pnu-muted hover:bg-pnu-surface hover:text-pnu-blue',
                  ].join(' ')}
                >
                  <Icon className="h-4 w-4" strokeWidth={active ? 2.2 : 1.75} />
                  <span className="truncate">{t(labelKey)}</span>
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
