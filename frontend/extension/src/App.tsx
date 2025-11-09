
import React, { useState } from 'react'
import './index.css'
import type { AgentId, Status } from './utils/constants'
import AgentCard from './components/AgentCard'
import Loader from './components/Loader'
import ErrorBanner from './components/ErrorBanner'
import { analyzeAgent, analyzeAgentsInParallel } from './utils/api'
import { AGENT_META } from './utils/constants'

function App() {
  const [text, setText] = useState<string>(
    'The Earth is flat and satellites are a hoax used by governments to control people.'
  )
  const [statuses, setStatuses] = useState<Record<string, { type: Status; message: string }>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const showStatus = (agentId: string, message: string, type: Status) => {
    setStatuses(prev => ({ ...prev, [agentId]: { message, type } }))
  }

  const handleAnalyze = async (agentId: AgentId) => {
    setError(null)
    const trimmed = text.trim()
    if (!trimmed) {
      showStatus(agentId, 'Please enter some text to analyze', 'error')
      return
    }

    showStatus(agentId, `Sending request to ${agentId}...`, 'success')
    try {
      setLoading(true)
  const result = await analyzeAgent(agentId, { text: trimmed })
      console.log(agentId, 'result', result)
      showStatus(agentId, `✅ ${agentId} analysis completed!`, 'success')
    } catch (err: any) {
      console.error(err)
      showStatus(agentId, `❌ ${agentId} analysis failed: ${err?.message || err}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleAnalyzeAll = async () => {
    setError(null)
    const trimmed = text.trim()
    if (!trimmed) {
      setError('Please enter some text to analyze')
      return
    }
    setLoading(true)
    showStatus('test', 'Starting multi-agent analysis...', 'success')
    try {
      const results = await analyzeAgentsInParallel(trimmed)
      results.forEach(r => {
        if (r.error) showStatus(r.agentId, `❌ ${r.agentId} failed: ${r.error}`, 'error')
        else showStatus(r.agentId, `✅ ${r.agentId} completed successfully`, 'success')
        console.log(r.agentId, 'result:', r.result || r.error)
      })
      showStatus('test', '✅ Multi-agent analysis completed! Check console for details.', 'success')
    } catch (err: any) {
      setError(`Multi-agent analysis failed: ${err?.message || err}`)
      showStatus('test', `❌ Multi-agent analysis failed: ${err?.message || err}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="popup-root">
      <div className="header">
        <h1>🧠 AI Multi-Agent Dashboard</h1>
        <p>Analyze your text and images quickly</p>
      </div>

      {error && <ErrorBanner message={error} />}

      <div className="info-box">
        <h3>How It Works</h3>
        <p>Our AI system uses 4 specialized agents to analyze content:</p>
        <ul>
          {Object.values(AGENT_META).map(m => (
            <li key={m.id}>
              <strong>{m.title}</strong> — {m.brief}
            </li>
          ))}
        </ul>
      </div>

      {Object.values(AGENT_META).map(meta => (
        <AgentCard
          key={meta.id}
          name={meta.title}
          status={statuses[meta.id]?.type || 'idle'}
        />
      ))}

      <div className="test-section">
        <h3>Quick Test</h3>
        <textarea id="testText" value={text} onChange={e => setText(e.target.value)} />
        <button className="agent-button analyze-all" onClick={handleAnalyzeAll} disabled={loading}>
          {loading ? 'Analyzing...' : 'Analyze All Agents'}
        </button>
        <div className={`status ${statuses['test']?.type || ''}`}>{statuses['test']?.message}</div>
      </div>

      {loading && <Loader />}
    </div>
  )
}

export default App
