// app/layout.tsx

import './globals.css'
import Header from '../components/Header'
import Providers from '../components/Providers'
import Footer from '../components/Footer'

export const metadata = {
  title: 'G&T Lands',
  description: 'App de controle de propriedades',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-black text-white flex flex-col min-h-screen">
        <Providers>
          <Header />
          <main className="flex-1 bg-[#1F1F1F] px-4 py-6">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
