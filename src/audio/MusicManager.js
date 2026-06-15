// Procedural chiptune music via Web Audio API

const R = null  // rest

// ── Note frequencies (Hz) ────────────────────────────────────────────────────
const F3=174.61, G3=196.00, A3=220.00, B3=246.94, C4=261.63, D4=293.66, E4=329.63
const G4=392.00, E5=659.25, F5=698.46, G5=783.99, A5=880.00, B5=987.77
const C6=1046.50, D6=1174.66, E6=1318.51

// ── Menu Theme: "Explorer's Fanfare" (G major, 128 BPM, ~11 s loop) ─────────
const MENU_THEME = {
  bpm: 128,
  tracks: [
    {
      wave: 'square',
      volume: 0.06,
      notes: [
        // Phrase A — rising fanfare
        [G5,0.5],[B5,0.5],[D6,1.0],[B5,0.5],[A5,0.5],
        [G5,0.5],[A5,0.5],[B5,1.0],[A5,0.5],[G5,0.5],
        // Phrase B — response
        [A5,0.5],[C6,0.5],[E6,1.0],[C6,0.5],[B5,0.5],
        [A5,0.5],[G5,0.5],[A5,1.0],[G5,1.0],
        // Phrase C — climb
        [D6,0.5],[B5,0.5],[G5,0.5],[B5,0.5],[D6,1.0],
        [E6,0.5],[D6,0.5],[C6,0.5],[B5,0.5],[A5,1.0],
        // Phrase D — run & resolve
        [G5,0.5],[A5,0.5],[B5,0.5],[C6,0.5],[D6,0.5],[E6,0.5],
        [D6,1.0],[G5,1.0],[G5,1.0],
      ],
    },
    {
      wave: 'triangle',
      volume: 0.04,
      notes: [
        [G3,1],[D4,1],[G3,1],
        [G3,1],[D4,1],[G3,1],
        [A3,1],[E4,1],[A3,1],
        [A3,1],[E4,1],[A3,1],
        [B3,1],[G3,1],[B3,1],
        [C4,1],[G4,1],[C4,1],
        [G3,1],[D4,1],[G3,1],
        [G3,1],[G3,1],[G3,1],
      ],
    },
  ],
}

// ── Game Theme: "Forest Sprint" (A minor, 160 BPM, ~6 s loop) ───────────────
const GAME_THEME = {
  bpm: 160,
  tracks: [
    {
      wave: 'square',
      volume: 0.065,
      notes: [
        // Fast arpeggio runs and punchy landings
        [A5,0.25],[C6,0.25],[E6,0.25],[C6,0.25],[A5,0.5],[G5,0.5],
        [F5,0.25],[A5,0.25],[C6,0.25],[A5,0.25],[G5,0.5],[E5,0.5],
        [E6,0.25],[D6,0.25],[C6,0.25],[B5,0.25],[A5,0.5],[G5,0.5],
        [A5,0.5],[E5,0.5],[A5,1.0],
        // Ascending drive
        [G5,0.25],[A5,0.25],[B5,0.25],[C6,0.25],[D6,0.5],[E6,0.5],
        [D6,0.25],[C6,0.25],[B5,0.25],[A5,0.25],[G5,0.5],[F5,0.5],
        // Tension build
        [E5,0.25],[F5,0.25],[G5,0.25],[A5,0.25],[B5,0.5],[C6,0.5],
        [A5,0.5],[G5,0.5],[A5,1.0],
      ],
    },
    {
      wave: 'sawtooth',
      volume: 0.03,
      // Chord roots: Am | Am | F | Am | G | G | E | Am
      notes: [
        [A3,0.5],[E4,0.5],[A3,0.5],[E4,0.5],
        [A3,0.5],[E4,0.5],[A3,0.5],[E4,0.5],
        [F3,0.5],[C4,0.5],[F3,0.5],[C4,0.5],
        [A3,0.5],[E4,0.5],[A3,1.0],
        [G3,0.5],[D4,0.5],[G3,0.5],[D4,0.5],
        [G3,0.5],[D4,0.5],[G3,0.5],[D4,0.5],
        [E4,0.5],[B3,0.5],[E4,0.5],[B3,0.5],
        [A3,0.5],[E4,0.5],[A3,1.0],
      ],
    },
  ],
}

// ── Engine ───────────────────────────────────────────────────────────────────

class MusicManager {
  constructor() {
    this._ctx       = null
    this._nodes     = []
    this._loopTimer = null
    this._theme     = null
    this._muted     = localStorage.getItem('explora_music_muted') === 'true'
  }

  playMenu() { this._play(MENU_THEME) }
  playGame()  { this._play(GAME_THEME) }
  isMuted()   { return this._muted }

  toggle() {
    this._muted = !this._muted
    localStorage.setItem('explora_music_muted', String(this._muted))
    if (this._muted) {
      this._stopAudio()
    } else if (this._theme) {
      this._startAudio()
    }
  }

  stop() {
    this._stopAudio()
    this._theme = null
  }

  _play(theme) {
    this._stopAudio()
    this._theme = theme
    if (!this._muted) this._startAudio()
  }

  _stopAudio() {
    clearTimeout(this._loopTimer)
    this._loopTimer = null
    for (const n of this._nodes) {
      try { n.stop(0) }  catch {}
      try { n.disconnect() } catch {}
    }
    this._nodes = []
  }

  _startAudio() {
    const ctx = this._ctx ?? (this._ctx = new (window.AudioContext || window.webkitAudioContext)())
    const go = () => this._loop(ctx.currentTime + 0.05)
    ctx.state === 'suspended' ? ctx.resume().then(go) : go()
  }

  _loop(startAt) {
    const theme = this._theme
    if (!theme) return
    const ctx  = this._ctx
    const beat = 60 / theme.bpm
    let loopEnd = startAt

    for (const track of theme.tracks) {
      let t = startAt
      for (const [freq, beats] of track.notes) {
        const dur = beats * beat
        if (freq !== null) {
          const osc  = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type            = track.wave
          osc.frequency.value = freq
          gain.gain.setValueAtTime(track.volume, t)
          gain.gain.setValueAtTime(0.001, t + dur * 0.87)
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.start(t)
          osc.stop(t + dur)
          this._nodes.push(osc)
        }
        t += dur
      }
      if (t > loopEnd) loopEnd = t
    }

    const msToNext = Math.max(50, (loopEnd - ctx.currentTime) * 1000 - 200)
    this._loopTimer = setTimeout(() => {
      if (this._theme !== theme || this._muted) return
      this._loop(loopEnd)
    }, msToNext)
  }
}

export const musicManager = new MusicManager()
