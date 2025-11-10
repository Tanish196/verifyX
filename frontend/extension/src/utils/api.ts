import { API_BASE_URL, ENDPOINTS, RETRY_CONFIG } from './constants'
import type { AgentId } from './constants'

export interface LinguisticRequest {
  text: string
}

export interface ManipulationSignal {
  label: string
  confidence: number
  rationale?: string
}

export interface LinguisticResponse {
  agent_id: string
  model: string
  dominant_tone: string
  sentiment: string
  manipulation_score: number
  signals: ManipulationSignal[]
  raw_probs: Record<string, any>
  latency_ms: number
}

export interface EvidenceRequest {
  text: string
}

export interface EvidenceResponse {
  claim: string
  fact_check_results: Array<{
    claim: string
    claimant?: string
    rating?: string
    url?: string
    publisher?: string
  }>
  credibility_score: number
}

export interface VisualRequest {
  text: string
  images: string[]
}

export interface ImageMatch {
  index: number
  similarity: number
  notes?: string
}

export interface VisualResponse {
  agent_id: string
  model: string
  average_similarity: number
  matches: ImageMatch[]
  deepfake_flag: boolean
  fallback: boolean
  latency_ms: number
}

export interface SynthesisRequest {
  text: string
  linguistic?: any
  evidence?: any
  visual?: any
}

export interface SynthesisResponse {
  agent_id: string
  verdict: string
  confidence: number
  rationale: string
  supporting: Record<string, any>
  latency_ms: number
}

class HTTPError extends Error {
  status: number
  body?: string
  constructor(status: number, statusText: string, body?: string) {
    super(`HTTP ${status}: ${statusText}`)
    this.status = status
    this.body = body
    this.name = 'HTTPError'
  }
}

/**
 * fetchWithRetry
 * - attempts: number of attempts (default from RETRY_CONFIG)
 * - timeoutMs: optional per-request timeout in milliseconds
 */
async function fetchWithRetry<T>(
  url: string,
  options: RequestInit,
  attempts: number = RETRY_CONFIG.MAX_ATTEMPTS,
  timeoutMs?: number
): Promise<T> {
  const controller = new AbortController()

  // Wire external signal to abort our internal controller so that the
  // timeout and external cancelation cooperate. If the caller passes an
  // AbortSignal we listen for its 'abort' event and abort our controller.
  let externalAbortHandler: (() => void) | undefined
  const externalSignal = (options && (options as any).signal) as AbortSignal | undefined
  if (externalSignal) {
    externalAbortHandler = () => controller.abort()
    externalSignal.addEventListener('abort', externalAbortHandler)
  }

  let timeoutId: ReturnType<typeof setTimeout> | undefined
  if (timeoutMs && timeoutMs > 0) {
    timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  }

  try {
  // Always pass our controller.signal to fetch. It will be aborted either
  // by the timeout we set above or by the external signal listener above.
  const response = await fetch(url, { ...options, signal: controller.signal })

    if (!response.ok) {
      const bodyText = await response.text().catch(() => undefined)
      throw new HTTPError(response.status, response.statusText, bodyText)
    }

    // parse JSON; let parse errors bubble up
    const json = await response.json()
    return json as T
  } catch (error: any) {
    // If aborted due to timeout, provide a clearer message
    if (error.name === 'AbortError') {
      if (attempts > 1) {
        await new Promise(resolve => setTimeout(resolve, RETRY_CONFIG.DELAY_MS))
        return fetchWithRetry<T>(url, options, attempts - 1, timeoutMs)
      }
      throw new Error('Request aborted (timeout)')
    }

    if (attempts > 1) {
      await new Promise(resolve => setTimeout(resolve, RETRY_CONFIG.DELAY_MS))
      return fetchWithRetry<T>(url, options, attempts - 1, timeoutMs)
    }
    throw error
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
    // Clean up the external listener so we don't leak function objects.
    if (externalSignal && externalAbortHandler) {
      externalSignal.removeEventListener('abort', externalAbortHandler)
    }
  }
}

export async function analyzeLinguistic(text: string): Promise<LinguisticResponse> {
  return fetchWithRetry<LinguisticResponse>(
    `${API_BASE_URL}${ENDPOINTS.LINGUISTIC}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    }
  )
}

export async function checkEvidence(claim: string): Promise<EvidenceResponse> {
  return fetchWithRetry<EvidenceResponse>(
    `${API_BASE_URL}${ENDPOINTS.EVIDENCE}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: claim }),
    }
  )
}

