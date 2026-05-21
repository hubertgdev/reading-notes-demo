import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react'
import { getKeySignature, type KeySignatureInfo } from '@/music/keySignature'
import type { NotationStyle } from '@/music/notation'
import { type AccidentalMode, checkAnswer, pickRandomMidi } from '@/music/randomNote'
import { getRangePreset, RANGE_PRESETS, type RangePreset } from '@/music/ranges'

export type SessionMode = 'open' | 'fixed' | 'sprint'
export type OctaveMatching = 'auto' | 'exact' | 'pitch-class'
export type SessionStatus = 'idle' | 'running' | 'finished'

export interface Settings {
  rangePresetId: string
  customLowMidi: number
  customHighMidi: number
  accidentalMode: AccidentalMode
  keySignatureId: string
  notationStyle: NotationStyle
  octaveMatching: OctaveMatching
  sessionMode: SessionMode
  fixedLength: number
  sprintSeconds: number
  soundEnabled: boolean
}

export interface SessionState {
  status: SessionStatus
  mode: SessionMode
  currentMidi: number | null
  previousMidi: number | null
  correct: number
  wrong: number
  streak: number
  bestStreak: number
  total: number
  startedAt: number | null
  endsAt: number | null
  lastResult: 'correct' | 'wrong' | null
}

interface ResolvedRange {
  lowMidi: number
  highMidi: number
  preset: RangePreset | null
}

interface AppState {
  settings: Settings
  session: SessionState
}

type Action =
  | { type: 'updateSettings'; patch: Partial<Settings> }
  | { type: 'startSession' }
  | { type: 'stopSession' }
  | { type: 'answer'; played: number }
  | { type: 'tick'; now: number }
  | { type: 'nextNote'; midi: number }

const DEFAULT_SETTINGS: Settings = {
  rangePresetId: 'treble-ledger',
  customLowMidi: 60,
  customHighMidi: 72,
  accidentalMode: 'natural',
  keySignatureId: 'C',
  notationStyle: 'letters',
  octaveMatching: 'auto',
  sessionMode: 'open',
  fixedLength: 20,
  sprintSeconds: 60,
  soundEnabled: true,
}

const DEFAULT_SESSION: SessionState = {
  status: 'idle',
  mode: 'open',
  currentMidi: null,
  previousMidi: null,
  correct: 0,
  wrong: 0,
  streak: 0,
  bestStreak: 0,
  total: 0,
  startedAt: null,
  endsAt: null,
  lastResult: null,
}

const STORAGE_KEY = 'reading-notes-settings/v1'

function loadSettings(): Settings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw) as Partial<Settings>
    return { ...DEFAULT_SETTINGS, ...parsed }
  } catch {
    return DEFAULT_SETTINGS
  }
}

function saveSettings(settings: Settings): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // ignore quota / privacy errors
  }
}

export function resolveRange(settings: Settings): ResolvedRange {
  const preset = getRangePreset(settings.rangePresetId) ?? null
  if (preset) {
    return { lowMidi: preset.lowMidi, highMidi: preset.highMidi, preset }
  }
  const low = Math.min(settings.customLowMidi, settings.customHighMidi)
  const high = Math.max(settings.customLowMidi, settings.customHighMidi)
  return { lowMidi: low, highMidi: high, preset: null }
}

export function resolveOctaveMatching(settings: Settings): 'exact' | 'pitch-class' {
  if (settings.octaveMatching !== 'auto') return settings.octaveMatching
  const { lowMidi, highMidi } = resolveRange(settings)
  return highMidi - lowMidi <= 12 ? 'pitch-class' : 'exact'
}

