import { useEffect, useMemo, useRef } from 'react'
import { Accidental, Formatter, Renderer, Stave, StaveConnector, StaveNote, Voice } from 'vexflow'
import { cn } from '@/lib/utils'
import type { SpelledNote } from '@/music/notation'

interface StaffProps {
  note: SpelledNote | null
  keySignature: string
  feedback?: 'correct' | 'wrong' | null
}

export function Staff({ note, keySignature, feedback }: StaffProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const noteKey = useMemo(() => {
    if (!note) return null
    const acc = note.accidental === 'sharp' ? '#' : note.accidental === 'flat' ? 'b' : ''
    return `${note.step.toLowerCase()}${acc}/${note.octave}`
  }, [note])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.innerHTML = ''

    const width = 460
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
    treble.addClef('treble').addKeySignature(keySignature)
    treble.setContext(ctx).draw()

    const bass = new Stave(staveX, bassY, staveWidth)
    bass.addClef('bass').addKeySignature(keySignature)
    bass.setContext(ctx).draw()

    new StaveConnector(treble, bass).setType('brace').setContext(ctx).draw()
    new StaveConnector(treble, bass).setType('singleLeft').setContext(ctx).draw()

    if (note && noteKey) {
      const onTreble = note.midi >= 60
      const targetStave = onTreble ? treble : bass

      const main = new StaveNote({
        clef: onTreble ? 'treble' : 'bass',
        keys: [noteKey],
        duration: 'w',
      })

      const otherStave = onTreble ? bass : treble
      const restKeys = onTreble ? ['d/3'] : ['b/4']
      const rest = new StaveNote({
        clef: onTreble ? 'bass' : 'treble',
        keys: restKeys,
        duration: 'wr',
      })

      const voiceMain = new Voice({ numBeats: 4, beatValue: 4 }).addTickables([main])
      const voiceRest = new Voice({ numBeats: 4, beatValue: 4 }).addTickables([rest])

      Accidental.applyAccidentals([voiceMain], keySignature)

      new Formatter()
        .joinVoices([voiceMain])
        .joinVoices([voiceRest])
        .format([voiceMain, voiceRest], staveWidth - 80)

      main.setStave(targetStave)
      rest.setStave(otherStave)

      voiceMain.draw(ctx, targetStave)
      voiceRest.draw(ctx, otherStave)
    }
  }, [note, noteKey, keySignature])

  const borderColor =
    feedback === 'correct'
      ? 'border-emerald-400 ring-2 ring-emerald-200'
      : feedback === 'wrong'
        ? 'border-rose-400 ring-2 ring-rose-200'
        : 'border-stone-200'

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label="music staff"
      className={cn(
        'mx-auto w-full max-w-[480px] overflow-hidden rounded-lg border bg-white p-2 transition-colors',
        borderColor,
      )}
    />
  )
}
