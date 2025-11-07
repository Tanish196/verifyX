import React from 'react'

type Status = { type: string; message: string } | undefined

type Props = {
  id: string
  title: string
  description: string
  icon?: string
  colorClass?: string
  onAnalyze: () => void
  status?: Status
}

export default function AgentCard({ id, title, description, icon, colorClass, onAnalyze, status }: Props) {
  return (
    <div className={`agent-card ${colorClass || ''}`}>
      <div className="agent-header">
        <div className="agent-icon">{icon || '🧩'}</div>
        <div className="agent-info">
          <h3 className="agent-name">{title}</h3>
          <p className="agent-description">{description}</p>
        </div>
      </div>
      <button className="agent-button" id={`${id}Btn`} onClick={onAnalyze}>
        {title.includes('Analyze') ? title : `Run ${title}`}
      </button>
      <div className={`status ${status?.type || ''}`} id={`${id}Status`}>
        {status?.message}
      </div>
    </div>
  )
}
