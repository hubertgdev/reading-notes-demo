import type { KeySignatureInfo } from './keySignature'
import { type Accidental, midiFromSpelled, STEP_ORDER, type Step } from './notation'
import { spellMidiInKey } from './spell'

export type AccidentalMode = 'natural' | 'key-signature' | 'incidentals'

export interface PickNoteOptions {
  lowMidi: number
  highMidi: number
  mode: AccidentalMode
  key: KeySignatureInfo
  incidentalProbability?: number
  previousMidi?: number | null
}

function diatonicMidisInRange(low: number, high: number, key: KeySignatureInfo): number[] {
  const out: number[] = []
  for (let oct = 0; oct <= 9; oct++) {
    for (const step of STEP_ORDER) {
      const acc: Accidental = key.sharpSteps.includes(step as Step)
        ? 'sharp'
        : key.flatSteps.includes(step as Step)
          ? 'flat'
          : 'natural'
      const midi = midiFromSpelled(step as Step, acc, oct)
      if (midi >= low && midi <= high) out.push(midi)
    }
  }
  return Array.from(new Set(out)).sort((a, b) => a - b)
}

function chromaticMidisInRange(low: number, high: number): number[] {
  const out: number[] = []
  for (let m = low; m <= high; m++) out.push(m)
  return out
}

export function pickRandomMidi(opts: PickNoteOptions): number {
  const { lowMidi, highMidi, mode, key, previousMidi } = opts
  const incidentalProbability = opts.incidentalProbability ?? 0.3

  let candidates: number[]

  if (mode === 'natural' || mode === 'key-signature') {
    candidates = diatonicMidisInRange(lowMidi, highMidi, key)
  } else {
    if (Math.random() < incidentalProbability) {
      candidates = chromaticMidisInRange(lowMidi, highMidi).filter((m) => {
        try {
          const spelled = spellMidiInKey(m, key)
          return spelled.accidental !== 'natural'
        } catch {
          return false
        }
      })
      if (candidates.length === 0) {
        candidates = diatonicMidisInRange(lowMidi, highMidi, key)
      }
    } else {
      candidates = diatonicMidisInRange(lowMidi, highMidi, key)
    }
  }

  if (candidates.length === 0) {
    candidates = chromaticMidisInRange(lowMidi, highMidi)
  }

  if (candidates.length > 1 && previousMidi != null) {
    const filtered = candidates.filter((m) => m !== previousMidi)
    if (filtered.length > 0) candidates = filtered
  }

  const idx = Math.floor(Math.random() * candidates.length)
  const picked = candidates[idx]
  if (picked == null) throw new Error('no candidates to pick')
  return picked
}

export function checkAnswer(played: number, target: number, matchMode: 'exact' | 'pitch-class'): boolean {
  if (matchMode === 'exact') return played === target
  return (((played - target) % 12) + 12) % 12 === 0
}
