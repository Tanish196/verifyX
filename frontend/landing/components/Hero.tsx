'use client'

export default function Hero() {
  const scrollToDemo = () => {
    const element = document.getElementById('try-demo')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const scrollToExtension = () => {
    const element = document.getElementById('extension-demo')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-linear-to-br from-purple-500 via-indigo-500 to-blue-500">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-40 right-20 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-20 left-40 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center">
        <div className="space-y-8">
          {/* Main headline */}
          <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
            Fight Misinformation
            <br />
            <span className="bg-white bg-clip-text text-transparent">
              with AI.
            </span>
          </h1>

          {/* Subtext */}
          <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
            verifyX uses multiple intelligent agents to analyze news, verify facts,
            and detect manipulated visuals.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <button
              onClick={scrollToDemo}
              className="px-8 py-4 bg-white text-purple-600 font-semibold rounded-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-xl"
            >
              Try Demo
            </button>
            <button
              onClick={scrollToExtension}
              className="px-8 py-4 bg-purple-600/20 backdrop-blur-sm text-white font-semibold rounded-lg border-2 border-white/30 hover:bg-purple-600/30 transition-all transform hover:scale-105"
            >
              Watch Extension Demo
            </button>
          </div>

          {/* Feature highlights */}
          <div className="pt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
              <div className="text-4xl mb-3">🧠</div>
              <h3 className="text-white font-semibold text-lg mb-2">Multi-Agent AI</h3>
              <p className="text-white/80 text-sm">
                Four specialized agents work together to verify content
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
              <div className="text-4xl mb-3">⚡</div>
              <h3 className="text-white font-semibold text-lg mb-2">Real-Time Analysis</h3>
              <p className="text-white/80 text-sm">
                Get instant verdicts on news articles and images
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
              <div className="text-4xl mb-3">🔒</div>
              <h3 className="text-white font-semibold text-lg mb-2">Privacy First</h3>
              <p className="text-white/80 text-sm">
                Your data is never stored or shared
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  )
}
