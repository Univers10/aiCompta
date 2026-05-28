'use client';

import { useEffect, useState } from 'react';
import { api, API_BASE_URL } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DataTable } from '@/components/ui/DataTable';
import { formatXOF } from '@/lib/utils/currency';
import { todayIso } from '@/lib/utils/date';
import type { BalanceReport } from '@aicompta/types';

export default function BalancePage() {
  const [date, setDate] = useState(todayIso());
  const [report, setReport] = useState<BalanceReport | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async (d: string): Promise<void> => {
    setLoading(true);
    try {
      const res = await api.get<{ data: BalanceReport }>(`/reports/balance?date=${d}`);
      setReport(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(date); }, [date]);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-4">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Balance</h1>
          <p className="text-zinc-500 text-sm">Soldes par compte à une date donnée</p>
        </div>
        <div className="flex items-end gap-2">
          <div>
            <label className="text-xs text-zinc-500 block mb-1">Date</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <a href={`${API_BASE_URL}/api/v1/reports/balance?date=${date}&format=xlsx`}>
            <Button variant="outline">Export XLSX</Button>
          </a>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Au {new Date(date).toLocaleDateString('fr-FR')}</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="py-8 text-center text-zinc-500">Chargement…</div>
          ) : report ? (
            <>
              <DataTable
                data={report.rows}
                columns={[
                  {
                    key: 'code',
                    header: 'Code',
                    accessor: (r) => r.code,
                    render: (val) => <span className="font-mono text-xs">{val}</span>,
                    width: '100px',
                  },
                  {
                    key: 'label',
                    header: 'Libellé',
                    accessor: (r) => r.label,
                  },
                  {
                    key: 'totalDebit',
                    header: 'Débit',
                    accessor: (r) => r.totalDebit,
                    render: (val) => val ? formatXOF(val) : '—',
                    align: 'right',
                    width: '140px',
                  },
                  {
                    key: 'totalCredit',
                    header: 'Crédit',
                    accessor: (r) => r.totalCredit,
                    render: (val) => val ? formatXOF(val) : '—',
                    align: 'right',
                    width: '140px',
                  },
                  {
                    key: 'solde',
                    header: 'Solde',
                    accessor: (r) => r.solde,
                    render: (val) => <span className="font-medium">{formatXOF(val)}</span>,
                    align: 'right',
                    width: '140px',
                  },
                ]}
                searchPlaceholder="Rechercher un compte..."
                emptyMessage="Aucun compte"
                pageSize={30}
              />
              <div className="mt-4 p-3 border border-zinc-200 bg-zinc-50 rounded-lg text-sm flex justify-end gap-6">
                <span>Total Débit : <strong>{formatXOF(report.totalDebit)}</strong></span>
                <span>Total Crédit : <strong>{formatXOF(report.totalCredit)}</strong></span>
                {report.totalDebit === report.totalCredit && (
                  <span className="text-success font-medium">✓ Équilibrée</span>
                )}
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
