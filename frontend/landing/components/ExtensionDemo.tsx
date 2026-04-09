'use client'

export default function ExtensionDemo() {
  return (
    <section id="extension-demo" className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Chrome Extension Demo
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Watch how verifyX works directly in your browser to verify content on any webpage
          </p>
        </div>

        {/* Embedded demo video */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
          <div className="rounded-xl bg-linear-to-r from-purple-100 to-blue-100 p-1.5 border border-purple-200">
            <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden relative">
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/sMYTRvat4qo"
                title="verifyX Chrome Extension Demo"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              ></iframe>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3 text-sm">
            <p className="text-gray-600">Live walkthrough of verification from extraction to final verdict.</p>
            <span className="shrink-0 inline-flex items-center rounded-full bg-purple-100 text-purple-700 px-3 py-1 font-medium">
              Demo Video
            </span>
          </div>

          {/* Instructions */}
          <div className="mt-8 space-y-4">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">How to Use the Extension</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start">
                <div className="shrink-0 w-10 h-10 bg-linear-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold mr-4">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Install Extension</h4>
                  <p className="text-sm text-gray-600">
                    Load the extension in Chrome by enabling Developer Mode and loading the unpacked extension
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="shrink-0 w-10 h-10 bg-linear-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold mr-4">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Navigate to Page</h4>
                  <p className="text-sm text-gray-600">
                    Visit any news article or webpage with content you want to verify
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="shrink-0 w-10 h-10 bg-linear-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold mr-4">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Click & Verify</h4>
                  <p className="text-sm text-gray-600">
                    Click the verifyX icon and press "Verify This Page" to get instant results
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="mt-8 bg-gray-50 rounded-xl p-6">
            <h4 className="font-semibold text-gray-900 mb-4">Extension Features</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">One-click verification</span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Automatic content extraction</span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Real-time analysis</span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Beautiful gradient UI</span>
              </div>
            </div>
          </div>

          {/* Installation note */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-600 mr-3 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <h5 className="font-semibold text-blue-900 mb-1">Development Installation</h5>
                <p className="text-sm text-blue-800">
                  To install the extension: Open Chrome → Extensions → Enable Developer Mode → Load Unpacked → 
                  Select the <code className="bg-blue-100 px-1 rounded">frontend/extension/dist</code> folder
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
