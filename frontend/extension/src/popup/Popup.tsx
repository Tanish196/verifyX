/// <reference types="chrome"/>
import '../index.css'
import { useState } from 'react'
import AgentCard from '../components/AgentCard'
import EvidenceCard from '../components/EvidenceCard'
import VerdictCard from '../components/VerdictCard'
import ErrorBanner from '../components/ErrorBanner'
import { verifyContent } from '../utils/api'
import { AGENTS, CACHE_CONFIG } from '../utils/constants'
import type { Status } from '../utils/constants'
import type {
  LinguisticResponse,
  EvidenceResponse,
  VisualResponse,
  SynthesisResponse,
  VerificationResult,
} from '../utils/api'

interface CachedScanEntry {
  fingerprint: string
  cachedAt: number
  result: VerificationResult
}

type ScanCacheStore = Record<string, CachedScanEntry>

const hashString = (value: string): string => {
  let hash = 5381
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 33) ^ value.charCodeAt(i)
  }
  return (hash >>> 0).toString(16)
}

const buildCacheKey = (url: string): string => {
  if (!url) return 'unknown-url'
  try {
    const parsed = new URL(url)
    return `${parsed.origin}${parsed.pathname}${parsed.search}`
  } catch {
    return url.split('#')[0]
  }
}

const buildContentFingerprint = (text: string, images: string[]): string => {
  const normalizedText = text.trim().slice(0, 2500)
  const normalizedImages = images.slice(0, 5).join('|')
  return hashString(`${normalizedText}::${normalizedImages}`)
}

const readScanCache = async (): Promise<ScanCacheStore> => {
  const data = (await chrome.storage.local.get(CACHE_CONFIG.STORAGE_KEY)) as Record<string, ScanCacheStore | undefined>
  return data[CACHE_CONFIG.STORAGE_KEY] ?? {}
}

const writeScanCache = async (store: ScanCacheStore): Promise<void> => {
  await chrome.storage.local.set({ [CACHE_CONFIG.STORAGE_KEY]: store })
}

const pruneCacheEntries = (store: ScanCacheStore): ScanCacheStore => {
  const now = Date.now()
  const freshEntries = Object.entries(store).filter(([, entry]) => now - entry.cachedAt <= CACHE_CONFIG.TTL_MS)

  if (freshEntries.length <= CACHE_CONFIG.MAX_ENTRIES) {
    return Object.fromEntries(freshEntries)
  }

  const sortedByAge = freshEntries.sort((a, b) => b[1].cachedAt - a[1].cachedAt)
  return Object.fromEntries(sortedByAge.slice(0, CACHE_CONFIG.MAX_ENTRIES))
}

const getCachedScan = async (cacheKey: string, fingerprint: string): Promise<VerificationResult | null> => {
  const store = pruneCacheEntries(await readScanCache())
  const entry = store[cacheKey]

  if (!entry || entry.fingerprint !== fingerprint) {
    await writeScanCache(store)
    return null
  }

  await writeScanCache(store)
  return entry.result
}

const saveCachedScan = async (cacheKey: string, fingerprint: string, result: VerificationResult): Promise<void> => {
  const store = await readScanCache()
  store[cacheKey] = {
    fingerprint,
    cachedAt: Date.now(),
    result,
  }
  await writeScanCache(pruneCacheEntries(store))
}

const applyVerificationResult = (
  results: VerificationResult,
  setLinguisticResult: (value: LinguisticResponse | null) => void,
  setEvidenceResult: (value: EvidenceResponse | null) => void,
  setVisualResult: (value: VisualResponse | null) => void,
  setSynthesisResult: (value: SynthesisResponse | null) => void,
  setLinguisticStatus: (value: Status) => void,
  setEvidenceStatus: (value: Status) => void,
  setVisualStatus: (value: Status) => void,
  setSynthesisStatus: (value: Status) => void
): void => {
  setLinguisticResult(results.linguistic)
  setEvidenceResult(results.evidence)
  setVisualResult(results.visual)
  setSynthesisResult(results.synthesis)

  setLinguisticStatus('success')
  setEvidenceStatus('success')
  setVisualStatus('success')
  setSynthesisStatus('success')
}

