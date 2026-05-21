import { playNote, primeAudio } from '@/audio/synth'
import { Piano } from '@/components/Piano'
import { SessionControls } from '@/components/SessionControls'
import { SettingsPanel } from '@/components/SettingsPanel'
import { Staff } from '@/components/Staff'
import { cn } from '@/lib/utils'
import { AppProvider, type AppView, useApp } from '@/state/AppContext'

function Tabs() {
  const { view, setView } = useApp()
  const tabs: Array<{ id: AppView; label: string }> = [
    { id: 'practice', label: 'Practice' },
    { id: 'settings', label: 'Settings' },
  ]
  return (
    <nav className="flex gap-1 border-b border-stone-200">
      {tabs.map((t) => {
        const active = view === t.id
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => setView(t.id)}
            className={cn(
              'rounded-t-md px-4 py-2 text-sm font-medium transition-colors',
              active
                ? 'border border-b-white border-stone-200 bg-white text-stone-900 -mb-px'
                : 'text-stone-500 hover:text-stone-800',
            )}
            aria-current={active ? 'page' : undefined}
          >
            {t.label}
          </button>
        )
      })}
    </nav>
  )
}

function PracticeView() {
  const { settings, session, range, key, playKey } = useApp()
  const finished = session.status === 'finished'
  const isRunning = session.status === 'running'

  const accuracy =
    session.correct + session.wrong > 0 ? Math.round((session.correct / (session.correct + session.wrong)) * 100) : null

  return (
    <div className="space-y-4">
      <SessionControls />

      <div className="rounded-lg border border-stone-200 bg-stone-100 p-6">
        <Staff
          phrase={session.phrase}
          keySignature={key}
          currentIndex={session.currentIndex}
          showCursor={settings.showCursor && isRunning}
          feedback={session.lastResult}
        />
        {finished ? (
          <div className="mt-3 text-center text-sm font-medium text-stone-700">
            Session finished — {session.correct} correct, {session.wrong} wrong
            {accuracy != null ? ` (${accuracy}%)` : ''}, best streak {session.bestStreak}
          </div>
        ) : !isRunning ? (
          <div className="mt-3 text-center text-sm text-stone-400">
            Press Start to begin. Read the notes on the staff and play them on the keyboard.
          </div>
        ) : null}
      </div>

      <Piano
        lowMidi={range.lowMidi}
        highMidi={range.highMidi}
        onPlay={(midi) => {
          primeAudio()
          playKey(midi)
        }}
        lastPressedMidi={session.lastPressedMidi}
        feedback={session.lastResult}
      />
    </div>
  )
}

function SettingsView() {
  return (
    <div className="mx-auto max-w-3xl">
      <SettingsPanel />
    </div>
  )
}

function Inner() {
  const { view } = useApp()
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <header className="mb-4 flex items-baseline justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Reading Notes</h1>
            <p className="text-sm text-stone-500">Practice reading music — dictation, no spoilers.</p>
          </div>
          <span className="text-xs text-stone-400 font-mono">v{__APP_VERSION__}</span>
        </header>

        <Tabs />

        <div className="pt-5">{view === 'practice' ? <PracticeView /> : <SettingsView />}</div>
      </div>
    </div>
  )
}

export function App() {
  return (
    <AppProvider onPlay={(midi) => playNote(midi)}>
      <Inner />
    </AppProvider>
  )
}
