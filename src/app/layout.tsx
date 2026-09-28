import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PARTANTS DONNÉES WAGUE - Direct Turf',
  description: 'Partants, cotes et pronostics en direct données wague pour les courses hippiques PMU.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body className="bg-[#021c13] text-slate-100 antialiased selection:bg-amber-400 selection:text-black">
        {children}
      </body>
    </html>
  );
}
