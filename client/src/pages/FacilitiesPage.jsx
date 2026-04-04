import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import useStore from '../store/useStore.js'
import { getTimeseries } from '../api/client.js'
import { EmissionAreaChart } from '../components/Charts/EmissionChart.jsx'

function RiskBar({ value }) {
  const pct = (value * 100).toFixed(0)
  const color = value > 0.85 ? '#ff4444' : value > 0.7 ? '#ff8c00' : '#ffb300'
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
      <div style={{ flex:1, height:4, background:'var(--bg-elevated)', borderRadius:2, overflow:'hidden' }}>
        <div style={{ width:`${pct}%`, height:'100%', background:color, borderRadius:2,
          boxShadow:`0 0 4px ${color}80` }} />
      </div>
      <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color, width:30, textAlign:'right' }}>
        {pct}%
      </span>
    </div>
  )
}

export default function FacilitiesPage() {
  const facilities = useStore(s => s.facilities)
  const topPolluters = useStore(s => s.topPolluters)
  const selectedFacility = useStore(s => s.selectedFacility)
  const setSelectedFacility = useStore(s => s.setSelectedFacility)
  const timeseriesData = useStore(s => s.timeseriesData)
  const setTimeseriesData = useStore(s => s.setTimeseriesData)
  const [sortBy, setSortBy] = useState('risk_score')
  const [search, setSearch] = useState('')
  const [loadingTs, setLoadingTs] = useState(false)

  const sorted = [...facilities]
    .filter(f => !search || f.name.toLowerCase().includes(search.toLowerCase()) ||
      (f.country || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0))

  const handleSelect = async (fac) => {
    setSelectedFacility(fac)
    setLoadingTs(true)
    try {
      const ts = await getTimeseries(fac.id, 30)
      setTimeseriesData(ts)
    } catch { } finally {
      setLoadingTs(false)
    }
  }

  return (
    <div style={{ display:'flex', height:'100%', overflow:'hidden' }}>
      {/* ── Facility List ── */}
      <div style={{
        width:380, borderRight:'1px solid var(--border)',
        display:'flex', flexDirection:'column', overflow:'hidden',
        background:'rgba(8,13,26,0.7)', backdropFilter:'blur(8px)'
      }}>
        {/* Header */}
        <div style={{ padding:'16px 16px 12px', borderBottom:'1px solid var(--border)' }}>
          <div className="section-header" style={{ marginBottom:10 }}>
            <span>🏭</span><h3>Facility Database</h3>
            <span style={{ marginLeft:'auto', fontFamily:'var(--font-mono)', fontSize:11,
              color:'var(--text-secondary)' }}>{facilities.length} total</span>
          </div>
          <input
            className="input"
            placeholder="Search facilities or countries…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ marginBottom:8 }}
          />
          <div style={{ display:'flex', gap:4 }}>
            {[
              { key:'risk_score', label:'Risk' },
              { key:'historical_emission_rate', label:'Emission' },
            ].map(s => (
              <button key={s.key}
                className={`btn ${sortBy === s.key ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding:'4px 10px', fontSize:10 }}
                onClick={() => setSortBy(s.key)}
              >{s.label}</button>
            ))}
          </div>
        </div>

        {/* List */}
        <div style={{ flex:1, overflow:'auto', padding:'8px 8px' }}>
          {sorted.map((fac, i) => (
            <motion.div
              key={fac.id}
              initial={{ opacity:0, x:-10 }}
              animate={{ opacity:1, x:0 }}
              transition={{ delay:i*0.02 }}
              onClick={() => handleSelect(fac)}
              style={{
                padding:'10px 12px', borderRadius:8, marginBottom:6, cursor:'pointer',
                background: selectedFacility?.id === fac.id
                  ? 'rgba(0,255,136,0.08)' : 'rgba(13,21,37,0.5)',
                border: `1px solid ${selectedFacility?.id === fac.id
                  ? 'rgba(0,255,136,0.3)' : 'rgba(68,85,119,0.2)'}`,
                transition:'all 0.15s'
              }}
            >
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:11, fontWeight:600, color:'var(--text-primary)',
                    whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                    {fac.name}
                  </div>
                  <div style={{ fontSize:10, color:'var(--text-secondary)' }}>
                    {fac.type?.replace('_',' ')} · {fac.country}
                  </div>
                </div>
                <div style={{ textAlign:'right', marginLeft:8, flexShrink:0 }}>
                  <div style={{ fontFamily:'var(--font-mono)', fontSize:12, fontWeight:700,
                    color: fac.historical_emission_rate > 800 ? 'var(--neon-red)' : 'var(--neon-amber)' }}>
                    {fac.historical_emission_rate}
                  </div>
                  <div style={{ fontSize:9, color:'var(--text-muted)' }}>kg/hr</div>
                </div>
              </div>
              <RiskBar value={fac.risk_score || 0.5} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Detail Panel ── */}
      <div style={{ flex:1, overflow:'auto', padding:24, background:'var(--bg-void)' }}>
        {!selectedFacility ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
            height:'100%', color:'var(--text-muted)', textAlign:'center' }}>
            <div style={{ fontSize:48, marginBottom:16 }}>🏭</div>
            <div style={{ fontSize:16, fontWeight:600, color:'var(--text-secondary)', marginBottom:8 }}>
              Select a Facility
            </div>
            <div style={{ fontSize:12 }}>Click any facility to view its emission history and risk profile</div>
          </div>
        ) : (
          <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}>
            {/* Facility header */}
            <div style={{ marginBottom:24 }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:16, marginBottom:16 }}>
                <div style={{ flex:1 }}>
                  <h1 style={{ fontSize:20, fontWeight:800, color:'var(--text-primary)', marginBottom:4 }}>
                    {selectedFacility.name}
                  </h1>
                  <div style={{ fontSize:12, color:'var(--text-secondary)' }}>
                    {selectedFacility.type?.replace(/_/g,' ')} · {selectedFacility.country} · {selectedFacility.operator}
                  </div>
                  <div style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-muted)', marginTop:4 }}>
                    {selectedFacility.lat?.toFixed(4)}°N, {selectedFacility.lon?.toFixed(4)}°E
                  </div>
                </div>
                <div>
                  <div style={{ fontFamily:'var(--font-mono)', fontSize:28, fontWeight:800,
                    color: selectedFacility.risk_score > 0.8 ? 'var(--neon-red)' : 'var(--neon-amber)' }}>
                    {((selectedFacility.risk_score || 0.5) * 100).toFixed(0)}%
                  </div>
                  <div style={{ fontSize:10, color:'var(--text-secondary)', textAlign:'right' }}>RISK SCORE</div>
                </div>
              </div>

              {/* Metrics */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
                {[
                  { label:'Emission Rate', value:`${selectedFacility.historical_emission_rate}`, unit:'kg/hr',
                    color: selectedFacility.historical_emission_rate > 800 ? 'var(--neon-red)' : 'var(--neon-amber)' },
                  { label:'Risk Score', value:`${((selectedFacility.risk_score||0.5)*100).toFixed(0)}%`, unit:'',
                    color:'var(--neon-amber)' },
                  { label:'Is Super-Emitter', value: selectedFacility.historical_emission_rate > 100 ? 'YES' : 'NO',
                    unit:'', color: selectedFacility.historical_emission_rate > 100 ? 'var(--neon-red)' : 'var(--neon-green)' },
                ].map(m => (
                  <div key={m.label} className="metric-card">
                    <div className="metric-label">{m.label}</div>
                    <div className="metric-value" style={{ color:m.color, fontSize:18 }}>{m.value}</div>
                    {m.unit && <div className="metric-sub">{m.unit}</div>}
                  </div>
                ))}
              </div>
            </div>

            <div className="divider" />

            {/* Timeseries chart */}
            <div style={{ marginBottom:20 }}>
              <div className="section-header">
                <span>📈</span><h3>30-Day Emission History</h3>
              </div>
              {loadingTs ? (
                <div style={{ display:'flex', justifyContent:'center', padding:'40px 0' }}>
                  <div className="spinner" />
                </div>
              ) : timeseriesData ? (
                <>
                  <EmissionAreaChart data={timeseriesData.series || []} height={200} />
                  <div style={{ display:'flex', gap:20, marginTop:12 }}>
                    <div><span style={{ fontSize:10,color:'var(--text-secondary)' }}>30-day avg:</span>
                      <span style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--neon-green)', marginLeft:6 }}>
                        {timeseriesData.average_emission_kg_hr} kg/hr
                      </span></div>
                    <div><span style={{ fontSize:10,color:'var(--text-secondary)' }}>Peak:</span>
                      <span style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--neon-red)', marginLeft:6 }}>
                        {timeseriesData.peak_emission_kg_hr} kg/hr
                      </span></div>
                    <div><span style={{ fontSize:10,color:'var(--text-secondary)' }}>Total:</span>
                      <span style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--neon-amber)', marginLeft:6 }}>
                        {(timeseriesData.total_emission_kg/1000000).toFixed(2)}Mt
                      </span></div>
                  </div>
                </>
              ) : (
                <div style={{ color:'var(--text-muted)', fontSize:12 }}>Select a facility to load timeseries</div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
