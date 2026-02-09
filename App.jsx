import { useState, useEffect } from 'react'
import Chat from './components/Chat'
import Upload from './components/Upload'
import Progress from './components/Progress'
import { healthCheck } from './api'

export default function App() {
  const [tab, setTab] = useState('chat')
  const [stats, setStats] = useState(null)
  const [studentName, setStudentName] = useState('default')

  useEffect(() => {
    healthCheck()
      .then((data) => setStats(data.stats))
      .catch(() => {})
  }, [tab])

  const materialCount = stats?.total_files || 0

  return (
    <>
      {/* Header */}
      <div className="header">
        <div className="header-logo">
          <div className="header-icon">🔬</div>
          <div>
            <div className="header-title">SciOly Tutor</div>
            <div className="header-subtitle">
              {materialCount} material{materialCount !== 1 ? 's' : ''} loaded
            </div>
          </div>
        </div>
        <div className="tabs">
          {[
            { id: 'chat', label: '💬 Chat' },
            { id: 'materials', label: '📚 Materials' },
            { id: 'progress', label: '📊 Progress' },
          ].map((t) => (
            <button
              key={t.id}
              className={`tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {tab === 'chat' && (
        <Chat studentName={studentName} materialCount={materialCount} />
      )}
      {tab === 'materials' && (
        <Upload onUploadComplete={() => healthCheck().then((d) => setStats(d.stats))} />
      )}
      {tab === 'progress' && <Progress studentName={studentName} />}
    </>
  )
}
