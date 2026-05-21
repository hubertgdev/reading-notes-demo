import { useMemo } from 'react'
import { playNote, primeAudio } from '@/audio/synth'
import { Piano } from '@/components/Piano'
import { SessionControls } from '@/components/SessionControls'
import { SettingsPanel } from '@/components/SettingsPanel'
import { Staff } from '@/components/Staff'
import { formatNoteName, formatNoteWithOctave } from '@/music/notation'
import { spellMidiInKey } from '@/music/spell'
import { AppProvider, useApp } from '@/state/AppContext'

function Inner() {
  const { settings, session, range, matchMode, key, playKey } = useApp()

  const spelledNote = useMemo(() => {
    if (session.currentMidi == null) return null
    return spellMidiInKey(session.currentMidi, key)
  }, [session.currentMidi, key])

  const targetLabel = useMemo(() => {
    if (!spelledNote) return null
    return matchMode === 'pitch-class'
      ? formatNoteName(spelledNote, settings.notationStyle)
      : formatNoteWithOctave(spelledNote, settings.notationStyle)
  }, [spelledNote, settings.notationStyle, matchMode])

  const finished = session.status === 'finished'
  const isRunning = session.status === 'running'

  const accuracy =
    session.correct + session.wrong > 0 ? Math.round((session.correct / (session.correct + session.wrong)) * 100) : null

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <header className="mb-5 flex items-baseline justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Reading Notes</h1>
            <p className="text-sm text-stone-500">
              Practice reading music. Click the keyboard or play freely between rounds.
            </p>
          </div>
          <span className="text-xs text-stone-400 font-mono">v{__APP_VERSION__}</span>
        </header>

        <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
          <aside className="lg:sticky lg:top-4 lg:self-start">
            <SettingsPanel />
          </aside>

          <main className="space-y-4">
            <SessionControls />

            <div className="relative rounded-lg border border-stone-200 bg-stone-100 p-6">
              <Staff note={spelledNote} keySignature={key.id} feedback={session.lastResult} />
              <div className="mt-3 flex h-8 items-center justify-center text-lg font-semibold text-stone-700">
                {isRunning && targetLabel ? (
                  <span>
                    Play: <span className="font-mono">{targetLabel}</span>
                  </span>
                ) : finished ? (
                  <span>
                    Session finished — {session.correct} correct, {session.wrong} wrong
                    {accuracy != null ? ` (${accuracy}%)` : ''}, best streak {session.bestStreak}
                  </span>
                ) : (
                  <span className="text-stone-400">Press Start to begin a session, or just play the keys.</span>
                )}
              </div>
            </div>

            <Piano
              lowMidi={range.lowMidi}
              highMidi={range.highMidi}
              onPlay={(midi) => {
                primeAudio()
                playKey(midi)
              }}
              highlightMidi={isRunning ? session.currentMidi : null}
              feedback={session.lastResult}
            />
          </main>
        </div>
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
