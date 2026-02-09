import { useState, useRef, useEffect } from 'react'
import { sendMessage } from '../api'

const QUICK_PROMPTS = [
  'Quiz me on the key concepts!',
  'Summarize the main topics',
  'What are the hardest parts to remember?',
  'Explain this like I\'m a beginner',
]

export default function Chat({ studentName, materialCount }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async () => {
    if (!input.trim() || loading) return
    const text = input.trim()
    setInput('')

    const updated = [...messages, { role: 'user', content: text }]
    setMessages(updated)
    setLoading(true)

    try {
      const history = updated.slice(0, -1).map(({ role, content }) => ({ role, content }))
      const data = await sendMessage(text, studentName, history)
      setMessages([...updated, { role: 'assistant', content: data.response, intent: data.intent }])
    } catch (err) {
      setMessages([
        ...updated,
        { role: 'assistant', content: `⚠️ ${err.message}. Is the backend running on port 8000?` },
      ])
    }
    setLoading(false)
  }

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🧪</div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>
                Ready to study!
              </div>
              <div style={{ fontSize: 13, maxWidth: 340, lineHeight: 1.5 }}>
                {materialCount > 0
                  ? 'Your materials are loaded. Ask me anything!'
                  : 'Upload study materials in the 📚 Materials tab first.'}
              </div>
            </div>
            <div className="quick-prompts">
              {QUICK_PROMPTS.map((p) => (
                <button key={p} className="quick-prompt" onClick={() => setInput(p)}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`msg ${msg.role}`}>
            {msg.role === 'assistant' && <div className="msg-avatar">🔬</div>}
            <div className="msg-bubble">{msg.content}</div>
          </div>
        ))}

        {loading && (
          <div className="msg assistant">
            <div className="msg-avatar">🔬</div>
            <div className="msg-bubble">
              <div className="loading-dots">
                <div className="loading-dot" />
                <div className="loading-dot" />
                <div className="loading-dot" />
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="chat-input-area">
        <div className="chat-input-wrapper">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
            }}
            placeholder="Ask about your study materials..."
            rows={1}
          />
          <button
            className={`send-btn ${input.trim() ? 'active' : 'inactive'}`}
            onClick={send}
            disabled={loading || !input.trim()}
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  )
}
