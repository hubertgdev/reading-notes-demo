import { useMemo } from 'react'
import { cn } from '@/lib/utils'

interface PianoProps {
  lowMidi: number
  highMidi: number
  onPlay: (midi: number) => void
  lastPressedMidi?: number | null
  feedback?: 'correct' | 'wrong' | null
}

interface KeyInfo {
  midi: number
  isBlack: boolean
  whiteIndex: number
  label?: string
}

const WHITE_KEY_WIDTH = 28
const WHITE_KEY_HEIGHT = 140
const BLACK_KEY_WIDTH = 18
const BLACK_KEY_HEIGHT = 88

function isBlackKey(midi: number): boolean {
  const pc = ((midi % 12) + 12) % 12
  return [1, 3, 6, 8, 10].includes(pc)
}

function octaveOfMidi(midi: number): number {
  return Math.floor(midi / 12) - 1
}

function pcOfMidi(midi: number): number {
  return ((midi % 12) + 12) % 12
}

export function Piano({ lowMidi, highMidi, onPlay, lastPressedMidi, feedback }: PianoProps) {
  const { keys, totalWhite } = useMemo(() => {
    let lo = lowMidi
    let hi = highMidi
    while (isBlackKey(lo) && lo > 0) lo--
    while (isBlackKey(hi) && hi < 127) hi++
    const list: KeyInfo[] = []
    let whiteIndex = 0
    for (let m = lo; m <= hi; m++) {
      const black = isBlackKey(m)
      list.push({
        midi: m,
        isBlack: black,
        whiteIndex: black ? whiteIndex - 1 : whiteIndex,
        label: !black && pcOfMidi(m) === 0 ? `C${octaveOfMidi(m)}` : undefined,
      })
      if (!black) whiteIndex++
    }
    return { keys: list, totalWhite: whiteIndex }
  }, [lowMidi, highMidi])

  const width = totalWhite * WHITE_KEY_WIDTH
  const height = WHITE_KEY_HEIGHT

  const feedbackClass =
    feedback === 'correct' ? 'fill-emerald-300' : feedback === 'wrong' ? 'fill-rose-300' : 'fill-amber-200'

  return (
    <div className="w-full overflow-x-auto">
      <svg
        role="img"
        aria-label="piano keyboard"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMinYMid meet"
        className="block h-44 min-w-full select-none"
      >
        <title>Piano keyboard</title>
        {keys
          .filter((k) => !k.isBlack)
          .map((k) => {
            const x = k.whiteIndex * WHITE_KEY_WIDTH
            const isHighlight = feedback != null && lastPressedMidi != null && k.midi === lastPressedMidi
            return (
              <g
                key={k.midi}
                className="cursor-pointer"
                onPointerDown={(e) => {
                  e.preventDefault()
                  onPlay(k.midi)
                }}
              >
                <rect
                  x={x + 0.5}
                  y={0}
                  width={WHITE_KEY_WIDTH - 1}
                  height={WHITE_KEY_HEIGHT}
                  rx={3}
                  className={cn('stroke-stone-400', isHighlight ? feedbackClass : 'fill-white hover:fill-stone-100')}
                  strokeWidth={1}
                />
                {k.label ? (
                  <text
                    x={x + WHITE_KEY_WIDTH / 2}
                    y={WHITE_KEY_HEIGHT - 10}
                    textAnchor="middle"
                    className="fill-stone-500 text-[10px] font-medium"
                  >
                    {k.label}
                  </text>
                ) : null}
              </g>
            )
          })}
        {keys
          .filter((k) => k.isBlack)
          .map((k) => {
            const xCenter = (k.whiteIndex + 1) * WHITE_KEY_WIDTH
            const x = xCenter - BLACK_KEY_WIDTH / 2
            const isHighlight = feedback != null && lastPressedMidi != null && k.midi === lastPressedMidi
            return (
              <g
                key={k.midi}
                className="cursor-pointer"
                onPointerDown={(e) => {
                  e.preventDefault()
                  onPlay(k.midi)
                }}
              >
                <rect
                  x={x}
                  y={0}
                  width={BLACK_KEY_WIDTH}
                  height={BLACK_KEY_HEIGHT}
                  rx={2}
                  className={cn(
                    'stroke-stone-900',
                    isHighlight ? feedbackClass : 'fill-stone-900 hover:fill-stone-700',
                  )}
                  strokeWidth={1}
                />
              </g>
            )
          })}
      </svg>
    </div>
  )
}
