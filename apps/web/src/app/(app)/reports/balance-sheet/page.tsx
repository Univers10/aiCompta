'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { DataTable } from '@/components/ui/DataTable';
import { formatXOF } from '@/lib/utils/currency';
import { todayIso } from '@/lib/utils/date';
import type { BalanceSheetReport } from '@aicompta/types';

export default function BalanceSheetPage() {
  const [date, setDate] = useState(todayIso());
  const [report, setReport] = useState<BalanceSheetReport | null>(null);

  useEffect(() => {
    void api
      .get<{ data: BalanceSheetReport }>(`/reports/balance-sheet?date=${date}`)
      .then((r) => setReport(r.data))
      .catch(() => setReport(null));
  }, [date]);

  const balanced = report && parseFloat(report.totalActif) === parseFloat(report.totalPassif);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-4">
      <header className="flex items-end justify-between gap-4">
        <h1 className="text-2xl font-bold">Bilan</h1>
        <div>
          <label className="text-xs text-zinc-500 block mb-1">Au</label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </header>

      {report && (
        <>
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle>Actif</CardTitle></CardHeader>
              <CardContent className="p-6">
                <DataTable
                  data={report.actif}
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
                      key: 'solde',
                      header: 'Montant',
                      accessor: (r) => r.solde,
                      render: (val) => <span className="font-medium">{formatXOF(val)}</span>,
                      align: 'right',
                      width: '140px',
                    },
                  ]}
                  searchPlaceholder="Rechercher..."
                  emptyMessage="Aucun compte"
                  pageSize={15}
                />
                <div className="mt-4 p-3 border border-zinc-200 bg-blue-50 rounded-lg text-sm text-right">
                  Total Actif : <strong className="text-blue-700">{formatXOF(report.totalActif)}</strong>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Passif</CardTitle></CardHeader>
              <CardContent className="p-6">
                <DataTable
                  data={report.passif}
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
                      key: 'solde',
                      header: 'Montant',
                      accessor: (r) => r.solde,
                      render: (val) => <span className="font-medium">{formatXOF(val)}</span>,
                      align: 'right',
                      width: '140px',
                    },
                  ]}
                  searchPlaceholder="Rechercher..."
                  emptyMessage="Aucun compte"
                  pageSize={15}
                />
                <div className="mt-4 p-3 border border-zinc-200 bg-green-50 rounded-lg text-sm text-right">
                  Total Passif : <strong className="text-green-700">{formatXOF(report.totalPassif)}</strong>
                </div>
              </CardContent>
            </Card>
          </div>
          {balanced && (
            <div className="text-success text-sm text-center">✓ Bilan équilibré (Actif = Passif)</div>
          )}
        </>
      )}
    </div>
  );
}
