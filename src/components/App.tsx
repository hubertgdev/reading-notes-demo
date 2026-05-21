import { playNote, primeAudio } from '@/audio/synth'
import { Piano } from '@/components/Piano'
import { RunningBar } from '@/components/SessionControls'
import { SettingsPanel } from '@/components/SettingsPanel'
import { Staff } from '@/components/Staff'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AppProvider, type AppView, useApp } from '@/state/AppContext'

function Tabs() {
  const { view, setView } = useApp()
  const tabs: Array<{ id: AppView; label: string }> = [
    { id: 'practice', label: 'Practice' },
    { id: 'settings', label: 'Settings' },
  ]
  return (
    <nav className="flex gap-1 border-b border-stone-200" aria-label="App sections">
      {tabs.map((t) => {
        const active = view === t.id
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => setView(t.id)}
            className={cn(
              'rounded-t-md px-4 py-2.5 text-sm font-medium transition-colors sm:py-2',
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

function StaffPianoBlock({ idle }: { idle: boolean }) {
  const { settings, session, range, key, playKey } = useApp()
  return (
    <>
      <div className="rounded-lg border border-stone-200 bg-stone-100 p-3 sm:p-6">
        <Staff
          phrase={session.phrase}
          keySignature={key}
          currentIndex={session.currentIndex}
          showCursor={settings.showCursor && !idle}
          feedback={session.lastResult}
        />
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
    </>
  )
}

function StartCard() {
  const { session, settings, startSession, setView } = useApp()
  const finished = session.status === 'finished'

  const modeLabel =
    settings.sessionMode === 'open'
      ? 'Open-ended'
      : settings.sessionMode === 'fixed'
        ? `${settings.fixedLength}-note round`
        : `${settings.sprintSeconds}s sprint`

  const accuracy =
    session.correct + session.wrong > 0 ? Math.round((session.correct / (session.correct + session.wrong)) * 100) : null

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      {finished ? (
        <div className="mb-3 rounded-md bg-stone-50 p-3 text-sm text-stone-700">
          <div className="font-medium">Session finished</div>
          <div className="text-stone-600">
            {session.correct} correct · {session.wrong} wrong
            {accuracy != null ? ` · ${accuracy}%` : ''} · best streak {session.bestStreak}
          </div>
        </div>
      ) : null}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-stone-600">
          <span className="font-medium text-stone-800">{modeLabel}</span> · {settings.phraseLength} note
          {settings.phraseLength === 1 ? '' : 's'} per phrase
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setView('settings')}>
            Configure
          </Button>
          <Button onClick={startSession} className="font-semibold">
            {finished ? 'Start again' : 'Start session'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function PracticeView() {
  return (
    <div className="space-y-3 sm:space-y-4">
      <StartCard />
      <StaffPianoBlock idle />
    </div>
  )
}

function SettingsView() {
  const { startSession } = useApp()
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <SettingsPanel />
      <Button onClick={startSession} className="w-full font-semibold sm:w-auto">
        Start session
      </Button>
    </div>
  )
}

function RunningView() {
  return (
    <div className="space-y-3 sm:space-y-4">
      <RunningBar />
      <StaffPianoBlock idle={false} />
    </div>
  )
}

function Inner() {
  const { view, session } = useApp()
  const isRunning = session.status === 'running'

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <div className="mx-auto max-w-6xl px-3 py-3 sm:px-4 sm:py-5">
        <header className="mb-3 flex items-baseline justify-between sm:mb-4">
          <h1 className="text-lg font-semibold tracking-tight sm:text-2xl">Reading Notes</h1>
          <span className="text-[10px] font-mono text-stone-400 sm:text-xs">v{__APP_VERSION__}</span>
        </header>

        {isRunning ? (
          <RunningView />
        ) : (
          <>
            <Tabs />
            <div className="pt-4">{view === 'practice' ? <PracticeView /> : <SettingsView />}</div>
          </>
        )}
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
