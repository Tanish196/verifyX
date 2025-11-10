'use client'

export default function HowItWorks() {
  const agents = [
    {
      icon: '🧠',
      title: 'Linguistic Agent',
      description: 'Analyzes tone, emotional bias, and sensational language patterns to detect manipulation.',
      color: 'from-purple-500 to-purple-600',
      features: ['Sentiment Analysis', 'Tone Detection', 'Manipulation Signals']
    },
    {
      icon: '🔍',
      title: 'Evidence Agent',
      description: 'Cross-verifies claims with trusted fact-checking sources and databases.',
      color: 'from-blue-500 to-blue-600',
      features: ['Fact-Check API', 'Source Verification', 'Credibility Scoring']
    },
    {
      icon: '🖼️',
      title: 'Visual Agent',
      description: 'Detects deepfakes and manipulated images using state-of-the-art CLIP technology.',
      color: 'from-indigo-500 to-indigo-600',
      features: ['Deepfake Detection', 'Image-Text Matching', 'Visual Manipulation']
    },
    {
      icon: '✅',
      title: 'Synthesizer Agent',
      description: 'Combines all agent outputs into a unified verdict with confidence scoring.',
      color: 'from-cyan-500 to-cyan-600',
      features: ['Multi-Agent Fusion', 'Confidence Scoring', 'Final Verdict']
    }
  ]

  return (
    <section id="how-it-works" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            How verifyX Determines Truth
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our AI system uses four specialized agents that work together to analyze content from multiple angles
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {agents.map((agent, index) => (
            <div
              key={index}
              className="relative group"
            >
              {/* Connector line */}
              {index < agents.length - 1 && (
                <div className="hidden lg:block absolute top-24 left-full w-full h-0.5 bg-linear-to-r from-gray-300 to-transparent z-0" />
              )}

              {/* Agent card */}
              <div className="relative bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all transform hover:-translate-y-2 z-10">
                {/* Icon circle */}
                <div className={`w-16 h-16 bg-linear-to-br ${agent.color} rounded-full flex items-center justify-center text-3xl mb-4 mx-auto`}>
                  {agent.icon}
                </div>

                {/* Step number */}
                <div className="absolute top-4 right-4 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-gray-600">{index + 1}</span>
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">
                  {agent.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4 text-center leading-relaxed">
                  {agent.description}
                </p>

                {/* Features */}
                <div className="space-y-2">
                  {agent.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center text-xs text-gray-500">
                      <svg className="w-4 h-4 text-green-500 mr-2 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Process flow explanation */}
        <div className="mt-16 bg-linear-to-r from-purple-50 to-blue-50 rounded-2xl p-8 border border-purple-200">
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              The Complete Verification Process
            </h3>
            <p className="text-gray-700 leading-relaxed">
              When you submit content, all four agents analyze it simultaneously. The <strong>Linguistic Agent</strong> examines 
              the text for emotional manipulation, the <strong>Evidence Agent</strong> searches for corroborating sources, 
              the <strong>Visual Agent</strong> checks images for manipulation, and finally the <strong>Synthesizer Agent</strong> combines 
              all findings into a single, easy-to-understand verdict with confidence scoring.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-purple-600 mb-2">4</div>
            <p className="text-gray-600">AI Agents</p>
          </div>
          <div>
            <div className="text-4xl font-bold text-blue-600 mb-2">&lt; 5s</div>
            <p className="text-gray-600">Average Analysis Time</p>
          </div>
          <div>
            <div className="text-4xl font-bold text-indigo-600 mb-2">100%</div>
            <p className="text-gray-600">Privacy Protected</p>
          </div>
        </div>
      </div>
    </section>
  )
}
