import { useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import useStore from '../store/useStore.js'
import { detectMethane } from '../api/client.js'
import DetectionMap from '../components/Map/DetectionMap.jsx'

const PRESETS = [
  { label: 'Permian Basin', bbox: '31.0,-104.0,33.0,-102.0' },
  { label: 'Turkmenistan',  bbox: '39.0,57.5,41.0,59.5' },
  { label: 'North Sea',     bbox: '56.0,1.5,60.0,4.0' },
  { label: 'Niger Delta',   bbox: '4.0,5.5,7.0,8.0' },
  { label: 'West Siberia',  bbox: '60.0,71.0,64.0,76.0' },
]

function MetricBox({ label, value, unit, color = 'var(--neon-green)', sub }) {
  return (
    <div className="metric-card" style={{ borderColor: `${color}30` }}>
      <div className="metric-label">{label}</div>
      <div className="metric-value" style={{ color }}>{value}</div>
      {unit && <div className="metric-sub">{unit}</div>}
      {sub && <div className="metric-sub" style={{ marginTop: 2, fontSize: 10 }}>{sub}</div>}
    </div>
  )
}

export default function DetectionPage() {
  const {
    detectionBbox, setDetectionBbox,
    detectionDate, setDetectionDate,
    simulationMode, setSimulationMode,
    detectionResult, setDetectionResult,
    isDetecting, setIsDetecting,
  } = useStore()

  const [showMap, setShowMap] = useState(true)

  const handleDetect = async () => {
    setIsDetecting(true)
    const id = toast.loading('Running AI pipeline…')
    try {
      const result = await detectMethane({
        bbox: detectionBbox,
        date: detectionDate || undefined,
        simulate: simulationMode,
        threshold: 0.45
      })
      setDetectionResult(result)
      toast.dismiss(id)
      if (result.detected) {
        toast.success(`Plume detected! ${result.emission_rate_kg_hr} kg/hr`, { icon: '🛰️' })
        if (result.is_super_emitter) {
          setTimeout(() => toast.error(`⚠️ SUPER-EMITTER: ${result.emission_rate_kg_hr} kg/hr`, { duration: 6000 }), 500)
        }
      } else {
        toast('No plume detected in this region', { icon: '✓' })
      }
    } catch (err) {
      toast.dismiss(id)
      toast.error('Backend unavailable — is the server running?')
    } finally {
      setIsDetecting(false)
    }
  }

  const r = detectionResult

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* ── Left Panel: Controls + Results ── */}
      <div style={{
        width: 340, borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        background: 'rgba(8,13,26,0.7)', backdropFilter: 'blur(8px)'
      }}>
        {/* Controls */}
        <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ marginBottom: 16 }}>
            <div className="section-header">
              <span>📡</span><h3>Detection Controls</h3>
            </div>

            {/* Bbox presets */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
              {PRESETS.map(p => (
                <button
                  key={p.label}
                  className="btn btn-ghost"
                  style={{ padding: '4px 8px', fontSize: 10 }}
                  onClick={() => setDetectionBbox(p.bbox)}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <label style={{ fontSize: 10, color: 'var(--text-secondary)', letterSpacing:'0.08em', display:'block', marginBottom:4 }}>
              BOUNDING BOX (lat1,lon1,lat2,lon2)
            </label>
            <input
              id="bbox-input"
              className="input"
              value={detectionBbox}
              onChange={e => setDetectionBbox(e.target.value)}
              placeholder="31.0,-104.0,33.0,-102.0"
              style={{ marginBottom: 10 }}
            />

            <label style={{ fontSize: 10, color: 'var(--text-secondary)', letterSpacing:'0.08em', display:'block', marginBottom:4 }}>
              DATE (optional)
            </label>
            <input
              id="date-input"
              className="input"
              type="date"
              value={detectionDate}
              onChange={e => setDetectionDate(e.target.value)}
              style={{ marginBottom: 12 }}
            />

            {/* Simulation toggle */}
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14,
              padding: '8px 12px', background: 'rgba(0,170,255,0.06)',
              borderRadius: 6, border: '1px solid rgba(0,170,255,0.15)' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Simulation Mode
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                  Skip model inference for fast demo
                </div>
              </div>
              <div
                onClick={() => setSimulationMode(!simulationMode)}
                style={{
                  width: 40, height: 22, borderRadius: 11, cursor: 'pointer',
                  background: simulationMode ? 'var(--neon-green)' : 'var(--bg-elevated)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  transition: 'all 0.2s',
                  position: 'relative', flexShrink: 0
                }}
              >
                <div style={{
                  position: 'absolute', top: 2, left: simulationMode ? 20 : 2,
                  width: 16, height: 16, borderRadius: '50%',
                  background: simulationMode ? '#000' : '#8899bb',
                  transition: 'left 0.2s'
                }} />
              </div>
            </div>

            <button
              id="run-detection-btn"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={handleDetect}
              disabled={isDetecting}
            >
              {isDetecting ? (
                <><div className="spinner" style={{ width:14,height:14 }} /> Running Pipeline…</>
              ) : (
                <><span>🛰️</span> Run Detection</>
              )}
            </button>
          </div>
        </div>

        {/* Results */}
        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          {!r ? (
            <div style={{ color:'var(--text-muted)', fontSize:12, textAlign:'center', padding:'40px 0', lineHeight:1.6 }}>
              Select a region and click<br />Run Detection to start
            </div>
          ) : (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:0.3 }}>
              {/* Status */}
              <div style={{
                display:'flex', alignItems:'center', gap:8, marginBottom:14,
                padding:'10px 12px',
                background: r.detected ? 'rgba(0,255,136,0.08)' : 'rgba(68,85,119,0.1)',
                borderRadius:8, border:`1px solid ${r.detected ? 'rgba(0,255,136,0.25)' : 'rgba(68,85,119,0.2)'}`
              }}>
                <span style={{ fontSize:18 }}>{r.detected ? '🔴' : '✅'}</span>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color: r.detected ? 'var(--neon-green)' : 'var(--text-secondary)' }}>
                    {r.detected ? 'PLUME DETECTED' : 'NO PLUME DETECTED'}
                  </div>
                  {r.severity && r.detected && (
                    <span className={`badge badge-${r.severity.toLowerCase()}`}>{r.severity}</span>
                  )}
                </div>
              </div>

              {/* Metrics grid */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 }}>
                <MetricBox label="Emission Rate" value={r.emission_rate_kg_hr?.toFixed(1)} unit="kg/hr"
                  color={r.is_super_emitter ? 'var(--neon-red)' : 'var(--neon-green)'}
                  sub={r.is_super_emitter ? '⚠️ Super-Emitter' : ''} />
                <MetricBox label="Uncertainty" value={`±${r.emission_uncertainty_kg_hr?.toFixed(1)}`} unit="kg/hr"
                  color="var(--neon-blue)" />
                <MetricBox label="Detection Confidence" value={`${(r.detection_confidence*100)?.toFixed(1)}%`}
                  color="var(--neon-amber)" />
                <MetricBox label="Quant. Confidence" value={`${(r.quantification_confidence*100)?.toFixed(1)}%`}
                  color="var(--neon-purple)" />
              </div>

              {/* Attribution */}
              {r.attribution?.facility_name && (
                <div style={{ background:'rgba(170,68,255,0.08)', border:'1px solid rgba(170,68,255,0.2)',
                  borderRadius:8, padding:'10px 12px', marginBottom:12 }}>
                  <div style={{ fontSize:10, letterSpacing:'0.1em', color:'var(--neon-purple)', marginBottom:6 }}>
                    GNN SOURCE ATTRIBUTION
                  </div>
                  <div style={{ fontSize:12, fontWeight:600, color:'var(--text-primary)', marginBottom:4 }}>
                    {r.attribution.facility_name}
                  </div>
                  <div style={{ fontSize:10, color:'var(--text-secondary)', marginBottom:4 }}>
                    {r.attribution.facility_type?.replace('_',' ')} · {r.attribution.distance_km?.toFixed(1)} km
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ fontSize:10, color:'var(--text-secondary)' }}>Attribution confidence</span>
                    <span style={{ fontFamily:'var(--font-mono)', fontSize:11, fontWeight:700, color:'var(--neon-purple)' }}>
                      {(r.attribution.attribution_confidence*100)?.toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}

              {/* Wind */}
              {r.wind && (
                <div style={{ background:'rgba(0,170,255,0.06)', border:'1px solid rgba(0,170,255,0.15)',
                  borderRadius:8, padding:'10px 12px', marginBottom:12 }}>
                  <div style={{ fontSize:10, letterSpacing:'0.1em', color:'var(--neon-blue)', marginBottom:6 }}>
                    WIND CONDITIONS
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:11 }}>
                    <span style={{ color:'var(--text-secondary)' }}>Speed</span>
                    <span style={{ fontFamily:'var(--font-mono)', color:'var(--neon-blue)' }}>
                      {r.wind.speed_ms} m/s
                    </span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:11 }}>
                    <span style={{ color:'var(--text-secondary)' }}>Direction</span>
                    <span style={{ fontFamily:'var(--font-mono)', color:'var(--neon-blue)' }}>
                      {r.wind.direction_deg}°
                    </span>
                  </div>
                </div>
              )}

              {/* Timing */}
              {r.pipeline_timing_ms && (
                <div style={{ fontSize:10, color:'var(--text-muted)' }}>
                  Pipeline: {r.pipeline_timing_ms.total}ms total
                  (seg: {r.pipeline_timing_ms.segmentation}ms,
                   quant: {r.pipeline_timing_ms.quantification}ms,
                   attr: {r.pipeline_timing_ms.attribution}ms)
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Right: Detection Map ── */}
      <div style={{ flex: 1, position:'relative' }}>
        <DetectionMap detectionBbox={detectionBbox} detectionResult={detectionResult} />

        {/* overlay instructions when no result */}
        {!detectionResult && (
          <div style={{
            position:'absolute', bottom:80, left:'50%', transform:'translateX(-50%)',
            background:'rgba(13,21,37,0.85)', backdropFilter:'blur(8px)',
            border:'1px solid var(--border)', borderRadius:10,
            padding:'12px 20px', fontSize:12, color:'var(--text-secondary)',
            textAlign:'center', pointerEvents:'none'
          }}>
            Select a preset region → Run Detection → See results on map
          </div>
        )}
      </div>
    </div>
  )
}
