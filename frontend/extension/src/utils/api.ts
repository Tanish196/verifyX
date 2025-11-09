import { API_BASE_URL, ENDPOINTS, RETRY_CONFIG } from './constants'
import type { AgentId } from './constants'

export interface LinguisticRequest {
  text: string
}

export interface LinguisticResponse {
  manipulation_score: number
  signals: string[]
  model_scores: {
    entailment?: number
    contradiction?: number
    neutral?: number
  }
}

export interface EvidenceRequest {
  claim: string
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
  image_urls: string[]
}

export interface VisualResponse {
  images_analyzed: number
  manipulation_detected: boolean
  confidence_score: number
  details: string[]
}

export interface SynthesisRequest {
  linguistic_score: number
  evidence_score: number
  visual_score: number
}

export interface SynthesisResponse {
  overall_score: number
  verdict: string
  confidence: number
  breakdown: {
    linguistic: number
    evidence: number
    visual: number
  }
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
      body: JSON.stringify({ claim }),
    }
  )
}

export async function analyzeVisual(imageUrls: string[]): Promise<VisualResponse> {
  return fetchWithRetry<VisualResponse>(
    `${API_BASE_URL}${ENDPOINTS.VISUAL}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image_urls: imageUrls }),
    }
  )
}

export async function synthesizeResults(
  linguisticScore: number,
  evidenceScore: number,
  visualScore: number
): Promise<SynthesisResponse> {
  return fetchWithRetry<SynthesisResponse>(
    `${API_BASE_URL}${ENDPOINTS.SYNTHESIZE}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        linguistic_score: linguisticScore,
        evidence_score: evidenceScore,
        visual_score: visualScore,
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
      analyzeVisual(imageUrls),
    ])

    // Synthesize results
    const synthesis = await synthesizeResults(
      linguisticResult.manipulation_score,
      evidenceResult.credibility_score,
      visualResult.confidence_score
    )

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
      return analyzeVisual(payload.image_urls || payload.images || [])
    case 'synthesis':
      return synthesizeResults(payload.linguistic_score || 0, payload.evidence_score || 0, payload.visual_score || 0)
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
          result = await analyzeVisual(imageUrls)
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
