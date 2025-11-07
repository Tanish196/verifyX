import { AGENT_URLS } from './constants'

type AgentResult = { agentId: string; result?: any; error?: string }

export async function analyzeAgent(agentId: string, payload: any) {
  const url = AGENT_URLS[agentId]
  if (!url) throw new Error('Unknown agent')

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  return res.json()
}

export async function analyzeAgentsInParallel(text: string): Promise<AgentResult[]> {
  const agentIds = Object.keys(AGENT_URLS)
  const promises = agentIds.map(async agentId => {
    try {
      const result = await analyzeAgent(agentId, { text })
      return { agentId, result }
    } catch (err: any) {
      return { agentId, error: err?.message || String(err) }
    }
  })

  return Promise.all(promises)
}
