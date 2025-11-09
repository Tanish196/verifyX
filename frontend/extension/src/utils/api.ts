import { API_BASE_URL, ENDPOINTS, RETRY_CONFIG } from './constants'

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

async function fetchWithRetry<T>(
  url: string,
  options: RequestInit,
  attempts: number = RETRY_CONFIG.MAX_ATTEMPTS
): Promise<T> {
  try {
    const response = await fetch(url, options)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error) {
    if (attempts > 1) {
      await new Promise(resolve => setTimeout(resolve, RETRY_CONFIG.DELAY_MS))
      return fetchWithRetry<T>(url, options, attempts - 1)
    }
    throw error
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
    // Run linguistic and evidence checks in parallel
    const [linguisticResult, evidenceResult] = await Promise.all([
      analyzeLinguistic(text),
      checkEvidence(text),
    ])

    // Run visual analysis
    const visualResult = await analyzeVisual(imageUrls)

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
