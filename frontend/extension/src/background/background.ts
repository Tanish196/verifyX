// Background service worker for VerifyX Chrome Extension

/// <reference types="chrome"/>

chrome.runtime.onInstalled.addListener(() => {
  console.log('VerifyX extension installed')
})

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message: { type: string; data?: any }, _sender, sendResponse: (response: any) => void) => {
  if (message.type === 'VERIFY_CONTENT') {
    // Handle verification requests
    console.log('Verification request received:', message.data)
    sendResponse({ status: 'processing' })
  }
  
  return true // Keep message channel open for async response
})

// Note: we intentionally do not handle `chrome.action.onClicked` here because
// the extension defines a `default_popup` in the manifest. That listener
// will never fire when a popup is configured. If on-demand content script
// injection is required, perform it from the popup UI using
// `chrome.scripting.executeScript` after user interaction.