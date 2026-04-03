import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import useStore from '../store/useStore.js'
import { getAlerts } from '../api/client.js'

const SEV_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2 }
const SEV_COLOR = {
  CRITICAL: '#ff4444', HIGH: '#ff8c00', MEDIUM: '#ffb300'
}

function AlertRow({ alert, index }) {
  const [expanded, setExpanded] = useState(false)
  const time = alert.timestamp
    ? formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })
    : 'just now'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      style={{
        background: 'rgba(13,21,37,0.7)',
        border: `1px solid ${SEV_COLOR[alert.severity] || '#445577'}25`,
        borderLeft: `3px solid ${SEV_COLOR[alert.severity] || '#445577'}`,
        borderRadius: 8, marginBottom: 8, overflow: 'hidden',
        cursor: 'pointer'
      }}
      onClick={() => setExpanded(!expanded)}
    >
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px' }}>
        {/* Severity indicator */}
        <div style={{
          width: 36, height: 36, borderRadius: 8, flexShrink: 0,
          background: `${SEV_COLOR[alert.severity] || '#445577'}15`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16
        }}>
          {alert.severity === 'CRITICAL' ? '🔴' : alert.severity === 'HIGH' ? '🟠' : '🟡'}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
            <span className={`badge badge-${alert.severity?.toLowerCase()}`}>{alert.severity}</span>
            {!alert.acknowledged && (
              <span style={{ fontSize:9, fontWeight:700, color:'var(--neon-blue)',
                background:'rgba(0,170,255,0.1)', padding:'1px 5px', borderRadius:3 }}>NEW</span>
            )}
          </div>
          <div style={{ fontSize:12, fontWeight:600, color:'var(--text-primary)',
            whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            {alert.facility_name}
          </div>
          <div style={{ fontSize:10, color:'var(--text-secondary)' }}>
            {alert.country} · {time}
          </div>
        </div>

        <div style={{ textAlign:'right', flexShrink:0 }}>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:16, fontWeight:700,
            color: SEV_COLOR[alert.severity] || '#ffb300' }}>
            {Number(alert.emission_rate_kg_hr || 0).toFixed(0)}
          </div>
          <div style={{ fontSize:9, color:'var(--text-muted)' }}>kg/hr</div>
        </div>

        <div style={{ color:'var(--text-muted)', fontSize:12, flexShrink:0 }}>
          {expanded ? '▲' : '▼'}
        </div>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height:0, opacity:0 }}
            animate={{ height:'auto', opacity:1 }}
            exit={{ height:0, opacity:0 }}
            transition={{ duration:0.2 }}
            style={{ overflow:'hidden' }}
          >
            <div style={{ padding:'0 14px 12px', borderTop:'1px solid rgba(68,85,119,0.2)' }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, paddingTop:12 }}>
                {[
                  { label:'Facility ID', value: alert.facility_id },
                  { label:'Type', value: alert.facility_type?.replace('_',' ') || '—' },
                  { label:'Operator', value: alert.operator || '—' },
                  { label:'Coordinates', value: alert.lat && alert.lon ? `${alert.lat?.toFixed(2)}, ${alert.lon?.toFixed(2)}` : '—' },
                  { label:'Timestamp', value: alert.timestamp ? new Date(alert.timestamp).toLocaleString() : '—' },
                  { label:'Status', value: alert.acknowledged ? 'Acknowledged' : 'Unacknowledged' },
                ].map(f => (
                  <div key={f.label}>
                    <div style={{ fontSize:9, color:'var(--text-muted)', letterSpacing:'0.1em', marginBottom:2 }}>
                      {f.label.toUpperCase()}
                    </div>
                    <div style={{ fontSize:11, color:'var(--text-primary)', fontFamily:'var(--font-mono)' }}>
                      {f.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function AlertsPage() {
  const alerts = useStore(s => s.alerts)
  const liveAlerts = useStore(s => s.liveAlerts)
  const setAlerts = useStore(s => s.setAlerts)
  const alertFilter = useStore(s => s.alertFilter)
  const setAlertFilter = useStore(s => s.setAlertFilter)
  const [loading, setLoading] = useState(false)

  const refresh = async () => {
    setLoading(true)
    try {
      const d = await getAlerts({ severity: alertFilter, limit: 50 })
      setAlerts(d.alerts)
    } catch { } finally { setLoading(false) }
  }

  // Merge live + historical
  const allAlerts = [...liveAlerts, ...alerts]
    .filter((a, i, arr) => arr.findIndex(x => x.id === a.id) === i)
    .filter(a => !alertFilter || a.severity === alertFilter)
    .sort((a, b) => (SEV_ORDER[a.severity] || 9) - (SEV_ORDER[b.severity] || 9))

  const counts = {
    CRITICAL: allAlerts.filter(a => a.severity === 'CRITICAL').length,
    HIGH: allAlerts.filter(a => a.severity === 'HIGH').length,
    MEDIUM: allAlerts.filter(a => a.severity === 'MEDIUM').length,
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden', padding:24 }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:20, flexShrink:0 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'var(--text-primary)' }}>
            🚨 Super-Emitter Alerts
          </h1>
          <p style={{ fontSize:12, color:'var(--text-secondary)', marginTop:2 }}>
            Facilities emitting above 100 kg/hr threshold
          </p>
        </div>

        {/* Summary badges */}
        <div style={{ display:'flex', gap:8, marginLeft:'auto' }}>
          {Object.entries(counts).map(([sev, n]) => (
            <div key={sev} style={{
              background:`${SEV_COLOR[sev]}15`, border:`1px solid ${SEV_COLOR[sev]}30`,
              borderRadius:8, padding:'8px 14px', textAlign:'center'
            }}>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:20, fontWeight:800, color:SEV_COLOR[sev] }}>{n}</div>
              <div style={{ fontSize:9, color:'var(--text-secondary)', fontWeight:600 }}>{sev}</div>
            </div>
          ))}
        </div>

        <button className="btn btn-ghost" onClick={refresh} disabled={loading} style={{ flexShrink:0 }}>
          {loading ? <div className="spinner" style={{ width:14,height:14 }} /> : '↻'} Refresh
        </button>
      </div>

      {/* Filter bar */}
      <div style={{ display:'flex', gap:6, marginBottom:16, flexShrink:0 }}>
        {[null, 'CRITICAL', 'HIGH', 'MEDIUM'].map(f => (
          <button
            key={f || 'ALL'}
            className={`btn ${alertFilter === f ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding:'5px 12px', fontSize:10 }}
            onClick={() => setAlertFilter(f)}
          >
            {f || 'ALL'} {f ? `(${allAlerts.filter(a => a.severity === f).length})` : `(${allAlerts.length})`}
          </button>
        ))}
      </div>

      {/* Alert list */}
      <div style={{ flex:1, overflow:'auto' }}>
        {allAlerts.length === 0 ? (
          <div style={{ textAlign:'center', color:'var(--text-muted)', padding:'60px 0', fontSize:14 }}>
            No alerts for selected severity filter
          </div>
        ) : (
          allAlerts.map((alert, i) => (
            <AlertRow key={alert.id || i} alert={alert} index={i} />
          ))
        )}
      </div>
    </div>
  )
}
