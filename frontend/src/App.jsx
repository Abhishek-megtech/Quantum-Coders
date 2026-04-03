import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Dashboard from './components/Dashboard/Dashboard.jsx'
import useStore from './store/useStore.js'
import { getFacilities, getTopPolluters, getAlerts, getHeatmap, createAlertsWebSocket } from './api/client.js'

export default function App() {
  const { setFacilities, setTopPolluters, setAlerts, setHeatmapData, pushLiveAlert } = useStore()

  useEffect(() => {
    // Load initial data
    getFacilities().then(d => setFacilities(d.facilities)).catch(console.warn)
    getTopPolluters(15).then(d => setTopPolluters(d.top_polluters)).catch(console.warn)
    getAlerts().then(d => setAlerts(d.alerts)).catch(console.warn)
    getHeatmap().then(d => setHeatmapData(d)).catch(console.warn)

    // WebSocket for live alerts
    let ws
    const connect = () => {
      try {
        ws = createAlertsWebSocket()
        ws.onmessage = (e) => {
          const data = JSON.parse(e.data)
          if (data.type === 'alert' || data.type === 'update') {
            pushLiveAlert(data)
          }
        }
        ws.onerror = () => setTimeout(connect, 5000)
        ws.onclose = () => setTimeout(connect, 5000)
      } catch (err) {
        console.warn('WebSocket unavailable (running without backend?)')
      }
    }
    connect()

    return () => ws?.close()
  }, [])

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(13, 21, 37, 0.95)',
            color: '#e8f0fe',
            border: '1px solid rgba(0, 170, 255, 0.3)',
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px',
          },
          duration: 4000,
        }}
      />
      <Routes>
        <Route path="/*" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  )
}
