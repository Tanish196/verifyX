// Beautiful Content Verifier - Enhanced UI/UX for content verification
// This script injects beautiful verification buttons and displays results in an elegant modal

let verificationModal = null;
const processedElements = new Set();

// Enhanced post selectors for better targeting
const ENHANCED_SELECTORS = [
  'article[data-testid="tweet"]', // Twitter/X tweets
  '.tweet', // Twitter classic
  '[role="article"]:not([data-testid])', // Generic article posts
  '.post:not(.post-content)', // Generic posts
  '.fb-post', // Facebook posts
  '.entry-content', // WordPress posts
  '.linkedin-post', // LinkedIn posts
  '.feed-shared-update-v2', // LinkedIn feed
  'div[data-testid="tweet"]', // New Twitter format
  '.post-content', // Generic post content
  '.userContent', // Facebook content
  '.tweet-text', // Tweet text container
  '.js-tweet-text-container', // Tweet text container (old)
  '.content', // Generic content
  '.story-content', // Story content
  '.media-content', // Media content
  '.comment-body', // Comment content
  '.post-message', // Post message
  '.user-post', // User post
  '.wall-item-content', // Wall item content
  '.activity-content', // Activity content
  '.discussion-post', // Discussion post
  '.forum-post', // Forum post
  '.news-item', // News item
  '.article-content', // Article content
  '.blog-post', // Blog post
  '.status-update', // Status update
  '.microblog-post', // Microblog post
  '.social-post', // Social post
  '.timeline-item', // Timeline item
  '.card-content', // Card content
  '.feed-item', // Feed item
  '.post-body', // Post body
  '.content-body', // Content body
  '.message-content', // Message content
  '.update-content', // Update content
  '.post-container', // Post container
  '.content-wrapper', // Content wrapper
  '.post-wrapper', // Post wrapper
  '.item-content', // Item content
  '.post-main', // Post main
  '.content-main', // Content main
  '.main-content', // Main content
  '.post-text', // Post text
  '.content-text', // Content text
  '.text-content', // Text content
  '.post-description', // Post description
  '.content-description', // Content description
  '.description', // Description
  '.post-summary', // Post summary
  '.content-summary', // Content summary
  '.summary', // Summary
  '.post-excerpt', // Post excerpt
  '.content-excerpt', // Content excerpt
  '.excerpt', // Excerpt
  '.post-body-text', // Post body text
  '.content-body-text', // Content body text
  '.body-text', // Body text
  '.post-content-text', // Post content text
  '.content-main-text', // Content main text
  '.main-text', // Main text
  '.post-full-text', // Post full text
  '.content-full-text', // Content full text
  '.full-text', // Full text
  '.post-article', // Post article
  '.content-article', // Content article
  '.article', // Article
  '.post-article-content', // Post article content
  '.content-article-text', // Content article text
  '.article-text', // Article text
  '.post-article-body', // Post article body
  '.content-article-body', // Content article body
  '.article-body', // Article body
  '.post-article-main', // Post article main
  '.content-article-main', // Content article main
  '.article-main', // Article main
  '.post-article-wrapper', // Post article wrapper
  '.content-article-wrapper', // Content article wrapper
  '.article-wrapper', // Article wrapper
  '.post-article-container', // Post article container
  '.content-article-container', // Content article container
  '.article-container', // Article container
  '.post-section', // Post section
  '.content-section', // Content section
  '.section', // Section
  '.post-block', // Post block
  '.content-block', // Content block
  '.block', // Block
  '.post-segment', // Post segment
  '.content-segment', // Content segment
  '.segment', // Segment
  '.post-piece', // Post piece
  '.content-piece', // Content piece
  '.piece', // Piece
  '.post-part', // Post part
  '.content-part', // Content part
  '.part', // Part
  '.post-fragment', // Post fragment
  '.content-fragment', // Content fragment
  '.fragment', // Fragment
  '.post-unit', // Post unit
  '.content-unit', // Content unit
  '.unit' // Unit
];

