// API client for verifyX backend

const API_BASE_URL = "https://verifyx-2kqa.onrender.com"

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

export async function analyzeLinguistic(text: string): Promise<LinguisticResponse> {
  return fetchWithTimeout<LinguisticResponse>(
    `${API_BASE_URL}/linguistic`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    }
  )
}

export async function checkEvidence(text: string): Promise<EvidenceResponse> {
  return fetchWithTimeout<EvidenceResponse>(
    `${API_BASE_URL}/evidence`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    }
  )
}

export async function analyzeVisual(text: string, images: string[]): Promise<VisualResponse> {
  return fetchWithTimeout<VisualResponse>(
    `${API_BASE_URL}/visual`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, images }),
    }
  )
}

export async function synthesizeResults(
  text: string,
  linguistic: LinguisticResponse,
  evidence: EvidenceResponse,
  visual?: VisualResponse
): Promise<SynthesisResponse> {
  return fetchWithTimeout<SynthesisResponse>(
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
    }
  )
}

export async function verifyContent(
  text: string,
  images: string[] = []
): Promise<VerificationResult> {
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
