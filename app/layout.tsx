import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RUST Lens Calculator - Web Version',
  description: 'Professional optical lens calculation tool',
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
      </head>
      <body className="bg-slate-900 text-white antialiased">
        <nav className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
            <h1 className="text-xl font-bold text-amber-400">🔬 RUST Lens Calculator</h1>
            <div className="flex gap-4">
              <a href="/" className="text-slate-300 hover:text-white transition">Inicio</a>
              <a href="/calculator" className="text-slate-300 hover:text-white transition">Calculadora</a>
              <a href="#docs" className="text-slate-300 hover:text-white transition">Docs</a>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
