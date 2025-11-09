// API Configuration
export const API_BASE_URL = 'http://127.0.0.1:8000'

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
