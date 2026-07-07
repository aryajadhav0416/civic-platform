import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Smart Bharat - Civic Platform',
  description: 'AI-Powered Civic Companion',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <div className="app-wrapper">
          {children}
        </div>
      </body>
    </html>
  )
}
