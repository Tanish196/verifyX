// Background service worker for API orchestration

// Google Cloud Function URLs
const AGENT_URLS = {
  agent1: 'https://us-central1-okqyyqqyqyyq.cloudfunctions.net/clean-agent1-linguistic',
  agent2: 'https://us-central1-okqyyqqyqyyq.cloudfunctions.net/clean-agent2-evidence',
  agent3: 'https://us-central1-okqyyqqyqyyq.cloudfunctions.net/vishwas-agent3-visual', // Updated to use vishwas-agent3
  agent4: 'https://us-central1-okqyyqqyqyyq.cloudfunctions.net/clean-agent4-synthesizer'
};

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'verifyContent') {
    console.log('Background: Received verification request for text:', request.text.substring(0, 100) + '...');
    console.log('Background: Received images:', request.images?.length || 0);

    // Handle async verification
    handleVerification(request.text, request.images || [])
      .then(result => {
        console.log('Background: Verification completed successfully');
        sendResponse({
          success: true,
          intermediateResults: result.intermediateResults,
          finalResult: result.finalResult
        });
      })
      .catch(error => {
        console.error('Background: Verification failed:', error);
        sendResponse({ success: false, error: error.message });
      });

    // Return true to indicate we'll send a response asynchronously
    return true;
  }
});

