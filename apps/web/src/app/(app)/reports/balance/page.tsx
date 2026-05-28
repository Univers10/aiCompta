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
              <div className="mt-4 space-y-2">
                <div className="p-3 border border-zinc-200 bg-zinc-50 rounded-lg text-sm">
                  <div className="font-semibold mb-2">Vérifications SYSCOHADA :</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-zinc-500">Vérification 1 : Mouvements</div>
                      <div className="flex justify-between mt-1">
                        <span>Total Débit :</span>
                        <strong>{formatXOF(report.totalDebit)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Crédit :</span>
                        <strong>{formatXOF(report.totalCredit)}</strong>
                      </div>
                      {report.totalDebit === report.totalCredit && (
                        <div className="text-success text-xs mt-1">✓ Équilibre des mouvements</div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-zinc-500">Vérification 2 : Soldes</div>
                      <div className="flex justify-between mt-1">
                        <span>Total Soldes Débiteurs :</span>
                        <strong>{report.totalSoldeDebiteur ? formatXOF(report.totalSoldeDebiteur) : '—'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Soldes Créditeurs :</span>
                        <strong>{report.totalSoldeCrediteur ? formatXOF(report.totalSoldeCrediteur) : '—'}</strong>
                      </div>
                      {report.totalSoldeDebiteur && report.totalSoldeCrediteur && report.totalSoldeDebiteur === report.totalSoldeCrediteur && (
                        <div className="text-success text-xs mt-1">✓ Équilibre des soldes</div>
                      )}
                    </div>
                  </div>
                </div>
                {report.isBalanced === true && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                    <span className="text-success font-semibold text-sm">
                      ✓ Balance conforme SYSCOHADA (Débit = Crédit et SD = SC)
                    </span>
                  </div>
                )}
                {report.isBalanced === false && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-center">
                    <span className="text-destructive font-semibold text-sm">
                      ⚠ Balance non équilibrée - Vérifier les écritures
                    </span>
                  </div>
                )}
                {report.isBalanced === undefined && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                    <span className="text-yellow-700 font-semibold text-sm">
                      ℹ Redémarrez l'API pour activer les vérifications SYSCOHADA
                    </span>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
