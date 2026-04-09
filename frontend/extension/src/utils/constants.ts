// API Configuration
// Set VITE_API_BASE_URL in your .env file to configure the backend URL.
// Falls back to localhost for development if the variable is not set.
export const API_BASE_URL: string = (import.meta.env.VITE_API_BASE_URL as string) || 'http://127.0.0.1:8000'

// API Endpoints
export const ENDPOINTS = {
  HEALTH: '/health',
  LINGUISTIC: '/linguistic',
  EVIDENCE: '/evidence',
  VISUAL: '/visual',
  SYNTHESIZE: '/synthesize',
} as const

// Agent Status
export const AGENT_STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
} as const

// Retry Configuration
export const RETRY_CONFIG = {
  MAX_ATTEMPTS: 2,
  DELAY_MS: 1000,
} as const

// Local scan-cache configuration (used by popup flow)
export const CACHE_CONFIG = {
  STORAGE_KEY: 'verifyx_page_cache_v1',
  TTL_MS: 15 * 60 * 1000,
  MAX_ENTRIES: 40,
} as const

// Agent Names
export const AGENTS = {
  LINGUISTIC: 'Linguistic Analysis',
  EVIDENCE: 'Evidence Verification',
  VISUAL: 'Visual Analysis',
  SYNTHESIS: 'Final Verdict',
} as const

// Verdict Levels
export const VERDICT_LEVELS = {
  VERIFIED: 'verified',
  LIKELY_TRUE: 'likely-true',
  UNCERTAIN: 'uncertain',
  LIKELY_FALSE: 'likely-false',
  FALSE: 'false',
} as const

export type Status = typeof AGENT_STATUS[keyof typeof AGENT_STATUS]

// Agent metadata used by UI components (id must match handler keys)
export const AGENT_META = {
  linguistic: { id: 'linguistic', title: 'Linguistic Analysis', brief: 'Detects manipulation and deceptive language patterns.', icon: '📝', colorClass: 'agent-1' },
  evidence: { id: 'evidence', title: 'Evidence Verification', brief: 'Searches for corroborating fact-checks and sources.', icon: '🔍', colorClass: 'agent-2' },
  visual: { id: 'visual', title: 'Visual Analysis', brief: 'Analyzes images for signs of manipulation and deepfakes.', icon: '🖼️', colorClass: 'agent-3' },
  synthesis: { id: 'synthesis', title: 'Final Verdict', brief: 'Synthesizes agent outputs into a single verdict.', icon: '🧠', colorClass: 'agent-4' },
} as const

export type AgentId = keyof typeof AGENT_META
