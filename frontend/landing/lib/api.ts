// API client for verifyX backend

const API_BASE_URL =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_BASE_URL) ||
  "https://redpanda2005-verifyx-backend.hf.space"

export interface LinguisticResponse {
  agent_id: string
  model: string
  dominant_tone: string
  sentiment: string
  manipulation_score: number
  signals: Array<{
    label: string
    confidence: number
    rationale?: string
  }>
  raw_probs: Record<string, any>
  latency_ms: number
}

export interface EvidenceResponse {
  agent_id: string
  provider: string
  facts_checked: Array<{
    claim: string
    verdict: string
    source?: string
    url?: string
    confidence: number
  }>
  coverage_ratio: number
  overall_accuracy_score: number
  latency_ms: number
}

export interface ImageMatch {
  index: number
  similarity: number
  notes?: string
  renderer?: string
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

export interface SynthesisResponse {
  agent_id: string
  verdict: string
  confidence: number
  rationale: string
  supporting: Record<string, any>
  latency_ms: number
}

export interface VerificationResult {
  linguistic: LinguisticResponse
  evidence: EvidenceResponse
  visual?: VisualResponse
  synthesis: SynthesisResponse
}

async function fetchWithTimeout<T>(
  url: string,
  options: RequestInit,
  timeoutMs: number = 30000
): Promise<T> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    return await response.json()
  } finally {
    clearTimeout(timeoutId)
  }
}

function wait(ms: number) {
  return new Promise((res) => setTimeout(res, ms))
}

async function requestWithRetry<T>(
  url: string,
  options: RequestInit,
  timeoutMs = 30000,
  maxRetries = 3
): Promise<T> {
  let attempt = 0
  let lastError: any = null

  while (attempt <= maxRetries) {
    try {
      return await fetchWithTimeout<T>(url, options, timeoutMs)
    } catch (err: any) {
      lastError = err
      // If it's the final attempt, throw
      if (attempt === maxRetries) break

      // For network errors / 5xx / aborts, wait with exponential backoff and retry
      const backoff = Math.min(2000 * Math.pow(2, attempt), 10000)
      // small jitter
      const jitter = Math.floor(Math.random() * 300)
      await wait(backoff + jitter)
      attempt += 1
    }
  }

  throw lastError
}

/**
 * Ensure the backend is awake by pinging /wake with retries.
 * This is useful for free-tier hosts that sleep inactive instances.
 */
async function ensureServerAwake(retries = 5, timeoutMs = 8000): Promise<boolean> {
  const wakeUrl = `${API_BASE_URL}/wake`
  let attempt = 0
  while (attempt < retries) {
    try {
      const resp = await fetchWithTimeout<{ status: string }>(wakeUrl, { method: 'GET' }, timeoutMs)
      if (resp && resp.status === 'awake') return true
    } catch (err) {
      // ignore and retry
    }
    // wait before next attempt (increasing backoff for cold start)
    await wait(2000 + attempt * 2000)
    attempt += 1
  }
  return false
}

export async function analyzeLinguistic(text: string): Promise<LinguisticResponse> {
  return requestWithRetry<LinguisticResponse>(
    `${API_BASE_URL}/linguistic`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    }
  )
}

export async function checkEvidence(text: string): Promise<EvidenceResponse> {
  return requestWithRetry<EvidenceResponse>(
    `${API_BASE_URL}/evidence`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    }
  )
}

export async function analyzeVisual(text: string, images: string[]): Promise<VisualResponse> {
  return requestWithRetry<VisualResponse>(
    `${API_BASE_URL}/visual`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, images }),
    },
    60000,
    4
  )
}

export async function synthesizeResults(
  text: string,
  linguistic: LinguisticResponse,
  evidence: EvidenceResponse,
  visual?: VisualResponse
): Promise<SynthesisResponse> {
  return requestWithRetry<SynthesisResponse>(
    `${API_BASE_URL}/synthesize`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        linguistic,
        evidence,
        visual,
      }),
    },
    60000,
    4
  )
}

export async function verifyContent(
  text: string,
  images: string[] = []
): Promise<VerificationResult> {
  // Try to ensure the backend is awake first (helps with free-tier sleeping hosts)
  const awake = await ensureServerAwake()
  if (!awake) {
    throw new Error('Backend did not respond to health checks; please try again in a few seconds')
  }

  // Run linguistic, evidence, and visual checks in parallel
  const [linguisticResult, evidenceResult, visualResult] = await Promise.all([
    analyzeLinguistic(text),
    checkEvidence(text),
    images.length > 0 ? analyzeVisual(text, images) : Promise.resolve(undefined),
  ])

  // Synthesize results
  const synthesis = await synthesizeResults(
    text,
    linguisticResult,
    evidenceResult,
    visualResult
  )

  return {
    linguistic: linguisticResult,
    evidence: evidenceResult,
    visual: visualResult,
    synthesis,
  }
}

// Helper to convert file to base64
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
