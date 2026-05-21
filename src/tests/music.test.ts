import { describe, expect, it } from 'vitest'
import { getKeySignature } from '@/music/keySignature'
import { midiFromSpelled } from '@/music/notation'
import { checkAnswer } from '@/music/randomNote'
import { spellMidiInKey } from '@/music/spell'

describe('midiFromSpelled', () => {
  it('places middle C at MIDI 60', () => {
    expect(midiFromSpelled('C', 'natural', 4)).toBe(60)
  })

  it('places A4 at MIDI 69', () => {
    expect(midiFromSpelled('A', 'natural', 4)).toBe(69)
  })

  it('handles sharps and flats', () => {
    expect(midiFromSpelled('F', 'sharp', 4)).toBe(66)
    expect(midiFromSpelled('B', 'flat', 4)).toBe(70)
  })
})

describe('spellMidiInKey', () => {
  it('spells natural notes as themselves in C major', () => {
    const c = getKeySignature('C')
    expect(spellMidiInKey(60, c)).toMatchObject({ step: 'C', octave: 4, accidental: 'natural' })
    expect(spellMidiInKey(69, c)).toMatchObject({ step: 'A', octave: 4, accidental: 'natural' })
  })

  it('uses flats in flat keys', () => {
    const bb = getKeySignature('Bb')
    expect(spellMidiInKey(70, bb)).toMatchObject({ step: 'B', accidental: 'flat' })
  })

  it('uses sharps in sharp keys', () => {
    const g = getKeySignature('G')
    expect(spellMidiInKey(66, g)).toMatchObject({ step: 'F', accidental: 'sharp' })
  })
})

describe('checkAnswer', () => {
  it('exact match requires same MIDI', () => {
    expect(checkAnswer(60, 60, 'exact')).toBe(true)
    expect(checkAnswer(72, 60, 'exact')).toBe(false)
  })

  it('pitch-class match allows any octave', () => {
    expect(checkAnswer(72, 60, 'pitch-class')).toBe(true)
    expect(checkAnswer(48, 60, 'pitch-class')).toBe(true)
    expect(checkAnswer(61, 60, 'pitch-class')).toBe(false)
  })
})
