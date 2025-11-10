'use client'

import { type VerificationResult } from '@/lib/api'

interface ResultSectionProps {
  result: VerificationResult
}

export default function ResultSection({ result }: ResultSectionProps) {
  const { synthesis, linguistic, evidence, visual } = result

  const getVerdictColor = (confidence: number) => {
    if (confidence >= 0.8) return 'from-green-500 to-emerald-600'
    if (confidence >= 0.6) return 'from-blue-500 to-cyan-600'
    if (confidence >= 0.4) return 'from-yellow-500 to-orange-500'
    return 'from-red-500 to-rose-600'
  }

  const getVerdictEmoji = (confidence: number) => {
    if (confidence >= 0.8) return '✅'
    if (confidence >= 0.6) return '👍'
    if (confidence >= 0.4) return '⚠️'
    return '❌'
  }

  const getVerdictText = (verdict: string) => {
    return verdict.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  }

  return (
    <div className="mt-12 space-y-6 animate-fadeIn">
      {/* Main Verdict Card */}
      <div className={`bg-linear-to-r ${getVerdictColor(synthesis.confidence)} rounded-2xl p-8 text-white shadow-2xl`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-3xl font-bold">Final Verdict</h3>
          <span className="text-6xl">{getVerdictEmoji(synthesis.confidence)}</span>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm uppercase tracking-wide opacity-90 mb-1">Classification</p>
            <p className="text-2xl font-semibold">{getVerdictText(synthesis.verdict)}</p>
          </div>

          <div>
            <p className="text-sm uppercase tracking-wide opacity-90 mb-1">Confidence</p>
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-white/20 rounded-full h-3">
                <div
                  className="bg-white h-3 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${synthesis.confidence * 100}%` }}
                />
              </div>
              <span className="text-2xl font-bold">{(synthesis.confidence * 100).toFixed(1)}%</span>
            </div>
          </div>

          <div>
            <p className="text-sm uppercase tracking-wide opacity-90 mb-2">Reasoning</p>
            <p className="text-base leading-relaxed opacity-95">{synthesis.rationale}</p>
          </div>
        </div>
      </div>

      {/* Agent Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Linguistic Agent */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-linear-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center text-2xl mr-3">
              🧠
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Linguistic Analysis</h4>
              <p className="text-sm text-gray-600">Tone & Manipulation</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">Manipulation Score</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{ width: `${linguistic.manipulation_score * 100}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {(linguistic.manipulation_score * 100).toFixed(0)}%
                </span>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">Tone</p>
              <p className="text-sm font-medium text-gray-900">{linguistic.dominant_tone}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">Sentiment</p>
              <p className="text-sm font-medium text-gray-900">{linguistic.sentiment}</p>
            </div>
            {linguistic.signals.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Signals</p>
                <div className="space-y-1">
                  {linguistic.signals.slice(0, 3).map((signal, idx) => (
                    <div key={idx} className="text-xs text-gray-700">
                      • {signal.label} ({(signal.confidence * 100).toFixed(0)}%)
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Evidence Agent */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-linear-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-2xl mr-3">
              🔍
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Evidence Check</h4>
              <p className="text-sm text-gray-600">Fact Verification</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">Credibility Score</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${evidence.credibility_score * 100}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {(evidence.credibility_score * 100).toFixed(0)}%
                </span>
              </div>
            </div>
            {evidence.fact_check_results.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Fact Checks Found</p>
                <p className="text-sm font-medium text-gray-900">
                  {evidence.fact_check_results.length} source(s)
                </p>
                <div className="space-y-1 mt-2">
                  {evidence.fact_check_results.slice(0, 2).map((check, idx) => (
                    <div key={idx} className="text-xs text-gray-700 truncate">
                      • {check.rating || 'Unknown'}: {check.claim.slice(0, 40)}...
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Visual Agent */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-linear-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center text-2xl mr-3">
              🖼️
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Visual Analysis</h4>
              <p className="text-sm text-gray-600">Image Verification</p>
            </div>
          </div>
          <div className="space-y-3">
            {visual ? (
              <>
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Average Similarity</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full"
                        style={{ width: `${visual.average_similarity * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {(visual.average_similarity * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Deepfake Flag</p>
                  <p className="text-sm font-medium text-gray-900">
                    {visual.deepfake_flag ? '⚠️ Detected' : '✓ Not Detected'}
                  </p>
                </div>
                {visual.matches.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-1">Images Analyzed</p>
                    <p className="text-sm font-medium text-gray-900">{visual.matches.length}</p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-500 italic">No images analyzed</p>
            )}
          </div>
        </div>
      </div>

      {/* Performance Info */}
      <div className="bg-gray-100 rounded-lg p-4 text-center">
        <p className="text-sm text-gray-600">
          Analysis completed in{' '}
          <span className="font-semibold text-gray-900">
            {((synthesis.latency_ms + linguistic.latency_ms + (visual?.latency_ms || 0)) / 1000).toFixed(2)}s
          </span>
        </p>
      </div>
    </div>
  )
}
