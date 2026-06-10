import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Mythic Quest — RPG de Hábitos Mitológicos',
  description: 'Forja tu héroe en el Olimpo. Cumple hábitos reales, sube de nivel y desbloquea la historia de tu héroe en este RPG narrativo de mitología griega.',
  keywords: ['mitología griega', 'hábitos', 'productividad', 'RPG', 'gamificación'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="parch-bg min-h-screen">
        {children}
      </body>
    </html>
  )
}
