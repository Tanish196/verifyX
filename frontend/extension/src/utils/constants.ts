export const AGENT_URLS: Record<string, string> = {
  agent1: 'https://us-central1-okqyyqqyqyyq.cloudfunctions.net/clean-agent1-linguistic',
  agent2: 'https://us-central1-okqyyqqyqyyq.cloudfunctions.net/clean-agent2-evidence',
  agent3: 'https://us-central1-okqyyqqyqyyq.cloudfunctions.net/vishwas-agent3-visual',
  agent4: 'https://us-central1-okqyyqqyqyyq.cloudfunctions.net/clean-agent4-synthesizer'
}

export const AGENT_META = {
  agent1: { id: 'agent1', title: 'Linguistic Cleaner', brief: 'Cleans and analyzes text for clarity, tone, and grammar.', icon: '📝', colorClass: 'agent-1' },
  agent2: { id: 'agent2', title: 'Fact Checker', brief: 'Verifies factual accuracy and highlights inconsistencies.', icon: '🔍', colorClass: 'agent-2' },
  agent3: { id: 'agent3', title: 'Visual Integrity', brief: 'Validates images for authenticity and detects deepfakes.', icon: '🖼️', colorClass: 'agent-3' },
  agent4: { id: 'agent4', title: 'Knowledge Synthesizer', brief: 'Combines context and evidence to generate actionable insights.', icon: '🧠', colorClass: 'agent-4' }
} as const
