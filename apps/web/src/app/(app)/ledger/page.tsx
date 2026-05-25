'use client';

import { useState } from 'react';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ReportTable, MoneyCell } from '@/components/reports/ReportTable';
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
          <CardContent className="p-0">
            <div className="px-5 py-2 bg-zinc-50 border-b text-sm">
              Solde initial : <strong>{formatXOF(report.soldeInitial)}</strong>
            </div>
            <ReportTable
              columns={[
                { header: 'Date', key: 'date', format: (v) => formatDate(v as string) },
                { header: 'Pièce', key: 'reference' },
                { header: 'Libellé', key: 'description' },
                { header: 'Débit', key: 'debit', align: 'right', format: MoneyCell },
                { header: 'Crédit', key: 'credit', align: 'right', format: MoneyCell },
                { header: 'Solde', key: 'solde', align: 'right', format: MoneyCell },
              ]}
              rows={report.moves}
            />
            <div className="px-5 py-3 border-t bg-zinc-50 text-sm flex justify-between">
              <span>Total Débit : <strong>{formatXOF(report.totalDebit)}</strong> · Total Crédit : <strong>{formatXOF(report.totalCredit)}</strong></span>
              <span>Solde final : <strong>{formatXOF(report.soldeFinal)}</strong></span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
