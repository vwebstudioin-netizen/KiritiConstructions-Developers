import type { Metadata } from 'next'
import { Montserrat, Inter } from 'next/font/google'
import './globals.css'

const montserrat = Montserrat({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-montserrat', display: 'swap' })
const inter = Inter({ subsets: ['latin'], weight: ['300', '400', '500', '600'], variable: '--font-inter', display: 'swap' })

export const metadata: Metadata = {
  title: { default: 'Kiriti Constructions & Developers Pvt. Ltd.', template: '%s | Kiriti Constructions & Developers' },
  description: 'Kiriti Constructions & Developers Pvt. Ltd. — trusted builders and infrastructure contractors delivering quality residential, commercial, and civil projects on time and within budget.',
  keywords: ['Kiriti Constructions & Developers', 'builders', 'contractors', 'construction', 'infrastructure', 'renovation', 'civil works'],
  openGraph: { siteName: 'Kiriti Constructions & Developers Pvt. Ltd.', type: 'website', locale: 'en_IN' },
  manifest: '/manifest.json',
  themeColor: '#1A3C5E',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Kiriti CD' },
  viewport: { width: 'device-width', initialScale: 1, maximumScale: 1 },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${montserrat.variable} ${inter.variable}`}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>{children}</body>
    </html>
  )
}
