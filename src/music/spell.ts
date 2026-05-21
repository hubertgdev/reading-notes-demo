import { diatonicAccidentalForStep, type KeySignatureInfo, stepIsFlatInKey, stepIsSharpInKey } from './keySignature'
import { type Accidental, midiFromSpelled, type SpelledNote, STEP_ORDER, STEP_SEMITONE, type Step } from './notation'

const NATURAL_PCS: Array<{ step: Step; pc: number }> = STEP_ORDER.map((s) => ({
  step: s,
  pc: STEP_SEMITONE[s],
}))

export function spellMidiInKey(midi: number, key: KeySignatureInfo): SpelledNote {
  const pc = ((midi % 12) + 12) % 12

  const naturalHit = NATURAL_PCS.find((n) => n.pc === pc)
  if (naturalHit) {
    return {
      step: naturalHit.step,
      octave: octaveOf(midi, naturalHit.step, 'natural'),
      accidental: 'natural',
      midi,
    }
  }

  if (key.accidentalType === 'flat') {
    const stepUp = NATURAL_PCS.find((n) => n.pc === (pc + 1) % 12)
    if (stepUp) {
      return {
        step: stepUp.step,
        octave: octaveOf(midi, stepUp.step, 'flat'),
        accidental: 'flat',
        midi,
      }
    }
  }

  const stepDown = NATURAL_PCS.find((n) => n.pc === (pc + 11) % 12)
  if (stepDown) {
    return {
      step: stepDown.step,
      octave: octaveOf(midi, stepDown.step, 'sharp'),
      accidental: 'sharp',
      midi,
    }
  }

  throw new Error(`could not spell midi ${midi}`)
}

function octaveOf(midi: number, step: Step, accidental: Accidental): number {
  for (let oct = 0; oct <= 9; oct++) {
    if (midiFromSpelled(step, accidental, oct) === midi) return oct
  }
  throw new Error(`could not find octave for midi ${midi} as ${step}${accidental}`)
}

export function renderedAccidental(note: SpelledNote, key: KeySignatureInfo): Accidental | 'cancel' | null {
  const diatonic = diatonicAccidentalForStep(note.step, key)
  if (note.accidental === diatonic) return null
  if (note.accidental === 'natural') {
    if (stepIsSharpInKey(note.step, key) || stepIsFlatInKey(note.step, key)) {
      return 'cancel'
    }
    return null
  }
  return note.accidental
}
