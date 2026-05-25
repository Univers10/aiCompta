'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatXOF } from '@/lib/utils/currency';
import { startOfMonthIso, todayIso } from '@/lib/utils/date';
import type { PnLReport, BalanceReport } from '@aicompta/types';

interface ApiData<T> { data: T }

export default function DashboardPage() {
  const [pnl, setPnl] = useState<PnLReport | null>(null);
  const [balance, setBalance] = useState<BalanceReport | null>(null);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    const load = async (): Promise<void> => {
      const [p, b, d] = await Promise.all([
        api.get<ApiData<PnLReport>>(`/reports/pnl?dateFrom=${startOfMonthIso()}&dateTo=${todayIso()}`).catch(() => null),
        api.get<ApiData<BalanceReport>>(`/reports/balance?date=${todayIso()}`).catch(() => null),
        api.get<{ pagination: { total: number } }>('/documents?status=NEEDS_REVIEW&limit=1').catch(() => null),
      ]);
      if (p) setPnl(p.data);
      if (b) setBalance(b.data);
      if (d) setReviewCount(d.pagination.total);
    };
    void load();
    const id = setInterval(() => void load(), 60_000);
    return () => clearInterval(id);
  }, []);

  const tresorerie = balance?.rows
    .filter((r) => r.code.startsWith('52') || r.code.startsWith('57'))
    .reduce((acc, r) => acc + parseFloat(r.solde), 0) ?? 0;

  const ca = pnl ? parseFloat(pnl.produits[0]?.total ?? '0') : 0;
  const charges = pnl ? parseFloat(pnl.charges[0]?.total ?? '0') : 0;
  const marge = ca - charges;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {reviewCount > 0 && (
        <div className="bg-orange-50 border border-orange-200 text-orange-900 rounded-md px-4 py-3 flex items-center justify-between">
          <div>
            <strong>{reviewCount}</strong> pièce(s) nécessite(nt) votre attention.
          </div>
          <a href="/inbox" className="text-sm font-medium underline">Voir l&apos;Inbox</a>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Trésorerie disponible" value={formatXOF(tresorerie)} />
        <KPICard title="CA du mois" value={formatXOF(ca)} accent />
        <KPICard title="Charges du mois" value={formatXOF(charges)} />
        <KPICard title="Marge brute" value={formatXOF(marge)} positive={marge >= 0} />
      </div>

      {pnl && (
        <Card>
          <CardHeader><CardTitle>Compte de résultat — mois en cours</CardTitle></CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-zinc-500">Résultat d&apos;exploitation</dt>
                <dd className="text-lg font-semibold mt-0.5">{formatXOF(pnl.resultatExploitation)}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Résultat net</dt>
                <dd className="text-lg font-semibold mt-0.5">{formatXOF(pnl.resultatNet)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function KPICard({ title, value, accent, positive }: { title: string; value: string; accent?: boolean; positive?: boolean }) {
  return (
    <Card>
      <CardContent>
        <div className="text-xs uppercase text-zinc-500 font-medium">{title}</div>
        <div
          className={`text-xl font-bold mt-1 ${
            accent ? 'text-primary' : positive === false ? 'text-destructive' : 'text-zinc-900'
          }`}
        >
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
