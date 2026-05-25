'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginSchema, type LoginInput } from '@aicompta/validators';
import { api, ApiClientError } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/context';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(LoginSchema) });

  const onSubmit = async (data: LoginInput): Promise<void> => {
    setError(null);
    try {
      await api.post('/auth/login', data);
      // Rafraîchir l'auth avant de rediriger
      await refresh();
      router.push('/dashboard');
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.payload.message : 'Erreur réseau';
      setError(msg);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-primary">AI Compta</h1>
          <p className="text-zinc-600 mt-1">Connexion à votre compte</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Connexion</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" autoComplete="email" {...register('email')} />
                  {errors.email && (
                    <p className="text-destructive text-xs mt-1">{errors.email.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input id="password" type="password" autoComplete="current-password" {...register('password')} />
                  {errors.password && (
                    <p className="text-destructive text-xs mt-1">{errors.password.message}</p>
                  )}
                </div>
                {error && <p className="text-destructive text-sm">{error}</p>}
                <Button type="submit" className="w-full" loading={isSubmitting}>
                  Se connecter
                </Button>
                <p className="text-sm text-zinc-500 text-center">
                  Pas de compte ?{' '}
                  <a href="/signup" className="text-primary font-medium hover:underline">
                    Créer une organisation
                  </a>
                </p>
              </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
