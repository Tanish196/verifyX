import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import Popup from './Popup'

// Mount the Popup component to the DOM
const rootElement = document.getElementById('root')
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <Popup />
    </StrictMode>
  )
}
