import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useApp } from '@/state/AppContext'

function formatTime(ms: number): string {
  const seconds = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${s}s`
}

export function SessionControls() {
  const { session, settings, startSession, stopSession } = useApp()
  const [, force] = useState(0)

  useEffect(() => {
    if (session.status !== 'running' || !session.endsAt) return
    const id = window.setInterval(() => force((n) => n + 1), 250)
    return () => window.clearInterval(id)
  }, [session.status, session.endsAt])

  const accuracy =
    session.correct + session.wrong > 0 ? Math.round((session.correct / (session.correct + session.wrong)) * 100) : null

  const timeLeft = session.endsAt != null ? session.endsAt - Date.now() : null

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-stone-200 bg-white p-3 shadow-sm">
      <div className="flex items-center gap-2">
        {session.status === 'running' ? (
          <Button variant="outline" onClick={stopSession}>
            Stop
          </Button>
        ) : (
          <Button onClick={startSession}>{session.status === 'finished' ? 'Start again' : 'Start session'}</Button>
        )}
        <span className="text-xs text-stone-500">
          Mode:{' '}
          <span className="font-medium text-stone-700">
            {settings.sessionMode === 'open'
              ? 'Open'
              : settings.sessionMode === 'fixed'
                ? `${settings.fixedLength} notes`
                : `${settings.sprintSeconds}s sprint`}
          </span>
        </span>
      </div>
      <div className="flex gap-4 text-sm">
        <Stat label="Correct" value={String(session.correct)} tone="positive" />
        <Stat label="Wrong" value={String(session.wrong)} tone="negative" />
        <Stat label="Streak" value={String(session.streak)} />
        <Stat label="Best" value={String(session.bestStreak)} />
        {accuracy != null ? <Stat label="Acc." value={`${accuracy}%`} /> : null}
        {timeLeft != null && session.status === 'running' ? (
          <Stat label="Time" value={formatTime(timeLeft)} tone="alert" />
        ) : null}
        {settings.sessionMode === 'fixed' && session.status !== 'idle' ? (
          <Stat label="Progress" value={`${session.total}/${settings.fixedLength}`} />
        ) : null}
      </div>
    </div>
  )
}

interface StatProps {
  label: string
  value: string
  tone?: 'positive' | 'negative' | 'alert'
}

function Stat({ label, value, tone }: StatProps) {
  const color =
    tone === 'positive'
      ? 'text-emerald-700'
      : tone === 'negative'
        ? 'text-rose-700'
        : tone === 'alert'
          ? 'text-amber-700'
          : 'text-stone-800'
  return (
    <div className="flex flex-col items-center">
      <span className="text-[10px] uppercase tracking-wide text-stone-400">{label}</span>
      <span className={`font-mono text-base font-semibold ${color}`}>{value}</span>
    </div>
  )
}
