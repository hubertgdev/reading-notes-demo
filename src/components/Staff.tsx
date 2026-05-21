import { useEffect, useRef } from 'react'
import { Accidental, Formatter, Renderer, Stave, StaveConnector, StaveNote, Voice } from 'vexflow'
import { cn } from '@/lib/utils'
import type { KeySignatureInfo } from '@/music/keySignature'
import { spellMidiInKey } from '@/music/spell'

interface StaffProps {
  phrase: number[]
  keySignature: KeySignatureInfo
  currentIndex: number
  showCursor: boolean
  feedback?: 'correct' | 'wrong' | null
}

const NOTES_PER_LINE_TARGET = 200

function toVexKey(midi: number, key: KeySignatureInfo): string {
  const spelled = spellMidiInKey(midi, key)
  const acc = spelled.accidental === 'sharp' ? '#' : spelled.accidental === 'flat' ? 'b' : ''
  return `${spelled.step.toLowerCase()}${acc}/${spelled.octave}`
}

export function Staff({ phrase, keySignature, currentIndex, showCursor, feedback }: StaffProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.innerHTML = ''

    const minWidth = 460
    const widthFromPhrase = 220 + Math.max(0, phrase.length) * 60
    const width = Math.max(minWidth, Math.min(widthFromPhrase, NOTES_PER_LINE_TARGET * 8))
    const height = 280

    const renderer = new Renderer(el, Renderer.Backends.SVG)
    renderer.resize(width, height)
    const ctx = renderer.getContext()
    ctx.setFont('Arial', 12)

    const staveX = 12
    const staveWidth = width - 24
    const trebleY = 24
    const bassY = 130

    const treble = new Stave(staveX, trebleY, staveWidth)
    treble.addClef('treble').addKeySignature(keySignature.vexflowKey)
    treble.setContext(ctx).draw()

    const bass = new Stave(staveX, bassY, staveWidth)
    bass.addClef('bass').addKeySignature(keySignature.vexflowKey)
    bass.setContext(ctx).draw()

    new StaveConnector(treble, bass).setType('brace').setContext(ctx).draw()
    new StaveConnector(treble, bass).setType('singleLeft').setContext(ctx).draw()

    if (phrase.length === 0) return

    const trebleNotes: StaveNote[] = []
    const bassNotes: StaveNote[] = []

    for (const midi of phrase) {
      const onTreble = midi >= 60
      const noteKey = toVexKey(midi, keySignature)
      if (onTreble) {
        trebleNotes.push(new StaveNote({ clef: 'treble', keys: [noteKey], duration: 'q' }))
        bassNotes.push(new StaveNote({ clef: 'bass', keys: ['d/3'], duration: 'qr' }))
      } else {
        bassNotes.push(new StaveNote({ clef: 'bass', keys: [noteKey], duration: 'q' }))
        trebleNotes.push(new StaveNote({ clef: 'treble', keys: ['b/4'], duration: 'qr' }))
      }
    }

    const voiceOptions = { numBeats: phrase.length, beatValue: 4 }
    const trebleVoice = new Voice(voiceOptions).setMode(2).addTickables(trebleNotes)
    const bassVoice = new Voice(voiceOptions).setMode(2).addTickables(bassNotes)

    Accidental.applyAccidentals([trebleVoice, bassVoice], keySignature.vexflowKey)

    new Formatter().joinVoices([trebleVoice, bassVoice]).format([trebleVoice, bassVoice], staveWidth - 80)

    for (let i = 0; i < trebleNotes.length; i++) {
      trebleNotes[i]?.setStave(treble)
      bassNotes[i]?.setStave(bass)
    }

    trebleVoice.draw(ctx, treble)
    bassVoice.draw(ctx, bass)

    if (showCursor && currentIndex >= 0 && currentIndex < phrase.length) {
      const onTreble = (phrase[currentIndex] ?? 60) >= 60
      const targetNote = onTreble ? trebleNotes[currentIndex] : bassNotes[currentIndex]
      if (targetNote) {
        const x = targetNote.getAbsoluteX() - 10
        const cursorColor = feedback === 'wrong' ? '#dc2626' : '#ef4444'
        ctx.save()
        ctx.setStrokeStyle(cursorColor)
        ctx.setLineWidth(2)
        ctx.beginPath()
        ctx.moveTo(x, trebleY - 4)
        ctx.lineTo(x, bassY + 54)
        ctx.stroke()
        ctx.restore()
      }
    }
  }, [phrase, currentIndex, showCursor, feedback, keySignature])

  const borderColor =
    feedback === 'wrong'
      ? 'border-rose-400 ring-2 ring-rose-200'
      : feedback === 'correct'
        ? 'border-emerald-400 ring-2 ring-emerald-200'
        : 'border-stone-200'

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label="music staff"
      className={cn('mx-auto w-full overflow-x-auto rounded-lg border bg-white p-2 transition-colors', borderColor)}
    />
  )
}
