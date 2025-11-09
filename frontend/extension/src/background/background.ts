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

// Handle extension icon click
chrome.action.onClicked.addListener((tab: chrome.tabs.Tab) => {
  if (tab.id) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js'],
    })
  }
})
