// Content script for VerifyX Chrome Extension
// Injected into web pages to extract content for verification

/// <reference types="chrome"/>

console.log('VerifyX content script loaded')

// Extract page content
export function extractPageContent() {
  const text = document.body.innerText
  const images = Array.from(document.images).map(img => ({
    src: img.src,
    alt: img.alt,
  }))
  
  return {
    text: text.slice(0, 5000), // Limit to 5000 characters
    images: images.slice(0, 10), // Limit to 10 images
    url: window.location.href,
    title: document.title,
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message: { type: string }, _sender, sendResponse: (response: any) => void) => {
  if (message.type === 'GET_PAGE_CONTENT') {
    const content = extractPageContent()
    sendResponse(content)
  }
  
  return true
})

// Highlight suspicious content (future feature)
export function highlightSuspiciousContent(selectors: string[]) {
  selectors.forEach(selector => {
    const elements = document.querySelectorAll(selector)
    elements.forEach(el => {
      const element = el as HTMLElement
      element.style.backgroundColor = 'rgba(255, 0, 0, 0.2)'
      element.style.border = '2px solid red'
    })
  })
}
