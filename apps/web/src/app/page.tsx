import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function Landing() {
  return (
    <main className="min-h-screen flex flex-col">
      <header className="px-8 py-4 flex items-center justify-between border-b border-zinc-200 bg-white">
        <div className="font-bold text-lg text-primary">AI Compta</div>
        <div className="flex gap-2">
          <Link href="/login"><Button variant="outline" size="sm">Connexion</Button></Link>
          <Link href="/signup"><Button size="sm">Créer un compte</Button></Link>
        </div>
      </header>
      <section className="flex-1 flex items-center justify-center px-8 py-16">
        <div className="max-w-3xl text-center">
          <h1 className="text-5xl font-bold tracking-tight text-zinc-900 mb-4">
            La comptabilité OHADA, <span className="text-primary">automatisée par l&apos;IA</span>.
          </h1>
          <p className="text-lg text-zinc-600 mb-8">
            Importez vos factures, AI Compta extrait les données, génère vos écritures SYSCOHADA
            et produit vos états financiers en temps réel.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/signup"><Button size="lg">Démarrer gratuitement</Button></Link>
            <Link href="/login"><Button size="lg" variant="outline">Se connecter</Button></Link>
          </div>
        </div>
      </section>
    </main>
  );
}
