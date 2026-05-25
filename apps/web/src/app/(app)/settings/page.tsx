'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

interface Org {
  id: string;
  name: string;
  slug: string;
  fiscalYear?: { name: string; startDate: string; endDate: string; isClosed: boolean } | null;
}

export default function SettingsPage() {
  const [org, setOrg] = useState<Org | null>(null);

  useEffect(() => {
    void api.get<{ data: Org }>('/settings/organization').then((r) => setOrg(r.data));
  }, []);

  if (!org) return <div className="p-6 text-zinc-500">Chargement…</div>;

  const inboxEmail = `${org.slug}@inbox.aicompta.app`;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Paramètres de l&apos;organisation</h1>
      <Card>
        <CardHeader><CardTitle>Informations</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div><strong>Nom :</strong> {org.name}</div>
          <div><strong>Slug :</strong> {org.slug}</div>
          <div>
            <strong>Email d&apos;import :</strong>{' '}
            <code className="bg-zinc-100 px-2 py-0.5 rounded">{inboxEmail}</code>
            <button
              onClick={() => navigator.clipboard.writeText(inboxEmail)}
              className="ml-2 text-primary text-xs hover:underline"
            >
              Copier
            </button>
          </div>
        </CardContent>
      </Card>
      {org.fiscalYear && (
        <Card>
          <CardHeader><CardTitle>Exercice fiscal en cours</CardTitle></CardHeader>
          <CardContent className="text-sm">
            <p><strong>{org.fiscalYear.name}</strong></p>
            <p className="text-zinc-500">
              du {new Date(org.fiscalYear.startDate).toLocaleDateString('fr-FR')} au{' '}
              {new Date(org.fiscalYear.endDate).toLocaleDateString('fr-FR')}
            </p>
            <p className="text-zinc-500 mt-1">
              Statut : {org.fiscalYear.isClosed ? 'Clôturé' : 'Ouvert'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