const Popup: React.FC = () => {
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cacheMessage, setCacheMessage] = useState<string | null>(null)

  const [linguisticStatus, setLinguisticStatus] = useState<Status>('idle')
  const [evidenceStatus, setEvidenceStatus] = useState<Status>('idle')
  const [visualStatus, setVisualStatus] = useState<Status>('idle')
  const [synthesisStatus, setSynthesisStatus] = useState<Status>('idle')

  const [linguisticResult, setLinguisticResult] = useState<LinguisticResponse | null>(null)
  const [evidenceResult, setEvidenceResult] = useState<EvidenceResponse | null>(null)
  const [visualResult, setVisualResult] = useState<VisualResponse | null>(null)
  const [synthesisResult, setSynthesisResult] = useState<SynthesisResponse | null>(null)

  const handleVerify = async () => {
    setIsVerifying(true)
    setError(null)
    setCacheMessage(null)

    // Reset all statuses
    setLinguisticStatus('loading')
    setEvidenceStatus('loading')
    setVisualStatus('loading')
    setSynthesisStatus('idle')

    try {
      // Get current tab content
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      
      if (!tab.id) {
        throw new Error('No active tab found')
      }

      // Execute content script to extract page content
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const text = document.body.innerText
          const images = Array.from(document.images).map(img => img.src)
          return { text: text.slice(0, 5000), images: images.slice(0, 5) }
        },
      })

      const { text, images } = result.result as { text: string; images: string[] }
      const cacheKey = buildCacheKey(tab.url || '')
      const fingerprint = buildContentFingerprint(text, images)

      if (!text) {
        throw new Error('No text content found on page')
      }

      const cachedResult = await getCachedScan(cacheKey, fingerprint)
      if (cachedResult) {
        applyVerificationResult(
          cachedResult,
          setLinguisticResult,
          setEvidenceResult,
          setVisualResult,
          setSynthesisResult,
          setLinguisticStatus,
          setEvidenceStatus,
          setVisualStatus,
          setSynthesisStatus
        )
        setCacheMessage('Loaded cached result for this page.')
        return
      }

      // Start verification
      setSynthesisStatus('loading')
      
      const results = await verifyContent(text, images)

      await saveCachedScan(cacheKey, fingerprint, results)

      applyVerificationResult(
        results,
        setLinguisticResult,
        setEvidenceResult,
        setVisualResult,
        setSynthesisResult,
        setLinguisticStatus,
        setEvidenceStatus,
        setVisualStatus,
        setSynthesisStatus
      )
      setCacheMessage('Fresh analysis complete. Result cached for this page.')

    } catch (err) {
      console.error('Verification failed:', err)
      setError(err instanceof Error ? err.message : 'Verification failed')
      setLinguisticStatus('error')
      setEvidenceStatus('error')
      setVisualStatus('error')
      setSynthesisStatus('error')
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="w-[400px] min-h-[500px] bg-gradient-to-br from-purple-500 to-blue-500 p-6">
      <div className="bg-white rounded-lg shadow-xl p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            VerifyX
          </h1>
          <p className="text-gray-600 text-sm mt-1">AI-powered content verification</p>
        </div>

        {/* Verify Button */}
        <button
          onClick={handleVerify}
          disabled={isVerifying}
          className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold py-3 px-6 rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-6"
        >
          {isVerifying ? 'Verifying...' : 'Verify This Page'}
        </button>

        {/* Error Banner */}
        {error && (
          <div className="mb-4">
            <ErrorBanner message={error} />
          </div>
        )}

        {cacheMessage && (
          <p className="mb-4 text-xs text-emerald-700 bg-emerald-100 border border-emerald-200 rounded px-3 py-2">
            {cacheMessage}
          </p>
        )}

        {/* Agent Cards */}
        <div className="space-y-4 mb-6">
          <AgentCard
            name={AGENTS.LINGUISTIC}
            status={linguisticStatus}
            score={linguisticResult?.manipulation_score}
            details={linguisticResult?.signals?.map(
              s => `${s.label} (${(s.confidence * 100).toFixed(0)}%)`
            )}
          />

          <EvidenceCard
            status={evidenceStatus}
            score={evidenceResult?.score ?? evidenceResult?.overall_accuracy_score}
            factsChecked={evidenceResult?.facts_checked}
            stanceSummary={evidenceResult?.stance_summary}
            evidenceItems={evidenceResult?.evidence}
          />

          <AgentCard
            name={AGENTS.VISUAL}
            status={visualStatus}
            score={visualResult?.average_similarity}
            details={visualResult?.matches?.map(
              m => `Image ${m.index + 1}: ${(m.similarity * 100).toFixed(1)}% match${m.notes ? ` - ${m.notes}` : ''}`
            )}
          />
        </div>

        {/* Final Verdict */}
        {synthesisResult && synthesisStatus === 'success' && (
          <VerdictCard
            verdict={synthesisResult.verdict}
            confidence={synthesisResult.confidence}
            overallScore={synthesisResult.confidence}
          />
        )}
      </div>
    </div>
  )
}

export default Popup