// Create beautiful verification button
function createBeautifulVerifyButton(element) {
  if (hasVerifyButton(element)) return;

  // Mark element as processed
  element.dataset.beautifulVerifier = 'true';

  const verifyButton = document.createElement('button');
  verifyButton.className = 'beautiful-verifier-btn';
  verifyButton.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="margin-right: 6px;">
      <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" 
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    Verify Content
  `;
  
  verifyButton.style.cssText = `
    position: absolute;
    top: 12px;
    right: 12px;
    z-index: 10000;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 10px 16px;
    border-radius: 25px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    gap: 6px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  `;

  // Add hover effects
  verifyButton.addEventListener('mouseenter', () => {
    verifyButton.style.transform = 'translateY(-2px) scale(1.05)';
    verifyButton.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.6)';
  });

  verifyButton.addEventListener('mouseleave', () => {
    verifyButton.style.transform = 'translateY(0) scale(1)';
    verifyButton.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
  });

  // Handle verification
  verifyButton.addEventListener('click', async (e) => {
    e.stopPropagation();
    await handleBeautifulVerification(element, verifyButton);
  });

  // Position element relatively if needed
  const computedStyle = window.getComputedStyle(element);
  if (computedStyle.position === 'static') {
    element.style.position = 'relative';
  }

  element.appendChild(verifyButton);
}

// Check if element already has verification button
function hasVerifyButton(element) {
  return element.querySelector('.beautiful-verifier-btn') || 
         element.dataset.beautifulVerifier === 'true';
}

// Enhanced content extraction
function extractBeautifulContent(element) {
  if (!element) return { text: '', images: [] };

  // Clone element to avoid modifying original
  const clone = element.cloneNode(true);
  
  // Remove verification buttons from clone
  clone.querySelectorAll('.beautiful-verifier-btn').forEach(btn => btn.remove());
  
  // Extract text content
  let text = clone.innerText?.trim() || '';
  
  // Clean up text
  text = text
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^\d+[mhd]\s*/, '')
    .replace(/\b\d+(\.\d+)?[KMB]?\s*(likes?|retweets?|shares?)\b/gi, '')
    .trim();
  
  // Limit text length
  if (text.length > 1500) {
    text = text.substring(0, 1500) + '...';
  }

  // Extract images
  const images = Array.from(element.querySelectorAll('img'))
    .map(img => img.src || img.getAttribute('data-src'))
    .filter(src => src && src.startsWith('http'))
    .slice(0, 3); // Limit to 3 images

  return {
    text: text || 'No content found',
    images: images
  };
}

// Handle beautiful verification with enhanced UI
async function handleBeautifulVerification(element, button) {
  console.log('Beautiful verification started');
  
  // Disable button and show loading state
  button.disabled = true;
  const originalHTML = button.innerHTML;
  button.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" class="spinner">
      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" stroke-dasharray="15 50"/>
    </svg>
    Analyzing...
  `;
  
  // Add spinner animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .spinner {
      animation: spin 1s linear infinite;
    }
  `;
  document.head.appendChild(style);

  try {
    // Extract content
    const content = extractBeautifulContent(element);
    console.log('Extracted content:', content);

    // Send to background script
    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { 
          action: 'verifyContent', 
          text: content.text, 
          images: content.images 
        },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        }
      );
    });

    console.log('Verification response:', response);

    if (response.success) {
      button.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M5 13L9 17L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Verified!
      `;
      button.style.background = 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
      
      // Show beautiful results modal
      showBeautifulResultsModal(response.intermediateResults, response.finalResult);
    } else {
      button.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M6 18L18 6M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Error
      `;
      button.style.background = 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)';
      
      showBeautifulResultsModal(null, `Error: ${response.error}`);
    }

  } catch (error) {
    console.error('Verification failed:', error);
    button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M6 18L18 6M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Failed
    `;
    button.style.background = 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)';
    
    showBeautifulResultsModal(null, `Verification failed: ${error.message}`);
  } finally {
    // Reset button after delay
    setTimeout(() => {
      button.disabled = false;
      button.innerHTML = originalHTML;
      button.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      style.remove();
    }, 3000);
  }
}

