import { useEffect, useRef, useState, type ReactNode } from 'react'
import gsap from 'gsap'
import events from './data/events.json'

// 1. Force smooth interpolation clock alignment (Lock refresh rate to 60fps to prevent 120Hz/144Hz frame pacing mismatch)
gsap.ticker.fps(60)

type Ev = (typeof events)[number]

const REALMS = [
  { id: 'ember', name: 'Regnum Ignis', sub: 'The Ember Realm', c: '200,90,23', desc: 'A volcanic crucible of magma, raw compute, and forging algorithms.' },
  { id: 'frost', name: 'Regnum Glacie', sub: 'The Frost Realm', c: '80,150,220', desc: 'Glacial crevasses beneath emerald auroras, guarding resilient architectures.' },
  { id: 'grove', name: 'Regnum Arcanum', sub: 'The Arcane Grove', c: '115,89,190', desc: 'Floating celestial isles and bioluminescent flora where creative vision takes wing.' }
]

const RM = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
const fmt = (d: string) => new Date(d + 'T00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

const TOTAL_FRAMES = 239
const SIT_FRAME = 72 // Dragon touches down, folds its wings, and rests seated on the precipice

// Exact narrative scroll checkpoints for silky-smooth milestone transitions
export interface Checkpoint {
  id: string
  roman: string
  name: string
  sub: string
  frame: number
}

const CHECKPOINTS: Checkpoint[] = [
  { id: 'hero', roman: 'I', name: 'Precipice', sub: 'The Awakening', frame: 72 },
  { id: 'about', roman: 'II', name: 'Covenant', sub: 'The Fellowship', frame: 76 },
  { id: 'oculus', roman: 'III', name: 'Oculus', sub: 'The Dragon\'s Eye', frame: 126 },
  { id: 'ember', roman: 'IV', name: 'Ignis', sub: 'The Ember Realm', frame: 166 },
  { id: 'frost', roman: 'V', name: 'Glacies', sub: 'The Frost Realm', frame: 194 },
  { id: 'grove', roman: 'VI', name: 'Arcanum', sub: 'The Arcane Grove', frame: 224 },
  { id: 'timeline', roman: 'VII', name: 'Chronica', sub: 'The Schedule', frame: 238 },
  { id: 'gallery', roman: 'VIII', name: 'Monumenta', sub: 'Archival Stills', frame: 238 },
  { id: 'finale', roman: 'IX', name: 'Conclave', sub: 'The Summit', frame: 238 }
]

function getFrameSrc(i: number) {
  return `/media/frames_24fps/frame_${String(i).padStart(4, '0')}.webp`
}

function clamp01(t: number) {
  return t < 0 ? 0 : t > 1 ? 1 : t
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

// 5th-order polynomial Smootherstep — used only for slow reading holds, never the eye zoom
function smootherstep(t: number): number {
  const c = clamp01(t)
  return c * c * c * (c * (c * 6 - 15) + 10)
}

function expFollow(current: number, target: number, lambda: number, dt: number) {
  return current + (target - current) * (1 - Math.exp(-lambda * dt))
}

type Landmarks = {
  aboutTop: number
  crossingTop: number
  crossingH: number
  emberTop: number
  frostTop: number
  groveTop: number
  timelineTop: number
  galleryTop: number
  conclaveTop: number
}

function Fleuron() {
  return (
    <div className="fleuron my-4" aria-hidden="true">
      <span className="fleuron-line" />
      <span className="text-xs">✦</span>
      <span className="fleuron-line rev" />
    </div>
  )
}

function Rv({ children, d = 0, className = '', as: T = 'div' }: { children: ReactNode; d?: number; className?: string; as?: any }) {
  const r = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = r.current!
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        el.classList.add('in')
        io.disconnect()
      }
    }, { threshold: .15 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return <T ref={r} className={`rv ${className}`} style={{ transitionDelay: `${d}ms` }}>{children}</T>
}

function Count({ to, label, roman }: { to: number; label: string; roman?: string }) {
  const [n, setN] = useState(0), r = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      const s = performance.now()
      const f = (t: number) => {
        const k = Math.min(1, (t - s) / 1400)
        setN(Math.round(to * (1 - Math.pow(1 - k, 3))))
        if (k < 1) requestAnimationFrame(f)
      }
      RM ? setN(to) : requestAnimationFrame(f)
    })
    io.observe(r.current!)
    return () => io.disconnect()
  }, [to])
  return (
    <div ref={r} className="text-center p-3 border border-[#c5a059]/20 bg-[#080706]/40">
      <div className="disp text-3xl sm:text-4xl text-[#c5a059]">{n}+</div>
      <div className="mt-1 font-serif text-[11px] tracking-[0.2em] uppercase text-white/70">{label}</div>
      {roman && <div className="text-[9px] font-serif tracking-[0.25em] text-[#c5a059]/50 mt-0.5">{roman}</div>}
    </div>
  )
}

function Loader({ p, done }: { p: number; done: boolean }) {
  return (
    <div className="ld" style={{ opacity: done ? 0 : 1, pointerEvents: done ? 'none' : 'auto' }} role="status" aria-live="polite">
      <div className="text-center px-4">
        <p className="font-serif text-xs tracking-[0.35em] text-[#c5a059] uppercase mb-4">MMXXVI · Inscriptio</p>
        <h1 className="disp" style={{ ['--p' as any]: `${p}%` }}>
          {'CATALYST'.split('').map((c, i) => (
            <span key={i} className="letter" style={{ animationDelay: `${i * 90}ms` }}>{c}</span>
          ))}
        </h1>
        <div className="fleuron mt-4 mb-2">
          <span className="fleuron-line" />
          <span className="text-xs">✦</span>
          <span className="fleuron-line rev" />
        </div>
        <p className="font-serif text-xs tracking-[0.25em] text-[#c5a059]">{Math.round(p)}%</p>
      </div>
    </div>
  )
}

