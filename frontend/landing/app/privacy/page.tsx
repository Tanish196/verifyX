import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'

export default function Privacy() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
            
            <div className="space-y-6 text-gray-700 leading-relaxed">
              <p className="text-lg text-gray-600">
                Last updated: {new Date().toLocaleDateString()}
              </p>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">Our Commitment</h2>
                <p>
                  At verifyX, we take your privacy seriously. This policy explains how we handle your data 
                  when you use our misinformation detection service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">Data Collection</h2>
                <p>
                  When you use verifyX to verify content, we temporarily process:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-2">
                  <li>Text content you submit for analysis</li>
                  <li>Images you upload for visual verification</li>
                  <li>Analysis results and verdicts</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">Data Storage</h2>
                <p className="font-semibold text-purple-600">
                  verifyX does not store your submitted content or personal data.
                </p>
                <p className="mt-2">
                  All content is processed in real-time and discarded immediately after analysis. 
                  We do not maintain databases of verified content or user submissions.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">Third-Party Services</h2>
                <p>
                  verifyX uses the following AI services for analysis:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-2">
                  <li><strong>CLIP (OpenAI)</strong> - For visual analysis and deepfake detection</li>
                  <li><strong>Fact-Check APIs</strong> - For evidence verification from trusted sources</li>
                  <li><strong>NLP Models</strong> - For linguistic and sentiment analysis</li>
                </ul>
                <p className="mt-2">
                  These services process data temporarily and do not retain your content.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">Browser Extension</h2>
                <p>
                  If you use the verifyX Chrome extension:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-2">
                  <li>The extension only extracts content from pages you explicitly verify</li>
                  <li>No browsing history or automatic content collection occurs</li>
                  <li>All data is sent securely to our API and processed in real-time</li>
                  <li>The extension does not track your browsing activity</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">Cookies & Analytics</h2>
                <p>
                  We do not use tracking cookies or analytics services. The website uses only 
                  essential cookies required for basic functionality.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">Security</h2>
                <p>
                  All data transmission between your browser and our servers is encrypted using 
                  industry-standard HTTPS/TLS protocols.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">Your Rights</h2>
                <p>
                  Since we don't store your data, there is no personal information to access, 
                  modify, or delete. Each verification request is independent and ephemeral.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">Changes to This Policy</h2>
                <p>
                  We may update this privacy policy from time to time. Any changes will be 
                  posted on this page with an updated revision date.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">Contact</h2>
                <p>
                  If you have questions about this privacy policy, please contact us through our{' '}
                  <a 
                    href="https://github.com/Tanish196/verifyX" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:text-purple-700 font-medium"
                  >
                    GitHub repository
                  </a>.
                </p>
              </section>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <Link 
                href="/"
                className="text-purple-600 hover:text-purple-700 font-medium flex items-center"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
