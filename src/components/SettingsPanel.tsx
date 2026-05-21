import { getKeySignature, KEY_SIGNATURES } from '@/music/keySignature'
import { formatNoteWithOctave } from '@/music/notation'
import { MAX_MIDI, MIN_MIDI } from '@/music/ranges'
import { spellMidiInKey } from '@/music/spell'
import { useApp } from '@/state/AppContext'

const C_KEY = getKeySignature('C')

function midiLabel(midi: number): string {
  const note = spellMidiInKey(midi, C_KEY)
  return formatNoteWithOctave(note, 'letters')
}

export function SettingsPanel() {
  const { settings, range, matchMode, updateSettings, rangePresets, session } = useApp()
  const disabled = session.status === 'running'

  return (
    <div className="space-y-5 rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Settings</h2>

      <fieldset className="space-y-2" disabled={disabled}>
        <legend className="text-xs font-medium text-stone-600">Range</legend>
        <select
          className="w-full rounded border border-stone-300 bg-white px-2 py-1.5 text-sm"
          value={settings.rangePresetId}
          onChange={(e) => updateSettings({ rangePresetId: e.target.value })}
        >
          {rangePresets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
          <option value="custom">Custom…</option>
        </select>
        {settings.rangePresetId === 'custom' ? (
          <div className="space-y-2 rounded border border-stone-200 bg-stone-50 p-2">
            <label className="block text-xs">
              <span className="mb-1 flex justify-between">
                <span>Lowest</span>
                <span className="font-mono">{midiLabel(settings.customLowMidi)}</span>
              </span>
              <input
                type="range"
                min={MIN_MIDI}
                max={MAX_MIDI}
                value={settings.customLowMidi}
                onChange={(e) => updateSettings({ customLowMidi: Number.parseInt(e.target.value, 10) })}
                className="w-full"
              />
            </label>
            <label className="block text-xs">
              <span className="mb-1 flex justify-between">
                <span>Highest</span>
                <span className="font-mono">{midiLabel(settings.customHighMidi)}</span>
              </span>
              <input
                type="range"
                min={MIN_MIDI}
                max={MAX_MIDI}
                value={settings.customHighMidi}
                onChange={(e) => updateSettings({ customHighMidi: Number.parseInt(e.target.value, 10) })}
                className="w-full"
              />
            </label>
          </div>
        ) : (
          <p className="text-xs text-stone-500">
            {midiLabel(range.lowMidi)} – {midiLabel(range.highMidi)}
          </p>
        )}
      </fieldset>

      <fieldset className="space-y-2" disabled={disabled}>
        <legend className="text-xs font-medium text-stone-600">Accidentals</legend>
        <div className="space-y-1.5">
          {(
            [
              ['natural', 'Naturals only (no accidentals)'],
              ['key-signature', 'On the clef (key signature)'],
              ['incidentals', 'On the notes (random sharps/flats)'],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="accidental-mode"
                value={value}
                checked={settings.accidentalMode === value}
                onChange={() => updateSettings({ accidentalMode: value })}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
        {settings.accidentalMode === 'key-signature' ? (
          <select
            className="mt-1 w-full rounded border border-stone-300 bg-white px-2 py-1.5 text-sm"
            value={settings.keySignatureId}
            onChange={(e) => updateSettings({ keySignatureId: e.target.value })}
          >
            {KEY_SIGNATURES.map((k) => (
              <option key={k.id} value={k.id}>
                {k.majorName} ({k.accidentalCount}{' '}
                {k.accidentalType === 'sharp' ? '♯' : k.accidentalType === 'flat' ? '♭' : '—'})
              </option>
            ))}
          </select>
        ) : null}
      </fieldset>

      <fieldset className="space-y-2" disabled={disabled}>
        <legend className="text-xs font-medium text-stone-600">Notation</legend>
        <div className="flex gap-3 text-sm">
          {(
            [
              ['letters', 'A–G'],
              ['solfege', 'Do–Si'],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className="flex items-center gap-1">
              <input
                type="radio"
                name="notation"
                value={value}
                checked={settings.notationStyle === value}
                onChange={() => updateSettings({ notationStyle: value })}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2" disabled={disabled}>
        <legend className="text-xs font-medium text-stone-600">
          Octave matching{' '}
          <span className="font-normal text-stone-400">
            (auto → {matchMode === 'exact' ? 'exact pitch' : 'any octave'})
          </span>
        </legend>
        <div className="flex gap-3 text-sm">
          {(
            [
              ['auto', 'Auto'],
              ['exact', 'Exact'],
              ['pitch-class', 'Any octave'],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className="flex items-center gap-1">
              <input
                type="radio"
                name="octave-match"
                value={value}
                checked={settings.octaveMatching === value}
                onChange={() => updateSettings({ octaveMatching: value })}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2" disabled={disabled}>
        <legend className="text-xs font-medium text-stone-600">Session</legend>
        <div className="space-y-1.5">
          {(
            [
              ['open', 'Open-ended (until you stop)'],
              ['fixed', `Fixed length (${settings.fixedLength} notes)`],
              ['sprint', `Timed sprint (${settings.sprintSeconds}s)`],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="session-mode"
                value={value}
                checked={settings.sessionMode === value}
                onChange={() => updateSettings({ sessionMode: value })}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
        {settings.sessionMode === 'fixed' ? (
          <label className="block text-xs">
            <span className="mb-1 flex justify-between">
              <span>Notes per session</span>
              <span className="font-mono">{settings.fixedLength}</span>
            </span>
            <input
              type="range"
              min={5}
              max={100}
              step={5}
              value={settings.fixedLength}
              onChange={(e) => updateSettings({ fixedLength: Number.parseInt(e.target.value, 10) })}
              className="w-full"
            />
          </label>
        ) : null}
        {settings.sessionMode === 'sprint' ? (
          <label className="block text-xs">
            <span className="mb-1 flex justify-between">
              <span>Seconds</span>
              <span className="font-mono">{settings.sprintSeconds}s</span>
            </span>
            <input
              type="range"
              min={15}
              max={300}
              step={15}
              value={settings.sprintSeconds}
              onChange={(e) => updateSettings({ sprintSeconds: Number.parseInt(e.target.value, 10) })}
              className="w-full"
            />
          </label>
        ) : null}
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-xs font-medium text-stone-600">Sound</legend>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={settings.soundEnabled}
            onChange={(e) => updateSettings({ soundEnabled: e.target.checked })}
          />
          <span>Play synthesised tone when a key is pressed</span>
        </label>
      </fieldset>
    </div>
  )
}
