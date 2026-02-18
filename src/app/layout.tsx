import type { Metadata } from 'next'
import Script from 'next/script'
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
  const googleMapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        {googleMapsKey && (
          <Script
            src={`https://maps.googleapis.com/maps/api/js?key=${googleMapsKey}&libraries=places`}
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  )
}