// Generic function to call an agent with retry mechanism
async function callAgent(url, data, retries = 3, delay = 1000) {
  console.log(`Background: Calling ${url}...`);
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      // Handle specific HTTP status codes
      if (response.status === 400) {
        throw new Error('Invalid request data. Please check input format.');
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`Background: Response from ${url}:`, result);
      return result;

    } catch (error) {
      console.error(`Background: Error calling ${url} (Attempt ${attempt}/${retries}):`, error);
      
      // Special handling for Agent 3 - implement fallback
      if (url === AGENT_URLS.agent3 && attempt === retries) {
        console.log('Background: Implementing fallback for Agent 3');
        // Return fallback response with "deepfake:no" as requested
        return {
          agent_info: {
            agent_id: "agent3-fallback",
            agent_name: "Visual Integrity Checker (Fallback)",
            timestamp: new Date().toISOString(),
            version: "1.0.0-fallback"
          },
          analysis_results: {
            analysis_type: "text_only",
            confidence_level: "low",
            integrity_level: "unknown",
            visual_integrity_score: 50.0,
            deepfake: "no"  // As requested by user
          },
          explanations: {
            confidence_assessment: "Fallback response - Agent 3 failed",
            detailed_findings: [
              "Original Agent 3 request failed",
              "Providing conservative fallback assessment",
              "Deepfake detection: no (fallback default)"
            ],
            summary: "⚠️ Agent 3 failed - using fallback with conservative assessment"
          },
          recommendations: [
            ["⚠️ Agent 3 failure", "Using fallback response", "Deepfake detection defaulted to: no"]
          ],
          fallback: true
        };
      }
      
      if (attempt === retries) {
        // Return a more detailed fallback response on final attempt
        return {
          error: `${error.message} (after ${retries} attempts)`,
          status: 'failed',
          timestamp: new Date().toISOString(),
          details: {
            url: url,
            attempts: retries,
            lastError: error.message
          }
        };
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
}

// Function to fetch image from URL and convert to base64
async function fetchImageAsBase64(imageUrl) {
  try {
    console.log(`Background: Fetching image: ${imageUrl}`);
    const response = await fetch(imageUrl, {
      method: 'GET',
      headers: {
        'Accept': 'image/*',
      }
    });

    if (!response.ok) {
      console.warn(`Background: Failed to fetch image ${imageUrl}: ${response.status}`);
      return null;
    }

    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Return just the base64 data without the data URL prefix
        const base64 = reader.result;
        if (base64 && base64.includes(',')) {
          resolve(base64.split(',')[1]);
        } else {
          resolve(base64);
        }
      };
      reader.onerror = () => {
        console.warn(`Background: Failed to convert image ${imageUrl} to base64`);
        resolve(null);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn(`Background: Error fetching image ${imageUrl}:`, error);
    return null;
  }
}

// Function to convert image URLs to base64
async function convertImagesToBase64(imageUrls) {
  if (!imageUrls || imageUrls.length === 0) {
    return [];
  }

  console.log(`Background: Converting ${imageUrls.length} images to base64...`);
  const base64Promises = imageUrls.map(url => fetchImageAsBase64(url));
  const results = await Promise.all(base64Promises);

  // Filter out null results and limit to 3 images to avoid API limits
  const validImages = results.filter(img => img !== null).slice(0, 3);
  console.log(`Background: Successfully converted ${validImages.length} images to base64`);

  return validImages;
}

// Helper function to validate and format agent input
function validateAgentInput(agentType, text, postData) {
  switch (agentType) {
    case 'linguistic':
      return {
        text: text.substring(0, 2000)
      };
    case 'evidence':
      return {
        text: text.substring(0, 2000)
      };
    case 'visual':
      // For visual agent, send text-only format if no valid images
      const images = postData?.images || [];
      // Filter valid base64 images or send empty array
      const validImages = images.filter(img => img && (img.startsWith('data:image') || img.length > 100));
      return {
        text: text,
        ...(validImages.length > 0 && { images: validImages })
      };
    default:
      return { text };
  }
}

// Main verification orchestration function with enhanced logging
async function handleVerification(text, images = []) {
  console.log('🚀 Background: Starting verification process...');
  console.log('📝 Text to analyze:', text.substring(0, 100) + '...');
  console.log('🖼️ Images received:', images.length);

  try {
    // Use provided images from content script
    const postImages = images;
    console.log('🖼️ Images to process:', postImages.length);
    
    console.log('⚡ Background: Calling Agents 1, 2, and 3 in parallel...');
    const startTime = Date.now();

    // Prepare inputs for all agents
    const agent1Input = validateAgentInput('linguistic', text);
    const agent2Input = validateAgentInput('evidence', text);
    const agent3Input = validateAgentInput('visual', text, { images: postImages });

    const [response1, response2, response3] = await Promise.all([
      callAgent(AGENT_URLS.agent1, agent1Input),
      callAgent(AGENT_URLS.agent2, agent2Input),
      callAgent(AGENT_URLS.agent3, agent3Input)
    ]);

    const parallelTime = Date.now() - startTime;
    console.log(`⚡ Background: Parallel agents completed in ${parallelTime}ms`);
    console.log('🔤 Agent 1 (Linguistic):', response1.error ? '❌ FAILED' : '✅ SUCCESS');
    console.log('🔍 Agent 2 (Evidence):', response2.error ? '❌ FAILED' : '✅ SUCCESS');
    console.log('👁️ Agent 3 (Visual):', response3.error ? '❌ FAILED' : '✅ SUCCESS');

    // Check if any of the first 3 agents failed
    const failedAgents = [];
    if (response1.error) failedAgents.push('Agent 1 (Linguistic)');
    if (response2.error) failedAgents.push('Agent 2 (Evidence)');
    if (response3.error) failedAgents.push('Agent 3 (Visual)');

    if (failedAgents.length === 3) {
      throw new Error('All three initial agents failed. Cannot proceed with verification.');
    }
    
    if (failedAgents.length > 0) {
      console.log('⚠️ Some agents failed:', failedAgents.join(', '));
    }

    // Store intermediate results
    const intermediateResults = {
      agent1: response1,
      agent2: response2,
      agent3: response3
    };

    // Step 2: Create optimized payload for Agent 4 (reduce API limits)
    console.log('🎯 Background: Preparing Agent 4 synthesis...');
    const optimizedInput = createOptimizedInputForAgent4(
      text,
      response1.error ? null : response1,
      response2.error ? null : response2,
      response3.error ? null : response3
    );

    console.log('🎯 Background: Calling Agent 4 for final synthesis...');
    const agent4StartTime = Date.now();
    const finalResult = await callAgent(AGENT_URLS.agent4, optimizedInput);
    const agent4Time = Date.now() - agent4StartTime;
    
    console.log(`🎯 Agent 4 completed in ${agent4Time}ms:`, finalResult.error ? '❌ FAILED' : '✅ SUCCESS');
    
    // Check if Agent 4 failed
    if (finalResult.error) {
      console.error('❌ Final agent (Agent 4) failed:', finalResult.error);
      // Still return intermediate results even if Agent 4 fails
      return {
        intermediateResults,
        finalResult: JSON.stringify({
          error: `Agent 4 synthesis failed: ${finalResult.error}`,
          partial_results: 'Individual agent results available above',
          timestamp: new Date().toISOString()
        }, null, 2)
      };
    }
    
    const totalTime = Date.now() - startTime;
    console.log(`✅ Background: Complete verification finished in ${totalTime}ms`);
    
    // Return both intermediate and final results
    return {
      intermediateResults,
      finalResult: JSON.stringify(finalResult, null, 2)
    };

  } catch (error) {
    console.error('❌ Background: Error in verification process:', error);
    throw error;
  }
}

// Function to extract and convert images to base64 (placeholder - images should be extracted in content script)
async function extractImagesFromPost(postContent) {
  // Images should be extracted in content script and passed to background
  return [];
}

// Update createOptimizedInputForAgent4 to match clean agent format
function createOptimizedInputForAgent4(originalText, agent1Result, agent2Result, agent3Result) {
  return {
    content: {
      text: originalText.substring(0, 800)
    },
    agent1_analysis: agent1Result || { status: 'failed', error: 'Agent 1 failed to process' },
    agent2_analysis: agent2Result || { status: 'failed', error: 'Agent 2 failed to process' },
    agent3_analysis: agent3Result || { status: 'failed', error: 'Agent 3 failed to process' },
    context: {
      url: 'unknown'  // Service worker cannot access window.location
    }
  };
}

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
  console.log('Background: Content Verifier extension started');
});

chrome.runtime.onInstalled.addListener((details) => {
  console.log('Background: Content Verifier extension installed/updated', details);
});

console.log('Background: Content Verifier background script loaded');

// Create curl command for testing Agent 4
function generateAgent4CurlExample() {
  const examplePayload = {
    content_data: {
      text: "Example post text to verify",
      content_type: "text"
    },
    agent_results: {
      agent1_analysis: { "confidence": 0.85, "tone": "neutral", "complexity": "medium" },
      agent2_analysis: { "factual_accuracy": 0.7, "sources_found": 2, "verification_status": "partial" },
      agent3_analysis: { "content_type": "text", "media_analysis": "none", "visual_credibility": "n/a" }
    },
    timestamp: new Date().toISOString(),
    request_type: "final_verification"
  };

  const curlCommand = `curl -X POST '${AGENT_URLS.agent4}' \\
  -H 'Content-Type: application/json' \\
  -d '${JSON.stringify(examplePayload, null, 2)}'`;
  
  console.log('Background: Agent 4 curl test command:');
  console.log(curlCommand);
  
  return curlCommand;
}

// Generate curl command on startup for testing
generateAgent4CurlExample();