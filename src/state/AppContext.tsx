import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react'
import { getKeySignature, type KeySignatureInfo } from '@/music/keySignature'
import type { NotationStyle } from '@/music/notation'
import { type AccidentalMode, checkAnswer, pickRandomMidi } from '@/music/randomNote'
import { getRangePreset, RANGE_PRESETS, type RangePreset } from '@/music/ranges'

export type SessionMode = 'open' | 'fixed' | 'sprint'
export type OctaveMatching = 'auto' | 'exact' | 'pitch-class'
export type SessionStatus = 'idle' | 'running' | 'finished'
export type AppView = 'practice' | 'settings'

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
  phraseLength: number
  showCursor: boolean
}

export interface SessionState {
  status: SessionStatus
  mode: SessionMode
  phrase: number[]
  currentIndex: number
  previousMidi: number | null
  lastPressedMidi: number | null
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
  view: AppView
}

type Action =
  | { type: 'updateSettings'; patch: Partial<Settings> }
  | { type: 'setView'; view: AppView }
  | { type: 'startSession'; phrase: number[] }
  | { type: 'stopSession' }
  | { type: 'answer'; played: number }
  | { type: 'tick'; now: number }
  | { type: 'nextPhrase'; phrase: number[] }

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
  phraseLength: 4,
  showCursor: true,
}

const DEFAULT_SESSION: SessionState = {
  status: 'idle',
  mode: 'open',
  phrase: [],
  currentIndex: 0,
  previousMidi: null,
  lastPressedMidi: null,
  correct: 0,
  wrong: 0,
  streak: 0,
  bestStreak: 0,
  total: 0,
  startedAt: null,
  endsAt: null,
  lastResult: null,
}

const STORAGE_KEY = 'reading-notes-settings/v2'

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
    // ignore
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

function generatePhrase(settings: Settings, previousMidi: number | null): number[] {
  const range = resolveRange(settings)
  const key = resolveKey(settings)
  const out: number[] = []
  let prev = previousMidi
  for (let i = 0; i < settings.phraseLength; i++) {
    const midi = pickRandomMidi({
      lowMidi: range.lowMidi,
      highMidi: range.highMidi,
      mode: settings.accidentalMode,
      key,
      previousMidi: prev,
    })
    out.push(midi)
    prev = midi
  }
  return out
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'updateSettings': {
      return { ...state, settings: { ...state.settings, ...action.patch } }
    }
    case 'setView': {
      return { ...state, view: action.view }
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
          phrase: action.phrase,
          currentIndex: 0,
          startedAt: now,
          endsAt: mode === 'sprint' ? now + state.settings.sprintSeconds * 1000 : null,
        },
      }
    }
    case 'stopSession': {
      return { ...state, session: { ...state.session, status: 'idle' } }
    }
    case 'nextPhrase': {
      const lastOfOld = state.session.phrase[state.session.phrase.length - 1] ?? null
      return {
        ...state,
        session: {
          ...state.session,
          phrase: action.phrase,
          currentIndex: 0,
          previousMidi: lastOfOld,
          lastResult: null,
        },
      }
    }
    case 'answer': {
      if (state.session.status !== 'running') return state
      const target = state.session.phrase[state.session.currentIndex]
      if (target == null) return state
      const matchMode = resolveOctaveMatching(state.settings)
      const ok = checkAnswer(action.played, target, matchMode)
      const correct = ok ? state.session.correct + 1 : state.session.correct
      const wrong = ok ? state.session.wrong : state.session.wrong + 1
      const streak = ok ? state.session.streak + 1 : 0
      const bestStreak = Math.max(state.session.bestStreak, streak)
      const total = state.session.total + (ok ? 1 : 0)
      const reachedTarget = state.settings.sessionMode === 'fixed' && total >= state.settings.fixedLength
      const nextIndex = ok ? state.session.currentIndex + 1 : state.session.currentIndex
      return {
        ...state,
        session: {
          ...state.session,
          currentIndex: nextIndex,
          lastPressedMidi: action.played,
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
  view: AppView
  range: ResolvedRange
  matchMode: 'exact' | 'pitch-class'
  key: KeySignatureInfo
  rangePresets: RangePreset[]
  updateSettings: (patch: Partial<Settings>) => void
  setView: (view: AppView) => void
  startSession: () => void
  stopSession: () => void
  playKey: (midi: number) => void
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
    view: 'practice' as AppView,
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
    const id = window.setInterval(() => dispatch({ type: 'tick', now: Date.now() }), 250)
    return () => window.clearInterval(id)
  }, [state.session.status, state.session.endsAt])

  const range = useMemo(() => resolveRange(state.settings), [state.settings])
  const matchMode = useMemo(() => resolveOctaveMatching(state.settings), [state.settings])
  const key = useMemo(() => resolveKey(state.settings), [state.settings])

  useEffect(() => {
    if (state.session.status !== 'running') return
    if (state.session.currentIndex < state.session.phrase.length) return
    const timer = window.setTimeout(() => {
      if (sessionRef.current.status !== 'running') return
      const next = generatePhrase(settingsRef.current, sessionRef.current.previousMidi)
      dispatch({ type: 'nextPhrase', phrase: next })
    }, 600)
    return () => window.clearTimeout(timer)
  }, [state.session.status, state.session.currentIndex, state.session.phrase.length])

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    dispatch({ type: 'updateSettings', patch })
  }, [])

  const setView = useCallback((view: AppView) => {
    dispatch({ type: 'setView', view })
  }, [])

  const startSession = useCallback(() => {
    const phrase = generatePhrase(settingsRef.current, sessionRef.current.previousMidi)
    dispatch({ type: 'startSession', phrase })
  }, [])

  const stopSession = useCallback(() => {
    dispatch({ type: 'stopSession' })
  }, [])

  const playKey = useCallback(
    (midi: number) => {
      if (settingsRef.current.soundEnabled && onPlay) onPlay(midi)
      const sess = sessionRef.current
      if (sess.status === 'running' && sess.currentIndex < sess.phrase.length) {
        dispatch({ type: 'answer', played: midi })
      }
    },
    [onPlay],
  )

  const value: AppContextValue = {
    settings: state.settings,
    session: state.session,
    view: state.view,
    range,
    matchMode,
    key,
    rangePresets: RANGE_PRESETS,
    updateSettings,
    setView,
    startSession,
    stopSession,
    playKey,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
