'use client';

import { useState } from 'react';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/ui/DataTable';
import { formatXOF } from '@/lib/utils/currency';
import { startOfMonthIso, todayIso, formatDate } from '@/lib/utils/date';
import type { GeneralLedgerReport } from '@aicompta/types';

export default function LedgerPage() {
  const [accountCode, setAccountCode] = useState('601');
  const [dateFrom, setDateFrom] = useState(startOfMonthIso());
  const [dateTo, setDateTo] = useState(todayIso());
  const [report, setReport] = useState<GeneralLedgerReport | null>(null);

  const load = async (): Promise<void> => {
    const res = await api.get<{ data: GeneralLedgerReport }>(
      `/reports/general-ledger?accountCode=${encodeURIComponent(accountCode)}&dateFrom=${dateFrom}&dateTo=${dateTo}`,
    ).catch(() => null);
    if (res) setReport(res.data);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-4">
      <header>
        <h1 className="text-2xl font-bold">Grand livre</h1>
      </header>

      <Card>
        <CardContent>
          <div className="flex items-end gap-2 flex-wrap">
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Compte</label>
              <Input value={accountCode} onChange={(e) => setAccountCode(e.target.value)} className="w-32" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Du</label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Au</label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            <Button onClick={() => void load()}>Afficher</Button>
          </div>
        </CardContent>
      </Card>

      {report && (
        <Card>
          <CardHeader>
            <CardTitle>{report.accountCode} — {report.accountLabel}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm flex justify-between items-center">
              <span>Solde initial : <strong className="text-blue-700">{formatXOF(report.soldeInitial)}</strong></span>
              <span>Solde final : <strong className="text-blue-700">{formatXOF(report.soldeFinal)}</strong></span>
            </div>
            
            <DataTable
              data={report.moves}
              columns={[
                {
                  key: 'date',
                  header: 'Date',
                  accessor: (m) => m.date,
                  render: (val) => formatDate(val),
                  width: '120px',
                },
                {
                  key: 'reference',
                  header: 'Référence',
                  accessor: (m) => m.reference || '—',
                  width: '140px',
                },
                {
                  key: 'description',
                  header: 'Libellé',
                  accessor: (m) => m.description,
                },
                {
                  key: 'debit',
                  header: 'Débit',
                  accessor: (m) => m.debit,
                  render: (val) => val ? formatXOF(val) : '—',
                  align: 'right',
                  width: '130px',
                },
                {
                  key: 'credit',
                  header: 'Crédit',
                  accessor: (m) => m.credit,
                  render: (val) => val ? formatXOF(val) : '—',
                  align: 'right',
                  width: '130px',
                },
                {
                  key: 'solde',
                  header: 'Solde',
                  accessor: (m) => m.solde,
                  render: (val) => <span className="font-medium">{formatXOF(val)}</span>,
                  align: 'right',
                  width: '140px',
                },
              ]}
              searchPlaceholder="Rechercher dans le grand livre..."
              emptyMessage="Aucun mouvement"
              pageSize={25}
            />
            
            <div className="mt-4 p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm flex justify-between">
              <span>Total Débit : <strong>{formatXOF(report.totalDebit)}</strong></span>
              <span>Total Crédit : <strong>{formatXOF(report.totalCredit)}</strong></span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