function Timeline() {
  const r = useRef<HTMLDivElement>(null), [p, setP] = useState(0)
  useEffect(() => {
    const f = () => {
      const b = r.current!.getBoundingClientRect()
      setP(Math.min(1, Math.max(0, (innerHeight * .6 - b.top) / b.height)))
    }
    f()
    addEventListener('scroll', f, { passive: true })
    return () => removeEventListener('scroll', f)
  }, [])
  const ev = [...events].sort((a, b) => a.date.localeCompare(b.date))
  return (
    <div ref={r} className="relative mx-auto mt-14 max-w-2xl pl-10">
      <svg className="absolute left-3 top-0 h-full w-1" preserveAspectRatio="none" viewBox="0 0 2 100" aria-hidden>
        <line x1="1" y1="0" x2="1" y2="100" stroke="#c5a059" strokeOpacity="0.2" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        <line x1="1" y1="0" x2="1" y2="100" stroke="#c5a059" strokeWidth="2" vectorEffect="non-scaling-stroke" pathLength={100} strokeDasharray={100} strokeDashoffset={100 - p * 100} />
      </svg>
      {ev.map((e, i) => {
        const lit = p >= (i + .5) / ev.length
        return (
          <div key={e.id} className="relative pb-12">
            <span
              className="absolute -left-[35px] top-1.5 h-4 w-4 rotate-45 border transition-all duration-500"
              style={{
                borderColor: lit ? '#c5a059' : '#c5a05960',
                background: lit ? '#c5a059' : '#080706',
                boxShadow: lit ? '0 0 14px rgba(197,160,89,0.7)' : 'none'
              }}
            />
            <div className="classic-box p-6">
              <div className="flex items-center justify-between text-xs text-[#c5a059] font-serif tracking-[0.2em] uppercase">
                <span>{fmt(e.date)}</span>
                <span>{e.time}</span>
              </div>
              <h3 className="disp mt-2 text-xl text-[#f4eee2]">{e.name}</h3>
              <p className="mt-1 text-xs tracking-wider text-white/70 font-serif uppercase">{e.venue}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Countdown() {
  const next = events.map(e => +new Date(e.date + 'T00:00')).filter(t => t > Date.now()).sort((a, b) => a - b)[0]
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(i)
  }, [])
  if (!next) return null
  const s = Math.max(0, Math.floor((next - now) / 1000))
  const u = [['Days', Math.floor(s / 86400)], ['Hours', Math.floor(s / 3600) % 24], ['Minutes', Math.floor(s / 60) % 60], ['Seconds', s % 60]]
  return (
    <div className="mt-10 flex justify-center gap-3 sm:gap-6" aria-label="Countdown to next event">
      {u.map(([l, v]) => (
        <div key={l} className="classic-box min-w-18 sm:min-w-22 px-4 py-4 text-center">
          <div className="disp text-3xl sm:text-4xl text-[#c5a059]">{String(v).padStart(2, '0')}</div>
          <div className="mt-1 font-serif text-[10px] sm:text-xs tracking-[0.25em] uppercase text-white/60">{l}</div>
        </div>
      ))}
    </div>
  )
}

function Tilt({ src, onOpen, i }: { src: string; onOpen: () => void; i: number }) {
  return (
    <button
      onClick={onOpen}
      aria-label={`Open archival still ${i + 1}`}
      className="mb-5 block w-full overflow-hidden border border-[#c5a059]/30 p-1.5 bg-[#080706]/60 transition-transform duration-300 will-change-transform cursor-pointer hover:border-[#c5a059]"
      onMouseMove={e => {
        const b = e.currentTarget.getBoundingClientRect()
        const x = (e.clientX - b.left) / b.width - .5
        const y = (e.clientY - b.top) / b.height - .5
        e.currentTarget.style.transform = `perspective(700px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) scale(1.015)`
      }}
      onMouseLeave={e => e.currentTarget.style.transform = ''}
    >
      <img
        loading="lazy"
        src={src}
        alt={`Archival depiction, plate ${i + 1}`}
        className="w-full"
        style={{ aspectRatio: i % 3 === 0 ? '3/4' : '16/10', objectFit: 'cover' }}
      />
    </button>
  )
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [loadP, setLoadP] = useState(0)
  const [ready, setReady] = useState(false)
  const [done, setDone] = useState(false)
  const [ri, setRi] = useState(-1)
  const [activeCpIdx, setActiveCpIdx] = useState(0)
  const [open, setOpen] = useState<Ev | null>(null)
  const [box, setBox] = useState<string | null>(null)

  const dlg = useRef<HTMLDialogElement>(null)
  const lb = useRef<HTMLDialogElement>(null)

  const imagesRef = useRef<HTMLImageElement[]>([])
  const loadedSetRef = useRef<Uint8Array>(new Uint8Array(TOTAL_FRAMES))
  const playheadRef = useRef({ frame: 0 })
  const targetFrameRef = useRef(0)
  const introPhaseRef = useRef<'intro' | 'seated' | 'scrolled'>('intro')
  const lastTimeRef = useRef(performance.now())
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const canvasSizeRef = useRef({ tw: 0, th: 0 })
  const drawRectRef = useRef({ dx: 0, dy: 0, dw: 0, dh: 0 })
  const lastGoodFrameRef = useRef(0)
  const lastDrawnRef = useRef(-1)
  const scrollAnimRef = useRef(0)
  const cpYRef = useRef<number[]>([])

  // Landmark measurements
  const landmarksRef = useRef<Landmarks>({
    aboutTop: 780,
    crossingTop: 1560,
    crossingH: 1200,
    emberTop: 2800,
    frostTop: 4100,
    groveTop: 5400,
    timelineTop: 6700,
    galleryTop: 8100,
    conclaveTop: 9500
  })

  // Preload all 239 WebP frames directly into browser RAM and pre-decode them
  useEffect(() => {
    const images: HTMLImageElement[] = new Array(TOTAL_FRAMES)
    imagesRef.current = images

    let loadedCount = 0
    let inFlight = 0
    let q = 0
    let becameReady = false
    const CONCURRENCY = 28

    const order: number[] = []
    for (let i = 0; i < TOTAL_FRAMES; i++) {
      order.push(i)
    }

    const checkReady = () => {
      // Ready when all frames (or at least 96% in case of network anomaly) are loaded in RAM
      if (!becameReady && loadedCount >= Math.floor(TOTAL_FRAMES * 0.96)) {
        becameReady = true
        setReady(true)
        setTimeout(() => setDone(true), 500)
      }
    }

    const handleFrameDone = (i: number) => {
      inFlight--
      if (!loadedSetRef.current[i]) {
        loadedSetRef.current[i] = 1
        loadedCount++
      }
      setLoadP(Math.min(100, Math.round((loadedCount / TOTAL_FRAMES) * 100)))
      checkReady()
      pump()
    }

    const startLoad = (i: number) => {
      const img = new Image()
      img.decoding = 'async'
      img.fetchPriority = i <= 80 ? 'high' : 'auto'
      img.onload = async () => {
        try {
          if (img.decode) await img.decode()
        } catch {}
        handleFrameDone(i)
      }
      img.onerror = () => handleFrameDone(i)
      images[i] = img
      inFlight++
      img.src = getFrameSrc(i)
    }

    const pump = () => {
      while (inFlight < CONCURRENCY && q < order.length) {
        startLoad(order[q++])
      }
    }

    pump()

    // Safety fallback: if on an extremely constrained network, unlock after 3s if intro frames are loaded
    const fallbackTimer = setTimeout(() => {
      if (!becameReady && loadedCount >= SIT_FRAME) {
        becameReady = true
        setReady(true)
        setDone(true)
      }
    }, 3000)

    return () => clearTimeout(fallbackTimer)
  }, [])

  // Measure landmarks on resize & load with true document Y coordinates
  const measureLandmarks = () => {
    const getTop = (id: string) => {
      const el = document.getElementById(id)
      if (!el) return 0
      const rect = el.getBoundingClientRect()
      return Math.round(rect.top + window.scrollY)
    }

    const crossing = document.getElementById('crossing')
    const grove = document.getElementById('grove')
    const aboutTop = getTop('about')
    const crossingTop = getTop('crossing')
    const emberTop = getTop('ember')
    const frostTop = getTop('frost')
    const groveTop = getTop('grove')
    const timelineTop = getTop('timeline') || (grove ? groveTop + grove.offsetHeight : 0)
    const galleryTop = getTop('gallery')
    const conclaveTop = getTop('finale')

    if (aboutTop && crossingTop && emberTop) {
      landmarksRef.current = {
        aboutTop,
        crossingTop,
        crossingH: crossing ? crossing.offsetHeight : 1200,
        emberTop,
        frostTop,
        groveTop,
        timelineTop,
        galleryTop,
        conclaveTop
      }

      cpYRef.current = CHECKPOINTS.map(cp => {
        switch (cp.id) {
          case 'hero':
            return 0
          case 'about':
            return aboutTop
          case 'oculus': {
            const span = Math.max(1, emberTop - crossingTop)
            return Math.round(crossingTop + span * ((126 - 80) / (166 - 80)))
          }
          case 'ember':
            return emberTop
          case 'frost':
            return frostTop
          case 'grove':
            return groveTop
          case 'timeline':
            return timelineTop
          case 'gallery':
            return galleryTop
          case 'finale':
            return conclaveTop
          default:
            return 0
        }
      })
    }
  }

  useEffect(() => {
    measureLandmarks()
    window.addEventListener('resize', measureLandmarks, { passive: true })
    window.addEventListener('load', measureLandmarks)
    const ro = new ResizeObserver(measureLandmarks)
    if (document.body) ro.observe(document.body)
    return () => {
      window.removeEventListener('resize', measureLandmarks)
      window.removeEventListener('load', measureLandmarks)
      ro.disconnect()
    }
  }, [ready])

  // Get precise Y scroll coordinate for any checkpoint
  const getCheckpointY = (cpId: string): number => {
    const idx = CHECKPOINTS.findIndex(c => c.id === cpId)
    if (idx >= 0 && cpYRef.current[idx] !== undefined) {
      return cpYRef.current[idx]
    }
    const lm = landmarksRef.current
    switch (cpId) {
      case 'hero':
        return 0
      case 'about':
        return lm.aboutTop
      case 'oculus': {
        const span = Math.max(1, lm.emberTop - lm.crossingTop)
        return lm.crossingTop + span * ((126 - 80) / (166 - 80))
      }
      case 'ember':
        return lm.emberTop
      case 'frost':
        return lm.frostTop
      case 'grove':
        return lm.groveTop
      case 'timeline':
        return lm.timelineTop
      case 'gallery':
        return lm.galleryTop
      case 'finale':
        return lm.conclaveTop
      default:
        return 0
    }
  }

  // Scroll → frame: linear through the dragon's eye so zoom never stalls at stage knots
  const getCheckpointTarget = (y: number): number => {
    if (y <= 5) return SIT_FRAME

    const lm = landmarksRef.current

    // 1. Hero -> About: Dragon resting on cliff (72 -> 76)
    if (y <= lm.aboutTop) {
      const t = y / Math.max(1, lm.aboutTop)
      return lerp(72, 76, t)
    }

    // 2. About section: Dragon watchful (76 -> 80)
    if (y <= lm.crossingTop) {
      const span = Math.max(1, lm.crossingTop - lm.aboutTop)
      const t = (y - lm.aboutTop) / span
      return lerp(76, 80, t)
    }

    // 3. Eye zoom & portal: 1:1 with scroll (80 -> 166). No smootherstep plateaus.
    if (y <= lm.emberTop) {
      const span = Math.max(1, lm.emberTop - lm.crossingTop)
      const t = clamp01((y - lm.crossingTop) / span)
      return lerp(80, 166, t)
    }

    // 4. Regnum Ignis (Ember Realm) -> Regnum Glacie (Frost Realm)
    // First 65% holds the volcanic plateau (166 -> 174) for reading event trials
    // Remaining 35% transitions smoothly through the emerald aurora (174 -> 194)
    if (y <= lm.frostTop) {
      const span = Math.max(1, lm.frostTop - lm.emberTop)
      const t = (y - lm.emberTop) / span
      if (t < 0.65) {
        return 166 + (174 - 166) * smootherstep(t / 0.65)
      } else {
        return 174 + (194 - 174) * smootherstep((t - 0.65) / 0.35)
      }
    }

    // 5. Regnum Glacie (Frost Realm) -> Regnum Arcanum (Arcane Grove)
    // First 65% holds glacial chasm (194 -> 202) for reading Frost trials
    // Remaining 35% parts the clouds into Arcanum (202 -> 224)
    if (y <= lm.groveTop) {
      const span = Math.max(1, lm.groveTop - lm.frostTop)
      const t = (y - lm.frostTop) / span
      if (t < 0.65) {
        return 194 + (202 - 194) * smootherstep(t / 0.65)
      } else {
        return 202 + (224 - 202) * smootherstep((t - 0.65) / 0.35)
      }
    }

    // 6. Regnum Arcanum (Arcane Grove) -> Chronicle & Conclave
    // First 65% holds celestial isles (224 -> 230) for reading Grove trials
    // Remaining 35% ascends to the panoramic summit (230 -> 238)
    if (y <= lm.timelineTop) {
      const span = Math.max(1, lm.timelineTop - lm.groveTop)
      const t = (y - lm.groveTop) / span
      if (t < 0.65) {
        return 224 + (230 - 224) * smootherstep(t / 0.65)
      } else {
        return 230 + (238 - 230) * smootherstep((t - 0.65) / 0.35)
      }
    }

    // 7. Remainder of page (Chronicle, Archive, Finale)
    return 238
  }

  // Smoothly scroll to any checkpoint without fighting the frame scrubber
  const scrollToCp = (cp: Checkpoint) => {
    const targetY = getCheckpointY(cp.id)
    cancelAnimationFrame(scrollAnimRef.current)
    if (RM) {
      window.scrollTo(0, targetY)
      return
    }
    const start = window.scrollY
    const dist = targetY - start
    if (Math.abs(dist) < 2) return
    const dur = Math.min(900, Math.max(380, Math.abs(dist) * 0.38))
    const t0 = performance.now()
    const easeOut = (t: number) => 1 - (1 - t) * (1 - t) * (1 - t)
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / dur)
      window.scrollTo(0, start + dist * easeOut(k))
      if (k < 1) scrollAnimRef.current = requestAnimationFrame(step)
    }
    scrollAnimRef.current = requestAnimationFrame(step)
  }

  const getFrameImage = (idx: number): HTMLImageElement | null => {
    const images = imagesRef.current
    const loaded = loadedSetRef.current
    if (images[idx] && loaded[idx]) {
      lastGoodFrameRef.current = idx
      return images[idx]
    }
    for (let offset = 1; offset < 10; offset++) {
      if (idx - offset >= 0 && loaded[idx - offset]) {
        lastGoodFrameRef.current = idx - offset
        return images[idx - offset]
      }
      if (idx + offset < TOTAL_FRAMES && loaded[idx + offset]) {
        lastGoodFrameRef.current = idx + offset
        return images[idx + offset]
      }
    }
    const fallback = lastGoodFrameRef.current
    if (images[fallback] && loaded[fallback]) return images[fallback]
    return images[idx] || null
  }

  useEffect(() => {
    let rafId = 0
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d', { alpha: false })
      if (ctx) {
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'low'
      }
      ctxRef.current = ctx
    }

    const fitCanvas = () => {
      if (!canvas) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const tw = Math.round(canvas.clientWidth * dpr)
      const th = Math.round(canvas.clientHeight * dpr)
      if (canvas.width !== tw || canvas.height !== th) {
        canvas.width = tw
        canvas.height = th
        lastDrawnRef.current = -1
      }
      canvasSizeRef.current = { tw, th }

      // Source video frame resolution is 1280x720
      const iw = 1280
      const ih = 720
      const s = Math.max(tw / iw, th / ih)
      const dw = Math.round(iw * s)
      const dh = Math.round(ih * s)
      const dx = Math.round((tw - dw) / 2)
      const dy = Math.round((th - dh) / 2)
      drawRectRef.current = { dx, dy, dw, dh }
    }
    fitCanvas()
    const ro = canvas ? new ResizeObserver(fitCanvas) : null
    if (canvas && ro) ro.observe(canvas)

    const tick = (time: number, deltaTime: number) => {
      const dt = Math.min(0.05, (deltaTime || 16.66) / 1000)
      const y = window.scrollY
      const scrollTarget = getCheckpointTarget(y)

      if (y > 20) introPhaseRef.current = 'scrolled'

      if (introPhaseRef.current === 'intro') {
        if (ready) {
          playheadRef.current.frame += dt * 24
          if (playheadRef.current.frame >= SIT_FRAME) {
            playheadRef.current.frame = SIT_FRAME
            introPhaseRef.current = 'seated'
          }
        }
      } else if (introPhaseRef.current === 'seated' && y <= 5) {
        // Subtle resting breath idle on the precipice
        const idle = Math.sin(time * 1.6) * 1.8
        const target = SIT_FRAME + idle
        playheadRef.current.frame += (target - playheadRef.current.frame) * (1 - Math.exp(-6 * dt))
      } else if (RM) {
        playheadRef.current.frame = scrollTarget
      } else {
        // 2. Change Scrub to a Tiny Inertia Float (0.1s momentum lag with power1.out ease)
        // Masks irregular slow mouse wheel ticks and smooths out micro-steps
        if (Math.abs(scrollTarget - targetFrameRef.current) > 0.001) {
          targetFrameRef.current = scrollTarget
          gsap.to(playheadRef.current, {
            frame: scrollTarget,
            duration: 0.1, // Tiny momentum lag to mask slow wheel stutter
            ease: 'power1.out', // Smooths out the micro-steps
            overwrite: 'auto'
          })
        }
      }

      const curF = playheadRef.current.frame

      // Milestone HUD active checkpoint indicator
      let passed = 0
      const mark = y + innerHeight * 0.22
      const cpYs = cpYRef.current
      for (let i = 0; i < CHECKPOINTS.length; i++) {
        if (mark >= (cpYs[i] ?? 0)) passed = i
      }
      setActiveCpIdx(prev => (prev === passed ? prev : passed))

      // Crucial Rule: jumping between frames is a single ctx.drawImage() call (<1ms)
      // Zero-latency forward & backward scrubbing with zero ghosting or alpha blend blur
      const ctx = ctxRef.current
      const drawRect = drawRectRef.current
      if (ctx && ready && drawRect.dw > 0 && drawRect.dh > 0) {
        const frameIdx = Math.min(TOTAL_FRAMES - 1, Math.max(0, Math.round(curF)))

        if (frameIdx !== lastDrawnRef.current) {
          const img = getFrameImage(frameIdx)
          if (img && img.naturalWidth) {
            ctx.drawImage(img, drawRect.dx, drawRect.dy, drawRect.dw, drawRect.dh)
            lastDrawnRef.current = frameIdx
          }
        }
      }

      const nextRi = curF >= 211 ? 2 : curF >= 181 ? 1 : curF >= 160 ? 0 : -1
      setRi(r => (r === nextRi ? r : nextRi))
    }

    // 1. Force smooth interpolation clock alignment (locked to steady 60fps)
    gsap.ticker.add(tick)

    return () => {
      gsap.ticker.remove(tick)
      cancelAnimationFrame(scrollAnimRef.current)
      ro?.disconnect()
    }
  }, [ready])

  useEffect(() => {
    open ? dlg.current?.showModal() : dlg.current?.close()
  }, [open])

  useEffect(() => {
    box ? lb.current?.showModal() : lb.current?.close()
  }, [box])

  const g = ri >= 0 ? `rgba(${REALMS[ri].c},.45)` : 'transparent'

  return (
    <>
      <Loader p={loadP} done={done} />

      <div className="bg" aria-hidden>
        <img
          src="/media/poster.jpg"
          alt=""
          style={{ opacity: ready ? 0 : 1, transition: 'opacity 0.6s ease' }}
        />
        <canvas
          ref={canvasRef}
          id="throne-canvas"
          style={{ opacity: ready ? 1 : 0, transition: 'opacity 0.8s ease' }}
        />
        <div className="grade" style={{ background: g }} />
        <div className="vig" />
        <div className="grain" />
      </div>

      {/* Classical Archival Header */}
      <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-6 py-5 sm:px-12 border-b border-[#c5a059]/15 bg-[#080706]/70 backdrop-blur-md">
        <a href="#top" className="flex items-center gap-3">
          <span className="disp text-xl tracking-[0.18em] text-[#c5a059]">CATALYST</span>
          <span className="hidden sm:inline font-serif text-[10px] tracking-[0.3em] text-[#c5a059]/60 uppercase border-l border-[#c5a059]/30 pl-3">MMXXVI</span>
        </a>
        <nav className="hidden gap-8 text-xs font-serif tracking-[0.25em] uppercase md:flex" aria-label="Primary">
          {[
            ['about', 'Prologue'],
            ['realms', 'Realms'],
            ['timeline', 'Chronicle'],
            ['gallery', 'Archive'],
            ['finale', 'Conclave']
          ].map(([h, l]) => (
            <a key={h} href={'#' + h} className="text-[#f4eee2]/80 hover:text-[#c5a059] transition-colors">
              {l}
            </a>
          ))}
        </nav>
        <a href="#finale" className="classic-btn py-1.5 px-4 text-[10px]">
          Enlist
        </a>
      </header>

      {/* Classical Vertical Checkpoints Rail (Fixed HUD) */}
      <aside aria-label="Milestone Checkpoints" className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col items-center pointer-events-auto">
        <div className="relative flex flex-col items-center gap-3.5 py-4 px-2.5 bg-[#080706]/75 backdrop-blur-md border border-[#c5a059]/25 shadow-[0_8px_32px_rgba(0,0,0,0.65)]">
          <span className="text-[9px] font-serif text-[#c5a059]/50 tracking-widest uppercase mb-1">MMXXVI</span>
          <div className="w-4 h-px bg-[#c5a059]/30 mb-0.5" />

          {CHECKPOINTS.map((cp, idx) => {
            const isActive = activeCpIdx === idx
            return (
              <button
                key={cp.id}
                onClick={() => scrollToCp(cp)}
                aria-label={`Milestone ${cp.roman}: ${cp.name} (${cp.sub})`}
                className="group relative flex items-center justify-center p-1 cursor-pointer focus:outline-none"
              >
                {/* Diamond milestone node */}
                <span
                  className={`block w-2.5 h-2.5 rotate-45 border transition-all duration-300 ${
                    isActive
                      ? 'bg-[#c5a059] border-[#c5a059] shadow-[0_0_14px_rgba(197,160,89,0.9)] scale-125'
                      : 'bg-[#080706] border-[#c5a059]/35 group-hover:border-[#c5a059] group-hover:scale-110'
                  }`}
                />
                {/* Floating tooltip displaying checkpoint name & Roman chapter */}
                <span
                  className={`absolute right-8 font-serif text-[10px] tracking-[0.22em] uppercase whitespace-nowrap px-3 py-1.5 border transition-all duration-300 pointer-events-none shadow-xl ${
                    isActive
                      ? 'opacity-100 translate-x-0 bg-[#080706]/95 border-[#c5a059]/70 text-[#c5a059]'
                      : 'opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 bg-[#080706]/90 border-[#c5a059]/30 text-white/70'
                  }`}
                >
                  <span className="text-[#c5a059] font-semibold mr-1.5">{cp.roman} ·</span>
                  <span className="text-[#f4eee2]">{cp.name}</span>
                  <span className="text-[#c5a059]/60 text-[9px] ml-1.5 font-sans lowercase tracking-normal">({cp.sub})</span>
                </span>
              </button>
            )
          })}

          <div className="w-4 h-px bg-[#c5a059]/30 mt-0.5" />
          <span className="text-[9px] text-[#c5a059]/60 font-serif">✦</span>
        </div>
      </aside>

      <main id="top">
        {/* I. HERO / PROLOGUE: Flight lands here; dragon seated on cliff */}
        <section id="hero" className="sec flex flex-col justify-end" aria-label="Hero">
          <div className="min-h-[55vh]" />
          <p className="font-serif text-xs tracking-[0.35em] text-[#c5a059] uppercase mb-3">I. Liber Primus · The Awakening</p>
          <h1 className="disp text-[clamp(2.8rem,13vw,10.5rem)] leading-none text-[#f4eee2]">CATALYST</h1>
          <Fleuron />
          <p className="mt-2 max-w-lg font-serif text-base sm:text-lg text-white/85 tracking-wide leading-relaxed">
            The primordial flame rekindles. A collegiate hackathon across three mythical elemental realms.
          </p>
          <div className="mt-8 flex items-center gap-4">
            <a href="#about" className="classic-btn cue">
              Venture Forward ↓
            </a>
            <span className="font-serif text-[11px] tracking-[0.25em] text-[#c5a059]/70 uppercase hidden sm:inline">
              Scroll through the milestones
            </span>
          </div>
        </section>

        {/* II. PROLOGUE / ABOUT: Dragon perched observing */}
        <section id="about" className="sec flex items-center" aria-labelledby="ab">
          <div className="classic-box max-w-2xl p-8 sm:p-12">
            <span className="font-serif text-[11px] tracking-[0.3em] uppercase text-[#c5a059] block mb-2">Expositio · The Covenant</span>
            <Rv as="h2" className="disp text-2xl sm:text-4xl text-[#f4eee2]"><span id="ab">What is Catalyst?</span></Rv>
            <Fleuron />
            <Rv as="p" d={150} className="mt-4 font-serif text-sm sm:text-base text-white/85 leading-relaxed">
              A 36-hour immersive hackathon uniting 500+ scholars, engineers, and visionaries within an epic mythic universe.
            </Rv>
            <Rv as="p" d={300} className="mt-4 font-serif text-sm sm:text-base text-white/85 leading-relaxed">
              Three elemental realms ignite your craft: Ember for compute & autonomous systems, Frost for immutable infrastructure & cryptography, Grove for boundless algorithmic creation.
            </Rv>
            <Rv as="p" d={450} className="mt-4 font-serif text-sm sm:text-base text-white/85 leading-relaxed">
              Venture downward across the threshold of the dragon's eye to unlock the portals of invention.
            </Rv>

            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Count to={6} label="Realms & Trials" roman="VI Trials" />
              <Count to={500} label="Craftsmen" roman="D+ Scholars" />
              <Count to={20} label="Guilds & Houses" roman="XX Guilds" />
              <Count to={100} label="Treasury (₹k)" roman="C k Bounties" />
            </div>

            <div className="mt-8 flex items-center gap-3">
              <a href="#realms" className="classic-btn text-[11px]">
                Enter The Realms ↓
              </a>
              <span className="font-serif text-[11px] tracking-widest text-[#c5a059]/60 uppercase">
                Scroll to cross the portal
              </span>
            </div>
          </div>
        </section>

        {/* III. THE OCULUS TRANSITION RUNWAY (Pure cinematic visual scroll corridor: zero text roadblock) */}
        <div id="crossing" className="relative h-[230vh] w-full pointer-events-none" aria-hidden="true" />

        {/* IV. TRIA REGNA (The Three Elemental Realms — Centered with generous min-h-[120vh] runway) */}
        <div id="realms">
          {REALMS.map((r, i) => {
            const list = events.filter(e => e.realm === r.id)
            const romanNumerals = ['III.I', 'III.II', 'III.III']
            return (
              <section key={r.id} id={r.id} className="sec min-h-[120vh] flex flex-col justify-center" aria-labelledby={'h-' + r.id}>
                <div className="max-w-4xl mb-8">
                  <span className="font-serif text-xs tracking-[0.35em] text-[#c5a059] uppercase block mb-2">{romanNumerals[i]} · {r.sub}</span>
                  <Rv as="h2" className="disp text-3xl sm:text-6xl text-[#f4eee2]"><span id={'h-' + r.id}>{r.name}</span></Rv>
                  <p className="mt-2 font-serif text-sm sm:text-base text-white/80 max-w-xl">{r.desc}</p>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  {list.map((e, j) => (
                    <Rv key={e.id} d={j * 150} className="classic-box p-6 sm:p-7">
                      <div className="flex items-center justify-between">
                        <span className="font-serif text-[10px] tracking-[0.25em] uppercase px-2 py-0.5 border" style={{ borderColor: `${e.themeColor}60`, color: e.themeColor }}>
                          {e.category}
                        </span>
                        <span className="font-serif text-[10px] tracking-widest text-[#c5a059]/80 uppercase">Trial {j + 1}</span>
                      </div>
                      <h3 className="disp mt-3 text-2xl text-[#f4eee2]">{e.name}</h3>
                      <p className="mt-1 font-serif text-sm text-white/80">{e.tagline}</p>
                      <div className="mt-4 pt-4 border-t border-[#c5a059]/20 flex items-center justify-between text-xs font-serif tracking-wider text-white/70">
                        <span>{fmt(e.date)}</span>
                        <span>{e.venue}</span>
                      </div>
                      <button className="classic-btn mt-5 w-full text-center" onClick={() => setOpen(e)} aria-haspopup="dialog">
                        Inspect Codex
                      </button>
                    </Rv>
                  ))}
                </div>
              </section>
            )
          })}
        </div>

        {/* V. CHRONICA / SCHEDULE */}
        <section id="timeline" className="sec" aria-labelledby="tl">
          <div className="text-center max-w-xl mx-auto">
            <span className="font-serif text-xs tracking-[0.35em] text-[#c5a059] uppercase block mb-2">IV. Chronica</span>
            <Rv as="h2" className="disp text-3xl sm:text-5xl text-[#f4eee2]"><span id="tl">The Path of the Flame</span></Rv>
            <Fleuron />
            <p className="font-serif text-sm text-white/75 tracking-wider">The ordered rites and gatherings of the collegiate council.</p>
          </div>
          <Timeline />
        </section>

        {/* VI. ARCHIVUM / GALLERY */}
        <section id="gallery" className="sec" aria-labelledby="gl">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="font-serif text-xs tracking-[0.35em] text-[#c5a059] uppercase block mb-2">V. Monumenta</span>
            <Rv as="h2" className="disp text-3xl sm:text-5xl text-[#f4eee2]"><span id="gl">Archival Stills</span></Rv>
            <Fleuron />
          </div>
          <div className="columns-2 gap-5 md:columns-3">
            {[1, 2, 3, 4, 5, 6].map((n, i) => (
              <Tilt key={n} i={i} src={`/gallery/g${n}.jpg`} onOpen={() => setBox(`/gallery/g${n}.jpg`)} />
            ))}
          </div>

          <div className="mt-20 text-center max-w-xl mx-auto">
            <span className="font-serif text-xs tracking-[0.35em] text-[#c5a059] uppercase block mb-2">Magistri & Praetors</span>
            <Rv as="h2" className="disp text-2xl sm:text-4xl text-[#f4eee2]">Honored Guilds & Mentors</Rv>
            <Fleuron />
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {[
              { role: 'Magister of Machine Systems', org: 'Guild of Deep Compute' },
              { role: 'Archon of Cryptographic Seals', org: 'Consortium of Open Nets' },
              { role: 'Visionary of Algorithmic Worlds', org: 'Academy of Synthetic Arts' }
            ].map((sp, idx) => (
              <Rv key={idx} d={idx * 120} className="classic-box p-6 text-center">
                <div className="disp text-lg text-[#c5a059]">[PRECEPTOR {idx + 1}]</div>
                <div className="font-serif text-xs tracking-[0.2em] text-[#f4eee2] uppercase mt-1">{sp.role}</div>
                <div className="font-serif text-[11px] tracking-widest text-white/60 mt-1">{sp.org}</div>
              </Rv>
            ))}
          </div>

          <div className="mt-14 overflow-hidden border-y border-[#c5a059]/20 py-4 bg-[#080706]/40" aria-label="Patrons of the Flame">
            <div className="mq">
              {[...Array(16)].map((_, i) => (
                <span key={i} className="disp whitespace-nowrap text-sm tracking-[0.3em] uppercase text-[#c5a059]/50">
                  ✦ PATRON GUILD {(i % 8) + 1}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* VII. CONCLAVE / REGISTRATION */}
        <section id="finale" className="sec flex flex-col items-center justify-center text-center" aria-labelledby="fn">
          <div className="classic-box max-w-2xl p-10 sm:p-14">
            <span className="font-serif text-xs tracking-[0.35em] text-[#c5a059] uppercase block mb-2">VI. Conclave</span>
            <Rv as="h2" className="disp text-3xl sm:text-6xl text-[#f4eee2]"><span id="fn">Join the Flame</span></Rv>
            <Fleuron />
            <Rv as="p" d={150} className="mx-auto mt-3 max-w-md font-serif text-sm sm:text-base text-white/80 leading-relaxed">
              The grand convocations commence when the sands run dry. Prepare your fellowship.
            </Rv>
            <Countdown />
            <Rv d={300} className="mt-10">
              <a className="classic-btn px-10 py-3.5 text-xs sm:text-sm tracking-[0.25em]" href={events[0].registerUrl}>
                Seal Your Concordat
              </a>
            </Rv>
          </div>
        </section>

        {/* CLASSICAL COLOPHON FOOTER */}
        <footer className="relative z-10 border-t border-[#c5a059]/20 bg-[#080706]/95 px-6 py-12 text-xs sm:px-12 font-serif">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6">
            <div>
              <div className="disp text-lg text-[#c5a059] tracking-[0.2em]">CATALYST · MMXXVI</div>
              <p className="text-white/60 mt-1 text-[11px] tracking-wider">A collegiate symposium of technical mastery and mythic invention.</p>
            </div>
            <div className="flex gap-6 text-[#f4eee2]/80 tracking-widest uppercase text-[11px]">
              {['Instagram', 'X · Twitter', 'LinkedIn'].map(s => (
                <a key={s} href="#" className="hover:text-[#c5a059] transition-colors">{s}</a>
              ))}
            </div>
            <button className="classic-btn ghost text-[10px] py-1.5 px-4" onClick={() => scrollTo({ top: 0, behavior: 'smooth' })}>
              ↑ Ascend To Precipice
            </button>
          </div>
        </footer>
      </main>

      {/* Classical Modal Dialog */}
      <dialog ref={dlg} onClose={() => setOpen(null)} onClick={e => { if (e.target === dlg.current) setOpen(null) }} aria-labelledby="mt">
        {open && (
          <div className="p-7 sm:p-10 font-serif">
            <img src={open.image} alt="" className="mb-6 h-48 w-full border border-[#c5a059]/30 object-cover" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-serif uppercase tracking-[0.25em] px-2 py-0.5 border" style={{ borderColor: `${open.themeColor}70`, color: open.themeColor }}>
                {open.category}
              </span>
              <span className="text-xs text-[#c5a059] tracking-widest">{fmt(open.date)}</span>
            </div>
            <h2 id="mt" className="disp mt-3 text-2xl sm:text-3xl text-[#f4eee2]">{open.name}</h2>
            <p className="mt-1 text-xs text-white/70 tracking-wider uppercase">{open.venue} · {open.time}</p>
            <Fleuron />
            <p className="mt-4 text-sm text-white/90 leading-relaxed">{open.description}</p>
            <h3 className="mt-6 font-serif text-xs uppercase tracking-[0.25em] text-[#c5a059]">Trial Rules & Decrees</h3>
            <ul className="mt-2 list-disc pl-5 text-xs text-white/80 space-y-1">
              {open.rules.map(r => <li key={r}>{r}</li>)}
            </ul>
            <p className="mt-5 text-xs tracking-wider border-t border-[#c5a059]/20 pt-4">
              <span className="text-[#c5a059] uppercase tracking-[0.2em] font-semibold">Bounty Treasury: </span>
              <span className="text-white/90">{open.prizes}</span>
            </p>
            <div className="mt-8 flex gap-4">
              <a className="classic-btn px-6 py-2" href={open.registerUrl}>Enter Trial</a>
              <button className="classic-btn ghost px-6 py-2" onClick={() => setOpen(null)} autoFocus>Close Codex</button>
            </div>
          </div>
        )}
      </dialog>

      <dialog ref={lb} onClose={() => setBox(null)} onClick={() => setBox(null)} aria-label="Archival image viewer">
        {box && (
          <div className="p-3 border border-[#c5a059]/40 bg-[#080706]">
            <img src={box} alt="Enlarged archival still from the Catalyst film" className="max-h-[85vh] w-full object-contain" />
          </div>
        )}
      </dialog>
    </>
  )
}
