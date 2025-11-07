import React from 'react'

export default function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="error-banner" role="alert">
      <strong>Error:</strong> {message}
    </div>
  )
}
