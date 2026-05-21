let ctx: AudioContext | null = null

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

function midiToFrequency(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12)
}

export function playNote(midi: number, durationMs = 700): void {
  const context = getContext()
  const now = context.currentTime
  const freq = midiToFrequency(midi)
  const duration = durationMs / 1000

  const master = context.createGain()
  master.gain.value = 0
  master.connect(context.destination)

  const partials = [
    { ratio: 1, gain: 0.55, type: 'triangle' as OscillatorType },
    { ratio: 2, gain: 0.15, type: 'sine' as OscillatorType },
    { ratio: 3, gain: 0.06, type: 'sine' as OscillatorType },
  ]

  for (const p of partials) {
    const osc = context.createOscillator()
    osc.type = p.type
    osc.frequency.value = freq * p.ratio
    const g = context.createGain()
    g.gain.value = p.gain
    osc.connect(g)
    g.connect(master)
    osc.start(now)
    osc.stop(now + duration + 0.05)
  }

  const attack = 0.005
  const decay = 0.15
  const sustainLevel = 0.45
  const release = Math.max(0.1, duration - attack - decay)

  master.gain.cancelScheduledValues(now)
  master.gain.setValueAtTime(0, now)
  master.gain.linearRampToValueAtTime(0.8, now + attack)
  master.gain.exponentialRampToValueAtTime(sustainLevel, now + attack + decay)
  master.gain.exponentialRampToValueAtTime(0.0001, now + attack + decay + release)
}

export function primeAudio(): void {
  getContext()
}
