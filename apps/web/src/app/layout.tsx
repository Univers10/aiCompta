import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/auth/context';

export const metadata: Metadata = {
  title: 'AI Compta — Comptabilité automatisée SYSCOHADA',
  description: 'Automatisez votre comptabilité OHADA avec l\'intelligence artificielle.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
