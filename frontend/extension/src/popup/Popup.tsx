/// <reference types="chrome"/>
import '../index.css'
import { useState } from 'react'
import AgentCard from '../components/AgentCard'
import EvidenceCard from '../components/EvidenceCard'
import VerdictCard from '../components/VerdictCard'
import ErrorBanner from '../components/ErrorBanner'
import { verifyContent } from '../utils/api'
import { AGENTS } from '../utils/constants'
import type { Status } from '../utils/constants'
import type {
  LinguisticResponse,
  EvidenceResponse,
  VisualResponse,
  SynthesisResponse,
} from '../utils/api'

const Popup: React.FC = () => {
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

      if (!text) {
        throw new Error('No text content found on page')
      }

      // Start verification
      setSynthesisStatus('loading')
      
      const results = await verifyContent(text, images)

      // Update linguistic results
      setLinguisticResult(results.linguistic)
      setLinguisticStatus('success')

      // Update evidence results
      setEvidenceResult(results.evidence)
      setEvidenceStatus('success')

      // Update visual results
      setVisualResult(results.visual)
      setVisualStatus('success')

      // Update synthesis results
      setSynthesisResult(results.synthesis)
      setSynthesisStatus('success')

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
            score={evidenceResult?.overall_accuracy_score}
            factsChecked={evidenceResult?.facts_checked}
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
