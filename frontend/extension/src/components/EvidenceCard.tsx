/// <reference types="chrome"/>
import React from 'react'
import { type Status } from '../utils/constants'
import Loader from './Loader'
import type { FactItem } from '../utils/api'

interface EvidenceCardProps {
  status: Status
  score?: number
  factsChecked?: FactItem[]
}

interface ClaimGroup {
  claim: string
  sources: { title?: string; source: string | null; url: string | null; verdict: string }[]
}

function groupByClaim(facts: FactItem[]): ClaimGroup[] {
  const map = new Map<string, ClaimGroup>()
  for (const fact of facts) {
    if (!map.has(fact.claim)) {
      map.set(fact.claim, { claim: fact.claim, sources: [] })
    }
    if (fact.url) {
      map.get(fact.claim)!.sources.push({
        source: fact.source,
        url: fact.url,
        verdict: fact.verdict,
      })
    }
  }
  return Array.from(map.values())
}

function openLink(url: string) {
  if (typeof chrome !== 'undefined' && chrome.tabs) {
    chrome.tabs.create({ url })
  } else {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}

const EvidenceCard: React.FC<EvidenceCardProps> = ({ status, score, factsChecked }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'loading': return 'bg-yellow-100 border-yellow-400'
      case 'success': return 'bg-green-100 border-green-400'
      case 'error':   return 'bg-red-100 border-red-400'
      default:        return 'bg-gray-100 border-gray-300'
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'loading': return <Loader />
      case 'success': return <span className="text-green-600 text-2xl">✓</span>
      case 'error':   return <span className="text-red-600 text-2xl">✗</span>
      default:        return <span className="text-gray-400 text-2xl">○</span>
    }
  }

  const groups = groupByClaim(factsChecked ?? [])

  return (
    <div className={`border-2 rounded-lg p-4 transition-all ${getStatusColor()}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-800">Evidence Verification</h3>
        {getStatusIcon()}
      </div>

      {/* Score bar */}
      {score !== undefined && (
        <div className="mt-2">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Score:</span>
            <span className="font-bold">{(score * 100).toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${score * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Claims + sources */}
      {groups.length > 0 && (
        <div className="mt-3 space-y-3">
          {groups.map((group, gi) => (
            <div key={gi} className="bg-white bg-opacity-60 rounded p-2">
              {/* Full claim sentence */}
              <p className="text-xs text-gray-800 font-medium leading-snug mb-1">
                {group.claim}
              </p>

              {/* Top 3 source links */}
              {group.sources.length > 0 ? (
                <ul className="space-y-1">
                  {group.sources.slice(0, 3).map((src, si) => (
                    <li key={si} className="flex items-start gap-1">
                      <span className="text-purple-500 mt-0.5 shrink-0">›</span>
                      <button
                        onClick={() => src.url && openLink(src.url)}
                        className="text-left text-xs text-blue-600 hover:text-blue-800 hover:underline break-all"
                        title={src.url ?? ''}
                      >
                        {src.source || src.url}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-400 italic">No sources found</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default EvidenceCard
