import React from 'react'
import { type Status } from '../utils/constants'
import Loader from './Loader'

interface AgentCardProps {
  name: string
  status: Status
  score?: number
  details?: string[]
}

const AgentCard: React.FC<AgentCardProps> = ({ name, status, score, details }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'bg-yellow-100 border-yellow-400'
      case 'success':
        return 'bg-green-100 border-green-400'
      case 'error':
        return 'bg-red-100 border-red-400'
      default:
        return 'bg-gray-100 border-gray-300'
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader />
      case 'success':
        return <span className="text-green-600 text-2xl">✓</span>
      case 'error':
        return <span className="text-red-600 text-2xl">✗</span>
      default:
        return <span className="text-gray-400 text-2xl">○</span>
    }
  }

  return (
    <div className={`border-2 rounded-lg p-4 transition-all ${getStatusColor()}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-800">{name}</h3>
        {getStatusIcon()}
      </div>
      
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

      {details && details.length > 0 && (
        <div className="mt-3 text-xs text-gray-700">
          <ul className="list-disc list-inside space-y-1">
            {details.map((detail, index) => (
              <li key={index}>{detail}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default AgentCard
