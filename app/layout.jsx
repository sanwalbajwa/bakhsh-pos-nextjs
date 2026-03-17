import './globals.css'
import ClientProviders from '@/components/ClientProviders'

export const metadata = {
  title: 'Bakhsh POS - Healthcare Management System',
  description: 'Healthcare Point of Sale System for Bakhsh Healthcare Center',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  )
}