export function resolveKey(settings: Settings): KeySignatureInfo {
  if (settings.accidentalMode === 'key-signature') {
    return getKeySignature(settings.keySignatureId)
  }
  return getKeySignature('C')
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'updateSettings': {
      const next = { ...state.settings, ...action.patch }
      return { ...state, settings: next }
    }
    case 'startSession': {
      const mode = state.settings.sessionMode
      const now = Date.now()
      return {
        ...state,
        session: {
          ...DEFAULT_SESSION,
          status: 'running',
          mode,
          startedAt: now,
          endsAt: mode === 'sprint' ? now + state.settings.sprintSeconds * 1000 : null,
        },
      }
    }
    case 'stopSession': {
      return { ...state, session: { ...state.session, status: 'idle' } }
    }
    case 'nextNote': {
      return {
        ...state,
        session: {
          ...state.session,
          previousMidi: state.session.currentMidi,
          currentMidi: action.midi,
          lastResult: null,
        },
      }
    }
    case 'answer': {
      const target = state.session.currentMidi
      if (target == null) return state
      if (state.session.lastResult === 'correct') return state
      const matchMode = resolveOctaveMatching(state.settings)
      const ok = checkAnswer(action.played, target, matchMode)
      const correct = ok ? state.session.correct + 1 : state.session.correct
      const wrong = ok ? state.session.wrong : state.session.wrong + 1
      const streak = ok ? state.session.streak + 1 : 0
      const bestStreak = Math.max(state.session.bestStreak, streak)
      const total = state.session.total + (ok ? 1 : 0)
      const reachedTarget = state.settings.sessionMode === 'fixed' && total >= state.settings.fixedLength
      return {
        ...state,
        session: {
          ...state.session,
          correct,
          wrong,
          streak,
          bestStreak,
          total,
          lastResult: ok ? 'correct' : 'wrong',
          status: reachedTarget ? 'finished' : state.session.status,
        },
      }
    }
    case 'tick': {
      if (state.session.status !== 'running') return state
      if (state.session.endsAt && action.now >= state.session.endsAt) {
        return { ...state, session: { ...state.session, status: 'finished' } }
      }
      return state
    }
    default:
      return state
  }
}

interface AppContextValue {
  settings: Settings
  session: SessionState
  range: ResolvedRange
  matchMode: 'exact' | 'pitch-class'
  key: KeySignatureInfo
  rangePresets: RangePreset[]
  updateSettings: (patch: Partial<Settings>) => void
  startSession: () => void
  stopSession: () => void
  playKey: (midi: number) => void
  nextNote: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

interface ProviderProps {
  children: ReactNode
  onPlay?: (midi: number) => void
}

export function AppProvider({ children, onPlay }: ProviderProps): ReactNode {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    settings: loadSettings(),
    session: DEFAULT_SESSION,
  }))

  const settingsRef = useRef(state.settings)
  settingsRef.current = state.settings
  const sessionRef = useRef(state.session)
  sessionRef.current = state.session

  useEffect(() => {
    saveSettings(state.settings)
  }, [state.settings])

  useEffect(() => {
    if (state.session.status !== 'running' || !state.session.endsAt) return
    const id = window.setInterval(() => {
      dispatch({ type: 'tick', now: Date.now() })
    }, 250)
    return () => window.clearInterval(id)
  }, [state.session.status, state.session.endsAt])

  const range = useMemo(() => resolveRange(state.settings), [state.settings])
  const matchMode = useMemo(() => resolveOctaveMatching(state.settings), [state.settings])
  const key = useMemo(() => resolveKey(state.settings), [state.settings])

  const drawNextNote = useCallback(() => {
    const s = settingsRef.current
    const sess = sessionRef.current
    const r = resolveRange(s)
    const k = resolveKey(s)
    const midi = pickRandomMidi({
      lowMidi: r.lowMidi,
      highMidi: r.highMidi,
      mode: s.accidentalMode,
      key: k,
      previousMidi: sess.currentMidi,
    })
    dispatch({ type: 'nextNote', midi })
  }, [])

  useEffect(() => {
    if (state.session.status === 'running' && state.session.currentMidi == null) {
      drawNextNote()
    }
  }, [state.session.status, state.session.currentMidi, drawNextNote])

  useEffect(() => {
    if (state.session.lastResult !== 'correct') return
    const timer = window.setTimeout(() => {
      if (sessionRef.current.status === 'running') drawNextNote()
    }, 450)
    return () => window.clearTimeout(timer)
  }, [state.session.lastResult, drawNextNote])

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    dispatch({ type: 'updateSettings', patch })
  }, [])

  const startSession = useCallback(() => {
    dispatch({ type: 'startSession' })
  }, [])

  const stopSession = useCallback(() => {
    dispatch({ type: 'stopSession' })
  }, [])

  const playKey = useCallback(
    (midi: number) => {
      if (settingsRef.current.soundEnabled && onPlay) onPlay(midi)
      if (sessionRef.current.status === 'running' && sessionRef.current.currentMidi != null) {
        dispatch({ type: 'answer', played: midi })
      }
    },
    [onPlay],
  )

  const nextNote = useCallback(() => {
    drawNextNote()
  }, [drawNextNote])

  const value: AppContextValue = {
    settings: state.settings,
    session: state.session,
    range,
    matchMode,
    key,
    rangePresets: RANGE_PRESETS,
    updateSettings,
    startSession,
    stopSession,
    playKey,
    nextNote,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
