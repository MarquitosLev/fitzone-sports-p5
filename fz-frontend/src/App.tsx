import { useEffect, useState } from 'react'
import './App.css'

interface PingResponse {
  status: string
  app: string
  timestamp: string
}

export default function App() {
  const [pingData, setPingData] = useState<PingResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api'

  useEffect(() => {
    fetch(`${apiBaseUrl}/ping`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Error HTTP: ${res.status}`)
        }
        return res.json()
      })
      .then((data: PingResponse) => {
        setPingData(data)
        setLoading(false)
      })
      .catch((err: Error) => {
        setError(err.message)
        setLoading(false)
      })
  }, [apiBaseUrl])

  return (
    <div className="container">
      <h1>FitZone Sports</h1>
      <p className="subtitle">Frontend React + Vite desplegado exitosamente</p>

      <div className="card">
        <h2>Estado de conexión con Backend:</h2>
        {loading && <p>Comprobando conexión con la API...</p>}
        {error && <p className="status-error">No se pudo conectar con la API ({error}). Verificá VITE_API_BASE_URL.</p>}
        {pingData && (
          <div className="status-success">
            <p><strong>Estado Backend:</strong> {pingData.status}</p>
            <p><strong>Aplicación:</strong> {pingData.app}</p>
            <p><strong>Hora servidor:</strong> {new Date(pingData.timestamp).toLocaleString()}</p>
          </div>
        )}
      </div>
    </div>
  )
}