// Show beautiful results modal
function showBeautifulResultsModal(intermediateResults, finalResult) {
  // Remove existing modal
  if (verificationModal) {
    verificationModal.remove();
  }

  // Create modal overlay
  verificationModal = document.createElement('div');
  verificationModal.id = 'beautiful-verifier-modal';
  verificationModal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
    z-index: 100000;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: modalFadeIn 0.3s ease-out;
  `;

  // Add animations
  const modalStyle = document.createElement('style');
  modalStyle.textContent = `
    @keyframes modalFadeIn {
      from { opacity: 0; transform: scale(0.9); }
      to { opacity: 1; transform: scale(1); }
    }
    @keyframes modalSlideUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .beautiful-result-card {
      animation: modalSlideUp 0.4s ease-out;
    }
    .beautiful-agent-card {
      transition: all 0.3s ease;
    }
    .beautiful-agent-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 20px 40px rgba(0,0,0,0.2);
    }
  `;
  document.head.appendChild(modalStyle);

  // Create modal content
  const modalContent = document.createElement('div');
  modalContent.style.cssText = `
    background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
    width: 90%;
    max-width: 1000px;
    max-height: 90vh;
    border-radius: 20px;
    box-shadow: 0 50px 100px rgba(0, 0, 0, 0.25);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    border: 1px solid rgba(255, 255, 255, 0.2);
  `;

  // Create header
  const header = document.createElement('div');
  header.style.cssText = `
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 25px 30px;
    color: white;
    position: relative;
  `;

  header.innerHTML = `
    <h2 style="margin: 0 0 10px 0; font-size: 28px; font-weight: 700;">
      🛡️ Content Verification Report
    </h2>
    <p style="margin: 0; font-size: 16px; opacity: 0.9;">
      Multi-Agent AI Analysis Pipeline
    </p>
    <button id="beautiful-close-modal" style="
      position: absolute;
      top: 20px;
      right: 20px;
      background: rgba(255, 255, 255, 0.2);
      border: none;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      color: white;
      font-size: 24px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      ×
    </button>
  `;

  // Create main content area
  const mainContent = document.createElement('div');
  mainContent.style.cssText = `
    padding: 30px;
    overflow-y: auto;
    flex: 1;
  `;

  // Create workflow visualization
  const workflow = document.createElement('div');
  workflow.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
    padding: 20px;
    background: linear-gradient(135deg, #f0f4ff 0%, #e6eeff 100%);
    border-radius: 16px;
    border: 1px solid #d0daff;
    position: relative;
  `;

  // Add status indicators for parallel execution
  const statusIndicator = document.createElement('div');
  statusIndicator.style.cssText = `
    position: absolute;
    top: -10px;
    left: 50%;
    transform: translateX(-50%);
    background: #667eea;
    color: white;
    padding: 5px 15px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  `;
  statusIndicator.textContent = 'PARALLEL EXECUTION';
  workflow.appendChild(statusIndicator);

  const agents = [
    { id: '1', name: 'Linguistic', emoji: '🔤', color: '#4CAF50', desc: 'Text Analysis' },
    { id: '2', name: 'Evidence', emoji: '🔍', color: '#2196F3', desc: 'Fact Checking' },
    { id: '3', name: 'Visual', emoji: '👁️', color: '#FF9800', desc: 'Image Integrity' }
  ];

  // Create agent cards with enhanced styling
  agents.forEach((agent, index) => {
    const agentCard = document.createElement('div');
    agentCard.className = 'beautiful-agent-card';
    agentCard.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px 15px;
      background: white;
      border-radius: 16px;
      border: 3px solid ${agent.color};
      min-width: 110px;
      box-shadow: 0 8px 16px rgba(0,0,0,0.1);
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    `;
    
    // Add animated pulse for running state
    agentCard.innerHTML = `
      <div style="position: absolute; top: 5px; right: 5px; width: 12px; height: 12px; border-radius: 50%; background: #4CAF50; box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7); animation: pulse 2s infinite;"></div>
      <div style="font-size: 28px; margin-bottom: 10px;">${agent.emoji}</div>
      <div style="font-size: 16px; font-weight: 700; color: ${agent.color};">Agent ${agent.id}</div>
      <div style="font-size: 12px; color: #666; margin-top: 6px; text-align: center;">${agent.desc}</div>
    `;
    
    workflow.appendChild(agentCard);
    
    // Add arrows between agents
    if (index < agents.length - 1) {
      const arrow = document.createElement('div');
      arrow.style.cssText = `
        color: #666;
        font-size: 24px;
        font-weight: bold;
        margin: 0 10px;
        display: flex;
        align-items: center;
      `;
      arrow.innerHTML = '<div style="width: 30px; height: 2px; background: #666; margin: 0 5px;"></div>';
      workflow.appendChild(arrow);
    }
  });

  // Add synthesis arrow
  const synthesisArrow = document.createElement('div');
  synthesisArrow.style.cssText = `
    display: flex;
    align-items: center;
    margin: 0 15px;
  `;
  synthesisArrow.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center;">
      <div style="width: 2px; height: 20px; background: #666; margin-bottom: 5px;"></div>
      <div style="width: 20px; height: 2px; background: #666;"></div>
      <div style="width: 2px; height: 20px; background: #666; margin-top: 5px;"></div>
    </div>
  `;
  workflow.appendChild(synthesisArrow);

  const agent4Card = document.createElement('div');
  agent4Card.className = 'beautiful-agent-card';
  agent4Card.style.cssText = `
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px 15px;
    background: linear-gradient(135deg, #6f42c1 0%, #5a32a3 100%);
    color: white;
    border-radius: 16px;
    border: 3px solid #6f42c1;
    min-width: 120px;
    box-shadow: 0 12px 24px rgba(111, 66, 193, 0.3);
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  `;

  agent4Card.innerHTML = `
    <div style="position: absolute; top: 5px; right: 5px; width: 12px; height: 12px; border-radius: 50%; background: #4CAF50; box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7); animation: pulse 2s infinite;"></div>
    <div style="font-size: 28px; margin-bottom: 10px;">🎯</div>
    <div style="font-size: 16px; font-weight: 700;">Agent 4</div>
    <div style="font-size: 12px; opacity: 0.9; margin-top: 6px; text-align: center;">Synthesizer</div>
  `;

  workflow.appendChild(agent4Card);

  // Add pulse animation
  const pulseStyle = document.createElement('style');
  pulseStyle.textContent = `
    @keyframes pulse {
      0% {
        box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7);
      }
      70% {
        box-shadow: 0 0 0 10px rgba(76, 175, 80, 0);
      }
      100% {
        box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
      }
    }
  `;
  document.head.appendChild(pulseStyle);

  mainContent.appendChild(workflow);

  // Display results
  if (intermediateResults) {
    // Update workflow visualization with actual results
    const agentCards = workflow.querySelectorAll('.beautiful-agent-card');
    const agentStatuses = [
      intermediateResults.agent1.error ? 'failed' : 'success',
      intermediateResults.agent2.error ? 'failed' : 'success',
      intermediateResults.agent3.error ? 'failed' : 'success'
    ];
    
    // Check if Agent 3 used fallback
    const agent3Fallback = intermediateResults.agent3.fallback === true;
    
    agentCards.forEach((card, index) => {
      // Remove pulse animation
      const pulseDot = card.querySelector('div[style*="animation: pulse"]');
      if (pulseDot) pulseDot.remove();
      
      // Add status indicator
      const statusIndicator = document.createElement('div');
      statusIndicator.style.cssText = `
        position: absolute;
        top: 5px;
        right: 5px;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: ${agentStatuses[index] === 'success' ? '#4CAF50' : '#f44336'};
      `;
      card.appendChild(statusIndicator);
      
      // Add fallback indicator for Agent 3
      if (index === 2 && agent3Fallback) {
        const fallbackIndicator = document.createElement('div');
        fallbackIndicator.style.cssText = `
          position: absolute;
          bottom: 5px;
          right: 5px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #FF9800;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
          color: white;
          font-weight: bold;
        `;
        fallbackIndicator.textContent = 'F';
        fallbackIndicator.title = 'Fallback response used';
        card.appendChild(fallbackIndicator);
      }
    });
    
    // Update Agent 4 card
    const agent4Card = workflow.lastChild;
    if (agent4Card && agent4Card.classList.contains('beautiful-agent-card')) {
      // Remove pulse animation
      const pulseDot = agent4Card.querySelector('div[style*="animation: pulse"]');
      if (pulseDot) pulseDot.remove();
      
      // Add status indicator (assuming success for synthesis)
      const statusIndicator = document.createElement('div');
      statusIndicator.style.cssText = `
        position: absolute;
        top: 5px;
        right: 5px;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #4CAF50;
      `;
      agent4Card.appendChild(statusIndicator);
    }

    // Create agent results section
    const resultsSection = document.createElement('div');
    resultsSection.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    `;

    const agentResults = [
      { 
        name: 'Agent 1 (Linguistic Analysis)', 
        data: intermediateResults.agent1, 
        emoji: '🔤', 
        color: '#4CAF50',
        desc: 'Analyzes text patterns, sentiment, and manipulation indicators'
      },
      { 
        name: 'Agent 2 (Evidence Gathering)', 
        data: intermediateResults.agent2, 
        emoji: '🔍', 
        color: '#2196F3',
        desc: 'Searches and verifies claims against reliable sources'
      },
      { 
        name: 'Agent 3 (Visual Integrity)', 
        data: intermediateResults.agent3, 
        emoji: '👁️', 
        color: '#FF9800',
        desc: 'Detects deepfakes and visual manipulation'
      }
    ];

    agentResults.forEach(agent => {
      const card = document.createElement('div');
      card.className = 'beautiful-result-card';
      card.style.cssText = `
        background: white;
        border-radius: 16px;
        padding: 20px;
        border: 2px solid ${agent.color};
        box-shadow: 0 8px 16px rgba(0,0,0,0.08);
        transition: all 0.3s ease;
      `;

      const isFallback = agent.data.fallback === true;
      const status = agent.data.error ? '❌ FAILED' : (isFallback ? '⚠️ FALLBACK' : '✅ SUCCESS');
      
      card.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 15px;">
          <div style="font-size: 24px;">${agent.emoji}</div>
          <div>
            <h3 style="margin: 0 0 5px 0; font-size: 16px; font-weight: 700; color: ${agent.color};">
              ${agent.name}
            </h3>
            <div style="font-size: 12px; color: #666;">${agent.desc}</div>
          </div>
          <div style="
            margin-left: auto;
            padding: 4px 12px;
            background: ${agent.data.error ? '#ffebee' : (isFallback ? '#fff3e0' : '#e8f5e8')};
            color: ${agent.data.error ? '#c62828' : (isFallback ? '#ef6c00' : '#2e7d32')};
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
          ">
            ${status}
          </div>
        </div>
      `;

      if (agent.data.error) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
          background: #ffebee;
          color: #c62828;
          padding: 15px;
          border-radius: 12px;
          font-size: 13px;
          border-left: 4px solid #f44336;
        `;
        errorDiv.textContent = agent.data.error;
        card.appendChild(errorDiv);
      } else {
        // Extract summary information
        let summary = '';
        let score = '';
        let details = '';
        let deepfakeInfo = '';
        
        try {
          if (agent.data.analysis_results) {
            const results = agent.data.analysis_results;
            if (results.visual_integrity_score !== undefined) {
              score = `Score: ${results.visual_integrity_score}/100`;
            }
            if (results.confidence_level) {
              summary = `Confidence: ${results.confidence_level}`;
            }
            if (results.deepfake !== undefined) {
              deepfakeInfo = `Deepfake Detection: ${results.deepfake}`;
            }
          }
          
          if (agent.data.explanations && agent.data.explanations.summary) {
            details = agent.data.explanations.summary;
          }
        } catch (e) {
          summary = 'Analysis completed successfully';
        }

        const summaryDiv = document.createElement('div');
        summaryDiv.style.cssText = `
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          padding: 15px;
          border-radius: 12px;
          border-left: 4px solid ${agent.color};
        `;
        
        summaryDiv.innerHTML = `
          ${summary ? `<div style="font-weight: 600; margin-bottom: 8px;">${summary}</div>` : ''}
          ${score ? `<div style="font-size: 13px; color: #666; margin-bottom: 8px;">${score}</div>` : ''}
          ${deepfakeInfo ? `<div style="font-size: 13px; color: #666; margin-bottom: 8px;">${deepfakeInfo}</div>` : ''}
          ${details ? `<div style="font-size: 12px; color: #666; line-height: 1.4;">${details}</div>` : ''}
          ${isFallback ? `<div style="font-size: 12px; color: #ef6c00; font-weight: 600; margin-top: 8px;">⚠️ Fallback response used</div>` : ''}
        `;
        
        card.appendChild(summaryDiv);
      }

      resultsSection.appendChild(card);
    });

    mainContent.appendChild(resultsSection);
  }

  // Final synthesis section
  const finalSection = document.createElement('div');
  finalSection.className = 'beautiful-result-card';
  finalSection.style.cssText = `
    background: linear-gradient(135deg, #f0f4ff 0%, #e6eeff 100%);
    border-radius: 16px;
    padding: 25px;
    border: 3px solid #6f42c1;
    box-shadow: 0 12px 24px rgba(111, 66, 193, 0.2);
  `;

  finalSection.innerHTML = `
    <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
      <div style="font-size: 28px;">🎯</div>
      <div>
        <h3 style="margin: 0 0 5px 0; font-size: 18px; font-weight: 700; color: #6f42c1;">
          Final Assessment (Agent 4 - Knowledge Synthesizer)
        </h3>
        <div style="font-size: 13px; color: #666;">
          Comprehensive analysis combining all agent insights
        </div>
      </div>
    </div>
  `;

  const finalContent = document.createElement('div');
  finalContent.style.cssText = `
    background: white;
    padding: 20px;
    border-radius: 12px;
    font-size: 14px;
    line-height: 1.6;
    border: 1px solid #d0daff;
  `;

  if (finalResult && finalResult !== 'No final result available') {
    try {
      const parsedResult = typeof finalResult === 'string' ? JSON.parse(finalResult) : finalResult;
      
      if (parsedResult.verification_summary) {
        const summary = parsedResult.verification_summary;
        finalContent.innerHTML = `
          <div style="margin-bottom: 20px;">
            <div style="font-weight: 700; color: #6f42c1; font-size: 16px; margin-bottom: 10px;">
              ${summary.headline || 'Final Assessment'}
            </div>
            ${summary.overall_score ? `
              <div style="font-size: 14px; margin-bottom: 10px;">
                Overall Score: <strong>${summary.overall_score}/100</strong>
              </div>
            ` : ''}
            ${summary.confidence_indicator ? `
              <div style="background: #e8f5e8; padding: 10px; border-radius: 8px; font-size: 13px; color: #2e7d32;">
                ${summary.confidence_indicator}
              </div>
            ` : ''}
          </div>
        `;
      } else {
        finalContent.innerHTML = `
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #6f42c1;">
            <pre style="margin: 0; font-size: 12px; white-space: pre-wrap;">${JSON.stringify(parsedResult, null, 2)}</pre>
          </div>
        `;
      }
    } catch (e) {
      finalContent.innerHTML = `
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #6f42c1;">
          <pre style="margin: 0; font-size: 12px; white-space: pre-wrap;">${finalResult}</pre>
        </div>
      `;
    }
  } else {
    finalContent.innerHTML = `
      <div style="text-align: center; color: #d32f2f; padding: 20px;">
        <div style="font-size: 48px; margin-bottom: 10px;">⚠️</div>
        <div style="font-weight: 600; font-size: 16px; margin-bottom: 10px;">Final assessment not available</div>
        <div style="font-size: 13px; color: #666;">Agent 4 may have encountered an error during synthesis</div>
      </div>
    `;
  }

  finalSection.appendChild(finalContent);
  mainContent.appendChild(finalSection);

  // Add event listener to close button
  const closeModalButton = header.querySelector('#beautiful-close-modal');
  closeModalButton.addEventListener('click', () => {
    verificationModal.style.animation = 'modalFadeIn 0.3s ease-out reverse';
    setTimeout(() => {
      verificationModal.remove();
      verificationModal = null;
    }, 300);
  });

  // Close modal when clicking outside
  verificationModal.addEventListener('click', (e) => {
    if (e.target === verificationModal) {
      verificationModal.style.animation = 'modalFadeIn 0.3s ease-out reverse';
      setTimeout(() => {
        verificationModal.remove();
        verificationModal = null;
      }, 300);
    }
  });

  modalContent.appendChild(header);
  modalContent.appendChild(mainContent);
  verificationModal.appendChild(modalContent);
  document.body.appendChild(verificationModal);
}

// Validate element for content
function isValidContentElement(element) {
  const text = element.innerText?.trim() || '';
  
  // Must have substantial content
  if (text.length < 20 || text.length > 15000) {
    return false;
  }
  
  // Skip if already processed
  if (element.dataset.beautifulVerifier === 'true') {
    return false;
  }
  
  // Skip navigation, header, footer, and sidebar elements
  const skipSelectors = [
    'nav', 'header', 'footer', 'aside', 
    '.navigation', '.sidebar', '.menu',
    '.advertisement', '.ad', '.promo'
  ];
  
  for (const selector of skipSelectors) {
    if (element.matches(selector) || element.closest(selector)) {
      return false;
    }
  }
  
  // Must be visible
  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
    return false;
  }
  
  return true;
}

// Find and add beautiful verification buttons
function addBeautifulVerificationButtons() {
  let totalProcessed = 0;

  // Try enhanced selectors first
  ENHANCED_SELECTORS.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      if (!processedElements.has(element) && isValidContentElement(element)) {
        createBeautifulVerifyButton(element);
        processedElements.add(element);
        totalProcessed++;
      }
    });
  });

  console.log(`Beautiful Verifier: Processed ${totalProcessed} elements`);
}

// Initialize when page loads
function initBeautifulVerifier() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addBeautifulVerificationButtons);
  } else {
    addBeautifulVerificationButtons();
  }
}

// Handle dynamic content changes
let beautifulObserver = new MutationObserver((mutations) => {
  let shouldUpdate = false;
  
  mutations.forEach(mutation => {
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          ENHANCED_SELECTORS.forEach(selector => {
            if (node.matches && node.matches(selector)) {
              shouldUpdate = true;
            }
            if (node.querySelectorAll && node.querySelectorAll(selector).length > 0) {
              shouldUpdate = true;
            }
          });
        }
      });
    }
  });
  
  if (shouldUpdate) {
    setTimeout(addBeautifulVerificationButtons, 1000);
  }
});

beautifulObserver.observe(document.body, {
  childList: true,
  subtree: true
});

// Start the beautiful verifier
initBeautifulVerifier();

console.log('Beautiful Content Verifier loaded and ready!');