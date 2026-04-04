import { useEffect, useRef, useState } from 'react'

// Animated counter
function Counter({ value, decimals = 0, duration = 1200 }) {
  const [display, setDisplay] = useState(0)
  const startRef = useRef(0)
  const startValRef = useRef(0)
  const rafRef = useRef(null)

  useEffect(() => {
    startValRef.current = display
    startRef.current = performance.now()
    const target = value

    const animate = (now) => {
      const elapsed = now - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out-cubic
      const current = startValRef.current + (target - startValRef.current) * eased
      setDisplay(current)
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [value])

  return <>{display.toFixed(decimals)}</>
}

// Pulsing status dot
function StatusDot({ color }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: color,
        boxShadow: `0 0 6px 2px ${color}`,
        marginRight: 6,
        animation: 'simPulse 1.2s ease-in-out infinite',
        flexShrink: 0,
      }}
    />
  )
}

const WIND_DIRS = [
  { label: 'North', deg: 0, icon: '↑' },
  { label: 'East',  deg: 90, icon: '→' },
  { label: 'South', deg: 180, icon: '↓' },
  { label: 'West',  deg: 270, icon: '←' },
]

export default function SimHUD({
  isSimulating,
  isDetecting,
  isSuperEmitter,
  emissionRate,
  confidence,
  windDir,
  windDirIndex,
  onSimulate,
  onReset,
  onWindChange,
  elapsedTime,
  showPredictions,
  onTogglePredictions,
  methaneLoss,
  moneyLost,
}) {
  const statusColor = isSuperEmitter ? '#ff4444' : isDetecting ? '#00d4ff' : '#667799'
  const statusText  = isSuperEmitter ? '🚨 SUPER EMITTER DETECTED' : isDetecting ? '🔍 AI Detecting…' : '— Idle'
  const windInfo = WIND_DIRS[windDirIndex % 4]

  return (
    <>
      <style>{`
        @keyframes simPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(1.3); }
        }
        @keyframes simGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(0,212,255,0.2); }
          50%       { box-shadow: 0 0 40px rgba(0,212,255,0.45); }
        }
        @keyframes badgeFlash {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.6; }
        }
      `}</style>

      {/* ── Top Left: Title Badge ── */}
      <div style={{
        position: 'absolute',
        top: 20,
        left: 20,
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: 'rgba(6,10,20,0.85)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(0,212,255,0.25)',
        borderRadius: 12,
        padding: '10px 16px',
      }}>
        <span style={{ fontSize: 22 }}>🛰️</span>
        <div>
          <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 14, color: '#e8f0fe', letterSpacing: '0.04em' }}>
            MethSight AI · 3D Sim
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#4a6fa5', letterSpacing: '0.12em' }}>
            REAL-TIME METHANE DETECTION
          </div>
        </div>
      </div>

      {/* ── Top Right: Status & Detection ── */}
      <div style={{
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 10,
        minWidth: 240,
        background: 'rgba(6,10,20,0.88)',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${isSuperEmitter ? 'rgba(255,68,68,0.4)' : 'rgba(0,212,255,0.2)'}`,
        borderRadius: 12,
        padding: '14px 18px',
        animation: isSuperEmitter ? 'simGlow 1s ease-in-out infinite' : 'none',
      }}>
        {/* Status row */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14, gap: 6 }}>
          <StatusDot color={statusColor} />
          <span style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 12,
            fontWeight: 700,
            color: statusColor,
            letterSpacing: '0.05em',
            animation: isSuperEmitter ? 'badgeFlash 0.8s ease-in-out infinite' : 'none',
          }}>
            {statusText}
          </span>
        </div>

        {/* Emission rate */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#4a6fa5', letterSpacing: '0.1em', marginBottom: 3 }}>
            EMISSION RATE
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: 28, fontWeight: 900, color: '#00ff88', lineHeight: 1 }}>
            <Counter value={emissionRate} decimals={0} duration={800} />
            <span style={{ fontSize: 13, fontWeight: 400, color: '#4a9f6a', marginLeft: 4 }}>kg/hr</span>
          </div>
        </div>

        {/* Confidence bar */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#4a6fa5', letterSpacing: '0.1em' }}>
              AI CONFIDENCE
            </span>
            <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#00d4ff' }}>
              <Counter value={confidence} decimals={1} duration={1000} />%
            </span>
          </div>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${confidence}%`,
              background: 'linear-gradient(90deg, #0088ff, #00ffcc)',
              borderRadius: 2,
              transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
            }} />
          </div>
        </div>

        {/* Wind info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#4a6fa5', letterSpacing: '0.1em' }}>
            WIND
          </span>
          <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#8899bb' }}>
            {windInfo.icon} {windInfo.label} ({windInfo.deg}°)
          </span>
        </div>
      </div>

      {/* ── Top Center Right: Timer & Predictions ── */}
      {isSimulating && (
        <div style={{
          position: 'absolute',
          top: 20,
          right: 280,
          zIndex: 10,
          background: 'rgba(6,10,20,0.88)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,200,0,0.2)',
          borderRadius: 12,
          padding: '14px 18px',
        }}>
          {/* Timer */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#4a6fa5', letterSpacing: '0.1em', marginBottom: 3 }}>
              LEAK DURATION
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: 24, fontWeight: 900, color: '#ffcc00', lineHeight: 1 }}>
              {elapsedTime.toFixed(1)}s
            </div>
          </div>

          {/* Predictions Toggle */}
          <button
            onClick={onTogglePredictions}
            style={{
              width: '100%',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
              fontSize: 11,
              letterSpacing: '0.04em',
              padding: '8px 12px',
              borderRadius: 8,
              border: showPredictions ? '1px solid rgba(0,255,136,0.5)' : '1px solid rgba(128,128,255,0.3)',
              cursor: 'pointer',
              background: showPredictions ? 'rgba(0,255,136,0.12)' : 'rgba(128,128,255,0.08)',
              color: showPredictions ? '#00ff88' : '#8899ff',
              backdropFilter: 'blur(4px)',
              transition: 'all 0.25s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = showPredictions ? 'rgba(0,255,136,0.2)' : 'rgba(128,128,255,0.15)'
              e.currentTarget.style.boxShadow = '0 0 12px rgba(128,128,255,0.2)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = showPredictions ? 'rgba(0,255,136,0.12)' : 'rgba(128,128,255,0.08)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            {showPredictions ? '📊 Predictions ON' : '📊 Predictions'}
          </button>
        </div>
      )}

      {/* ── Top Right Extended: Loss Predictions ── */}
      {isSimulating && showPredictions && (
        <div style={{
          position: 'absolute',
          top: 280,
          right: 20,
          zIndex: 10,
          width: 320,
          background: 'rgba(6,10,20,0.9)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,68,68,0.3)',
          borderRadius: 12,
          padding: '16px 18px',
        }}>
          <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 12, color: '#ff8899', marginBottom: 14, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            📉 Loss Prediction
          </div>

          {/* Methane Loss */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#4a6fa5', letterSpacing: '0.08em' }}>
                CH₄ LOST
              </span>
              <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#00ff88' }}>
                <Counter value={methaneLoss} decimals={2} duration={500} /> kg
              </span>
            </div>
            <div style={{ height: 3, background: 'rgba(0,255,136,0.1)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${Math.min((methaneLoss / 200) * 100, 100)}%`,
                background: 'linear-gradient(90deg, #00ff88, #00cc66)',
                borderRadius: 2,
                transition: 'width 0.5s ease',
              }} />
            </div>
          </div>

          {/* Money Lost */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#4a6fa5', letterSpacing: '0.08em' }}>
                MONEY LOST
              </span>
              <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#ff6677' }}>
                $<Counter value={moneyLost} decimals={2} duration={500} />
              </span>
            </div>
            <div style={{ height: 3, background: 'rgba(255,102,119,0.1)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${Math.min((moneyLost / 10000) * 100, 100)}%`,
                background: 'linear-gradient(90deg, #ff6677, #ff4444)',
                borderRadius: 2,
                transition: 'width 0.5s ease',
              }} />
            </div>
          </div>

          {/* Summary text */}
          <div style={{
            fontFamily: 'monospace',
            fontSize: 9,
            color: '#5a7a9a',
            lineHeight: 1.6,
            paddingTop: 12,
            borderTop: '1px solid rgba(255,102,119,0.15)',
            marginTop: 12,
          }}>
            💡 At current leak rate, every minute costs approximately $<Counter value={moneyLost * (60 / Math.max(elapsedTime, 0.1))} decimals={0} duration={500} />
          </div>
        </div>
      )}

      
      <div style={{
        position: 'absolute',
        bottom: 30,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10,
        display: 'flex',
        gap: 12,
        alignItems: 'center',
      }}>
        {/* Simulate Leak */}
        <button
          id="sim-3d-start-btn"
          onClick={onSimulate}
          disabled={isSimulating}
          style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: '0.06em',
            padding: '12px 28px',
            borderRadius: 40,
            border: 'none',
            cursor: isSimulating ? 'not-allowed' : 'pointer',
            background: isSimulating
              ? 'rgba(0,255,136,0.15)'
              : 'linear-gradient(135deg, #00cc66, #00ff99)',
            color: isSimulating ? '#00ff88' : '#001a0d',
            boxShadow: isSimulating ? 'none' : '0 0 20px rgba(0,255,136,0.4)',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {isSimulating ? (
            <><span style={{ animation: 'simPulse 1s infinite' }}>●</span> Simulating…</>
          ) : (
            <>▶ Simulate Leak</>
          )}
        </button>

        {/* Wind Direction */}
        <button
          id="sim-3d-wind-btn"
          onClick={onWindChange}
          style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 600,
            fontSize: 13,
            letterSpacing: '0.04em',
            padding: '12px 22px',
            borderRadius: 40,
            border: '1px solid rgba(0,212,255,0.35)',
            cursor: 'pointer',
            background: 'rgba(0,212,255,0.08)',
            color: '#00d4ff',
            backdropFilter: 'blur(8px)',
            transition: 'all 0.25s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(0,212,255,0.18)'
            e.currentTarget.style.boxShadow = '0 0 16px rgba(0,212,255,0.3)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(0,212,255,0.08)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          🌬 Wind: {windInfo.label}
        </button>

        {/* Reset */}
        <button
          id="sim-3d-reset-btn"
          onClick={onReset}
          style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 600,
            fontSize: 13,
            padding: '12px 22px',
            borderRadius: 40,
            border: '1px solid rgba(255,68,68,0.3)',
            cursor: 'pointer',
            background: 'rgba(255,68,68,0.07)',
            color: '#ff6677',
            backdropFilter: 'blur(8px)',
            transition: 'all 0.25s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(255,68,68,0.18)'
            e.currentTarget.style.boxShadow = '0 0 14px rgba(255,68,68,0.3)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(255,68,68,0.07)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          ⏹ Reset
        </button>

        {/* Predictions Toggle */}
        {isSimulating && (
          <button
            id="sim-3d-predictions-btn"
            onClick={onTogglePredictions}
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
              fontSize: 13,
              padding: '12px 22px',
              borderRadius: 40,
              border: showPredictions ? '1px solid rgba(0,255,136,0.4)' : '1px solid rgba(255,200,0,0.3)',
              cursor: 'pointer',
              background: showPredictions ? 'rgba(0,255,136,0.12)' : 'rgba(255,200,0,0.08)',
              color: showPredictions ? '#00ff88' : '#ffcc00',
              backdropFilter: 'blur(8px)',
              transition: 'all 0.25s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = showPredictions ? 'rgba(0,255,136,0.2)' : 'rgba(255,200,0,0.15)'
              e.currentTarget.style.boxShadow = '0 0 14px ' + (showPredictions ? 'rgba(0,255,136,0.3)' : 'rgba(255,200,0,0.3)')
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = showPredictions ? 'rgba(0,255,136,0.12)' : 'rgba(255,200,0,0.08)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            📊 {showPredictions ? 'Predictions ON' : 'Predictions'}
          </button>
        )}
      </div>

      {/* ── Bottom Left: Mini Legend ── */}
      <div style={{
        position: 'absolute',
        bottom: 30,
        left: 20,
        zIndex: 10,
        background: 'rgba(6,10,20,0.75)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 10,
        padding: '10px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}>
        {[
          { color: '#00ff88', label: 'CH₄ Plume' },
          { color: '#00d4ff', label: 'AI Bounding Volume' },
          { color: '#ff4444', label: 'Super Emitter Alert' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: color, flexShrink: 0 }} />
            <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#5a7a9a', letterSpacing: '0.06em' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* ── Bottom Right: FPS / Tech Info ── */}
      <div style={{
        position: 'absolute',
        bottom: 30,
        right: 20,
        zIndex: 10,
        background: 'rgba(6,10,20,0.7)',
        backdropFilter: 'blur(6px)',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: 10,
        padding: '8px 14px',
      }}>
        <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#2a3a5a', letterSpacing: '0.1em', lineHeight: 1.8 }}>
          <div>PARTICLES: 1,200</div>
          <div>AI MODEL: GraphSAGE v2</div>
          <div>RENDER: WebGL 2.0</div>
          <div>DRAG to orbit · SCROLL to zoom</div>
        </div>
      </div>
    </>
  )
}
