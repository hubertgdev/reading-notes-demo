import { midiFromSpelled } from './notation'

export interface RangePreset {
  id: string
  label: string
  description: string
  lowMidi: number
  highMidi: number
}

export const RANGE_PRESETS: RangePreset[] = [
  {
    id: 'one-octave',
    label: 'One octave (C4–C5)',
    description: 'Just middle C up an octave. Good for getting started.',
    lowMidi: midiFromSpelled('C', 'natural', 4),
    highMidi: midiFromSpelled('C', 'natural', 5),
  },
  {
    id: 'two-octaves',
    label: 'Two octaves (C3–C5)',
    description: 'Middle C and the octave below.',
    lowMidi: midiFromSpelled('C', 'natural', 3),
    highMidi: midiFromSpelled('C', 'natural', 5),
  },
  {
    id: 'treble',
    label: 'Treble clef staff',
    description: 'Notes that sit on the treble staff (E4 to F5).',
    lowMidi: midiFromSpelled('E', 'natural', 4),
    highMidi: midiFromSpelled('F', 'natural', 5),
  },
  {
    id: 'treble-ledger',
    label: 'Treble + ledger lines',
    description: 'Treble staff plus a few ledger lines either side (C4 to C6).',
    lowMidi: midiFromSpelled('C', 'natural', 4),
    highMidi: midiFromSpelled('C', 'natural', 6),
  },
  {
    id: 'bass',
    label: 'Bass clef staff',
    description: 'Notes that sit on the bass staff (G2 to A3).',
    lowMidi: midiFromSpelled('G', 'natural', 2),
    highMidi: midiFromSpelled('A', 'natural', 3),
  },
  {
    id: 'bass-ledger',
    label: 'Bass + ledger lines',
    description: 'Bass staff plus a few ledger lines (C2 to C4).',
    lowMidi: midiFromSpelled('C', 'natural', 2),
    highMidi: midiFromSpelled('C', 'natural', 4),
  },
  {
    id: 'grand-staff',
    label: 'Grand staff (C2–C6)',
    description: 'Full both-clefs range without extreme ledger lines.',
    lowMidi: midiFromSpelled('C', 'natural', 2),
    highMidi: midiFromSpelled('C', 'natural', 6),
  },
  {
    id: 'full-piano',
    label: 'Full piano (A0–C8)',
    description: 'All 88 keys.',
    lowMidi: midiFromSpelled('A', 'natural', 0),
    highMidi: midiFromSpelled('C', 'natural', 8),
  },
]

export function getRangePreset(id: string): RangePreset | undefined {
  return RANGE_PRESETS.find((r) => r.id === id)
}

export const MIN_MIDI = midiFromSpelled('A', 'natural', 0)
export const MAX_MIDI = midiFromSpelled('C', 'natural', 8)
