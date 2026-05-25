'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api, ApiClientError } from '@/lib/api/client';

function VerifyInner() {
  const params = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('Connexion en cours…');

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Lien invalide');
      return;
    }
    (async () => {
      try {
        await api.get(`/auth/verify?token=${encodeURIComponent(token)}`);
        setStatus('success');
        router.push('/dashboard');
      } catch (err) {
        setStatus('error');
        setMessage(err instanceof ApiClientError ? err.payload.message : 'Erreur');
      }
    })();
  }, [params, router]);

  return (
    <div className="text-center">
      <div className="mb-4 text-3xl">{status === 'loading' ? '⏳' : status === 'success' ? '✅' : '❌'}</div>
      <p className="text-zinc-700">{message}</p>
      {status === 'error' && (
        <a href="/login" className="text-primary hover:underline text-sm mt-3 inline-block">
          Demander un nouveau lien
        </a>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <Suspense fallback={<div>Chargement…</div>}>
        <VerifyInner />
      </Suspense>
    </main>
  );
}
