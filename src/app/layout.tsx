import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Smart Bharat - Civic Platform',
  description: 'AI-Powered Civic Companion for Indian Citizens',
  keywords: 'civic, platform, india, smart bharat, government schemes, report issues',
  viewport: 'width=device-width, initial-scale=1'
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
