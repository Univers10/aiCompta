'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SignupSchema, type SignupInput } from '@aicompta/validators';
import { api, ApiClientError } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/context';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export default function SignupPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignupInput>({
    resolver: zodResolver(SignupSchema),
  });

  const onSubmit = async (data: SignupInput): Promise<void> => {
    setError(null);
    try {
      await api.post('/auth/signup', data);
      // Rafraîchir l'auth avant de rediriger
      await refresh();
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof ApiClientError ? err.payload.message : 'Erreur réseau');
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-primary">AI Compta</h1>
          <p className="text-zinc-600 mt-1">Créer votre organisation</p>
        </div>
        <Card>
          <CardHeader><CardTitle>Inscription</CardTitle></CardHeader>
          <CardContent>
            {submitted ? (
              <div className="text-center py-6">
                <div className="text-success text-4xl mb-2">✓</div>
                <p className="font-medium">Compte créé !</p>
                <p className="text-sm text-zinc-600 mt-1">Vérifiez votre email pour confirmer.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="organizationName">Nom de l&apos;organisation</Label>
                  <Input id="organizationName" {...register('organizationName')} />
                  {errors.organizationName && (
                    <p className="text-destructive text-xs mt-1">{errors.organizationName.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" autoComplete="email" {...register('email')} />
                  {errors.email && (
                    <p className="text-destructive text-xs mt-1">{errors.email.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input id="password" type="password" autoComplete="new-password" {...register('password')} />
                  {errors.password && (
                    <p className="text-destructive text-xs mt-1">{errors.password.message}</p>
                  )}
                </div>
                {error && <p className="text-destructive text-sm">{error}</p>}
                <Button type="submit" className="w-full" loading={isSubmitting}>
                  Créer mon organisation
                </Button>
                <p className="text-sm text-zinc-500 text-center">
                  Déjà inscrit ?{' '}
                  <a href="/login" className="text-primary font-medium hover:underline">Se connecter</a>
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
