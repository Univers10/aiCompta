'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

interface Account { id: string; code: string; label: string; type: string; parentCode: string | null; isSystem: boolean }

export default function ChartOfAccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    void api.get<{ data: Account[] }>('/settings/chart-of-accounts').then((r) => setAccounts(r.data));
  }, []);

  const filtered = accounts.filter((a) =>
    !filter || a.code.includes(filter) || a.label.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Plan comptable SYSCOHADA</h1>
      <Input placeholder="Rechercher par code ou libellé…" value={filter} onChange={(e) => setFilter(e.target.value)} />
      <Card>
        <CardHeader><CardTitle>{filtered.length} comptes</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50">
              <tr className="border-b border-zinc-200">
                <th className="text-left px-3 py-2 font-medium">Code</th>
                <th className="text-left px-3 py-2 font-medium">Libellé</th>
                <th className="text-left px-3 py-2 font-medium">Type</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                  <td className="px-3 py-2 font-mono">{a.code}</td>
                  <td className="px-3 py-2">{a.label}</td>
                  <td className="px-3 py-2 text-xs text-zinc-500">{a.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
