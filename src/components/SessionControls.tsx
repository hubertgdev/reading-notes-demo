import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useApp } from '@/state/AppContext'

function formatTime(ms: number): string {
  const seconds = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${s}s`
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
    <div className="flex flex-col items-center leading-tight">
      <span className="text-[9px] uppercase tracking-wide text-stone-400">{label}</span>
      <span className={`font-mono text-sm font-semibold sm:text-base ${color}`}>{value}</span>
    </div>
  )
}

export function RunningBar() {
  const { session, settings, stopSession } = useApp()
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
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-stone-200 bg-white p-2 shadow-sm sm:p-3">
      <Button variant="destructive" onClick={stopSession} className="font-semibold">
        Stop session
      </Button>
      <div className="flex flex-1 flex-wrap items-center justify-end gap-3 sm:gap-4">
        <Stat label="OK" value={String(session.correct)} tone="positive" />
        <Stat label="X" value={String(session.wrong)} tone="negative" />
        <Stat label="Streak" value={String(session.streak)} />
        {accuracy != null ? <Stat label="Acc." value={`${accuracy}%`} /> : null}
        {timeLeft != null ? <Stat label="Time" value={formatTime(timeLeft)} tone="alert" /> : null}
        {settings.sessionMode === 'fixed' ? (
          <Stat label="Done" value={`${session.total}/${settings.fixedLength}`} />
        ) : null}
      </div>
    </div>
  )
}
