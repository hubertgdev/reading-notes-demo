import type { Step } from './notation'

export interface KeySignatureInfo {
  id: string
  tonic: string
  majorName: string
  vexflowKey: string
  accidentalCount: number
  accidentalType: 'sharp' | 'flat' | 'natural'
  sharpSteps: Step[]
  flatSteps: Step[]
}

const SHARP_ORDER: Step[] = ['F', 'C', 'G', 'D', 'A', 'E', 'B']
const FLAT_ORDER: Step[] = ['B', 'E', 'A', 'D', 'G', 'C', 'F']

function sharpKey(id: string, name: string, count: number): KeySignatureInfo {
  return {
    id,
    tonic: id,
    majorName: name,
    vexflowKey: id,
    accidentalCount: count,
    accidentalType: count === 0 ? 'natural' : 'sharp',
    sharpSteps: SHARP_ORDER.slice(0, count),
    flatSteps: [],
  }
}

function flatKey(id: string, name: string, count: number): KeySignatureInfo {
  return {
    id,
    tonic: id,
    majorName: name,
    vexflowKey: id,
    accidentalCount: count,
    accidentalType: 'flat',
    sharpSteps: [],
    flatSteps: FLAT_ORDER.slice(0, count),
  }
}

export const KEY_SIGNATURES: KeySignatureInfo[] = [
  sharpKey('C', 'C major', 0),
  sharpKey('G', 'G major', 1),
  sharpKey('D', 'D major', 2),
  sharpKey('A', 'A major', 3),
  sharpKey('E', 'E major', 4),
  sharpKey('B', 'B major', 5),
  sharpKey('F#', 'F♯ major', 6),
  sharpKey('C#', 'C♯ major', 7),
  flatKey('F', 'F major', 1),
  flatKey('Bb', 'B♭ major', 2),
  flatKey('Eb', 'E♭ major', 3),
  flatKey('Ab', 'A♭ major', 4),
  flatKey('Db', 'D♭ major', 5),
  flatKey('Gb', 'G♭ major', 6),
  flatKey('Cb', 'C♭ major', 7),
]

export function getKeySignature(id: string): KeySignatureInfo {
  const k = KEY_SIGNATURES.find((s) => s.id === id)
  if (!k) throw new Error(`unknown key signature: ${id}`)
  return k
}

export function stepIsSharpInKey(step: Step, key: KeySignatureInfo): boolean {
  return key.sharpSteps.includes(step)
}

export function stepIsFlatInKey(step: Step, key: KeySignatureInfo): boolean {
  return key.flatSteps.includes(step)
}

export function diatonicAccidentalForStep(step: Step, key: KeySignatureInfo): 'sharp' | 'flat' | 'natural' {
  if (stepIsSharpInKey(step, key)) return 'sharp'
  if (stepIsFlatInKey(step, key)) return 'flat'
  return 'natural'
}
