import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Catches render errors so one broken component cannot blank the whole app.
 *
 * Without this, a single thrown error during render unmounts the entire tree
 * and leaves a white screen with no route, no navigation and no way back — the
 * user's only recovery is to guess that reloading might help. React gives no
 * built-in fallback for this; a class component with componentDidCatch is still
 * the only way to intercept it.
 *
 * Deliberately not translated. The language context sits inside this boundary,
 * so if the failure happened at or above it, calling t() here would throw a
 * second time while handling the first.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // The message the user sees says nothing useful for debugging, so the real
    // one goes to the console where a developer will look for it.
    console.error('[ErrorBoundary] render failed:', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="flex min-h-screen items-center justify-center bg-[#E8EEF5] p-6">
        <div className="w-full max-w-sm rounded-[24px] bg-white p-6 text-center shadow-[0_4px_24px_rgba(0,61,130,0.08)]">
          <h1 className="text-[17px] font-bold text-pnu-text">
            Something went wrong
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-pnu-muted">
            This screen failed to load. Reloading usually fixes it.
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 w-full rounded-[14px] bg-pnu-blue py-3 text-[15px] font-bold text-white transition active:scale-[0.98]"
          >
            Reload
          </button>
          <button
            type="button"
            onClick={() => {
              // A full navigation rather than a router push: the router lives
              // inside this boundary and may be part of what failed.
              window.location.href = '/'
            }}
            className="mt-2 w-full rounded-[14px] border border-pnu-border py-3 text-[14px] font-semibold text-pnu-blue transition active:scale-[0.98]"
          >
            Go home
          </button>

          {import.meta.env.DEV ? (
            <pre className="mt-4 max-h-40 overflow-auto whitespace-pre-wrap rounded-xl bg-black/5 p-3 text-left text-[11px] leading-snug text-pnu-muted">
              {this.state.error.message}
            </pre>
          ) : null}
        </div>
      </div>
    )
  }
}
