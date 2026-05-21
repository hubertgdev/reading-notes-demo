export type Step = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B'

export type Accidental = 'natural' | 'sharp' | 'flat'

export type NotationStyle = 'letters' | 'solfege'

export type Clef = 'treble' | 'bass'

export interface SpelledNote {
  step: Step
  octave: number
  accidental: Accidental
  midi: number
}

const STEP_ORDER: Step[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B']

const STEP_SEMITONE: Record<Step, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
}

const SOLFEGE: Record<Step, string> = {
  C: 'Do',
  D: 'Re',
  E: 'Mi',
  F: 'Fa',
  G: 'Sol',
  A: 'La',
  B: 'Si',
}

const ACCIDENTAL_SYMBOL: Record<Accidental, string> = {
  natural: '',
  sharp: '♯',
  flat: '♭',
}

export function stepName(step: Step, style: NotationStyle): string {
  return style === 'solfege' ? SOLFEGE[step] : step
}

export function stepIndex(step: Step): number {
  return STEP_ORDER.indexOf(step)
}

export function stepFromIndex(index: number): Step {
  const wrapped = ((index % 7) + 7) % 7
  const s = STEP_ORDER[wrapped]
  if (!s) throw new Error(`invalid step index ${index}`)
  return s
}

export function midiFromSpelled(step: Step, accidental: Accidental, octave: number): number {
  const offset = accidental === 'sharp' ? 1 : accidental === 'flat' ? -1 : 0
  return (octave + 1) * 12 + STEP_SEMITONE[step] + offset
}

export function diatonicPosition(step: Step, octave: number): number {
  return octave * 7 + stepIndex(step)
}

export function formatNoteName(note: SpelledNote, style: NotationStyle): string {
  return `${stepName(note.step, style)}${ACCIDENTAL_SYMBOL[note.accidental]}`
}

export function formatNoteWithOctave(note: SpelledNote, style: NotationStyle): string {
  return `${formatNoteName(note, style)}${note.octave}`
}

export { STEP_ORDER, STEP_SEMITONE }
