import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'VendRadar — Location Intelligence for Vending Operators',
  description: 'AI-powered location scouting for vending machine operators. Find the best spots with real-time data.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}