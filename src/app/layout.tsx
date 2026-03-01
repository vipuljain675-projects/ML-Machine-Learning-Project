import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Geopolitical Risk Monitor',
  description: 'ML-powered conflict risk forecasting 2025-2040',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  )
}