export async function analyzeVisual(text: string, imageUrls: string[]): Promise<VisualResponse> {
  return fetchWithRetry<VisualResponse>(
    `${API_BASE_URL}${ENDPOINTS.VISUAL}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, images: imageUrls }),
    }
  )
}

export async function synthesizeResults(
  text: string,
  linguistic?: any,
  evidence?: any,
  visual?: any
): Promise<SynthesisResponse> {
  return fetchWithRetry<SynthesisResponse>(
    `${API_BASE_URL}${ENDPOINTS.SYNTHESIZE}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        linguistic,
        evidence,
        visual,
      }),
    }
  )
}

export async function verifyContent(text: string, imageUrls: string[] = []) {
  try {
    // Run linguistic, evidence and visual checks in parallel
    const [linguisticResult, evidenceResult, visualResult] = await Promise.all([
      analyzeLinguistic(text),
      checkEvidence(text),
      analyzeVisual(text, imageUrls),
    ])

    // Synthesize results by sending the raw agent outputs and the original text
    const synthesis = await synthesizeResults(text, linguisticResult, evidenceResult, visualResult)

    return {
      linguistic: linguisticResult,
      evidence: evidenceResult,
      visual: visualResult,
      synthesis,
    }
  } catch (error) {
    console.error('Verification failed:', error)
    throw error
  }
}

// --- Compatibility helpers for older UI (App.tsx expects these) ---
export type AgentResult = { agentId: string; result?: any; error?: string }

export async function analyzeAgent(agentId: AgentId, payload: any): Promise<any> {
  switch (agentId) {
    case 'linguistic':
      return analyzeLinguistic(payload.text)
    case 'evidence':
      return checkEvidence(payload.text || payload.claim || '')
    case 'visual':
      // ensure we pass text as well (fallback to empty string)
      return analyzeVisual(payload.text || '', payload.image_urls || payload.images || [])
    case 'synthesis':
      // send full agent results if available
      return synthesizeResults(payload.text || '', payload.linguistic || null, payload.evidence || null, payload.visual || null)
    default:
      throw new Error(`Unknown agentId: ${String(agentId)}`)
  }
}

export async function analyzeAgentsInParallel(text: string, imageUrls: string[] = []): Promise<AgentResult[]> {
  // Run the 3 analysis agents in parallel first (linguistic, evidence, visual).
  // Synthesis must run after we have real scores from these agents.
  const agentIds: AgentId[] = ['linguistic', 'evidence', 'visual']

  const promises = agentIds.map(async (agentId) => {
    try {
      let result: any
      if (agentId === 'linguistic') result = await analyzeLinguistic(text)
      else if (agentId === 'evidence') result = await checkEvidence(text)
      else {
        // Only call the visual agent if we have image URLs to analyze.
          if (imageUrls && imageUrls.length > 0) {
          result = await analyzeVisual(text, imageUrls)
        } else {
          // Skip making a network call if no images are present. Return a skipped marker.
          result = {
            images_analyzed: 0,
            manipulation_detected: false,
            confidence_score: 0,
            details: [],
            skipped: true,
          }
        }
      }
      return { agentId, result }
    } catch (err: any) {
      return { agentId, error: err?.message || String(err) }
    }
  })

  const results = await Promise.all(promises)

  // Extract numeric scores (use 0 as fallback when an agent failed or score missing)
  // Note: Using 0 allows synthesis to continue even if agents fail (graceful degradation).
  // Consider alternative: skip synthesis or mark results as partial if any agent fails.
  const linguisticScore =
    (results.find(r => r.agentId === 'linguistic')?.result as any)?.manipulation_score ?? 0
  const evidenceScore =
    (results.find(r => r.agentId === 'evidence')?.result as any)?.credibility_score ?? 0
  const visualScore =
    (results.find(r => r.agentId === 'visual')?.result as any)?.confidence_score ?? 0

  // Run synthesis sequentially so it receives the actual scores
  try {
    const synthesis = await synthesizeResults(linguisticScore, evidenceScore, visualScore)
    results.push({ agentId: 'synthesis', result: synthesis })
  } catch (err: any) {
    results.push({ agentId: 'synthesis', error: err?.message || String(err) })
  }

  return results
}
