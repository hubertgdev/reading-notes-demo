import { SplendidGrandPiano } from 'smplr'

let ctx: AudioContext | null = null
let piano: ReturnType<typeof SplendidGrandPiano> | null = null
let pianoReady: Promise<unknown> | null = null

function getContext(): AudioContext {
  if (!ctx) {
    const Ctor =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) throw new Error('Web Audio API not supported in this browser')
    ctx = new Ctor()
  }
  if (ctx.state === 'suspended') {
    void ctx.resume()
  }
  return ctx
}

function getPiano() {
  if (!piano) {
    const instance = SplendidGrandPiano(getContext())
    piano = instance
    pianoReady = instance.load.catch((err) => {
      console.warn('Piano sample load failed', err)
    })
  }
  return piano
}

export function playNote(midi: number, durationMs = 1500): void {
  const p = getPiano()
  p.start({ note: midi, duration: durationMs / 1000 })
}

export function primeAudio(): void {
  getContext()
  getPiano()
}

export function pianoLoadReady(): Promise<unknown> | null {
  return pianoReady
}
