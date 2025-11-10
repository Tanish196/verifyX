import React from 'react'

interface VerdictCardProps {
  verdict: string
  confidence: number
  overallScore: number
}

const VerdictCard: React.FC<VerdictCardProps> = ({ verdict, confidence, overallScore }) => {
  const getVerdictColor = () => {
    if (overallScore >= 0.8) return 'text-green-600 bg-green-50 border-green-300'
    if (overallScore >= 0.6) return 'text-blue-600 bg-blue-50 border-blue-300'
    if (overallScore >= 0.4) return 'text-yellow-600 bg-yellow-50 border-yellow-300'
    return 'text-red-600 bg-red-50 border-red-300'
  }

  const getVerdictEmoji = () => {
    if (overallScore >= 0.8) return '✅'
    if (overallScore >= 0.6) return '👍'
    if (overallScore >= 0.4) return '⚠️'
    return '❌'
  }

  return (
    <div className={`border-2 rounded-lg p-6 ${getVerdictColor()}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Final Verdict</h2>
        <span className="text-4xl">{getVerdictEmoji()}</span>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-sm uppercase tracking-wide opacity-75 mb-1">Classification</p>
          <p className="text-xl font-semibold capitalize">{verdict.replace(/_/g, ' ')}</p>
        </div>

        <div>
          <p className="text-sm uppercase tracking-wide opacity-75 mb-1">Confidence</p>
          <p className="text-xl font-semibold">{(confidence * 100).toFixed(1)}%</p>
        </div>

        <div>
          <p className="text-sm uppercase tracking-wide opacity-75 mb-1">Overall Score</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-white bg-opacity-50 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all"
                style={{ width: `${overallScore * 100}%` }}
              />
            </div>
            <span className="text-lg font-bold">{(overallScore * 100).toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VerdictCard
