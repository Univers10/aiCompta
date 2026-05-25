'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ReportTable, MoneyCell } from '@/components/reports/ReportTable';
import { formatXOF } from '@/lib/utils/currency';
import { startOfMonthIso, todayIso } from '@/lib/utils/date';
import type { PnLReport } from '@aicompta/types';

export default function PnlPage() {
  const [dateFrom, setDateFrom] = useState(startOfMonthIso());
  const [dateTo, setDateTo] = useState(todayIso());
  const [report, setReport] = useState<PnLReport | null>(null);

  useEffect(() => {
    void api
      .get<{ data: PnLReport }>(`/reports/pnl?dateFrom=${dateFrom}&dateTo=${dateTo}`)
      .then((r) => setReport(r.data))
      .catch(() => setReport(null));
  }, [dateFrom, dateTo]);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-4">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Compte de résultat</h1>
        </div>
        <div className="flex items-end gap-2">
          <div>
            <label className="text-xs text-zinc-500 block mb-1">Du</label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-zinc-500 block mb-1">Au</label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
        </div>
      </header>

      {report && (
        <>
          {report.charges.map((s, i) => (
            <Card key={`c-${i}`}>
              <CardHeader><CardTitle>{s.label} (classe {s.accountClass})</CardTitle></CardHeader>
              <CardContent className="p-0">
                <ReportTable
                  columns={[
                    { header: 'Code', key: 'code' },
                    { header: 'Libellé', key: 'label' },
                    { header: 'Solde', key: 'solde', align: 'right', format: MoneyCell },
                  ]}
                  rows={s.rows}
                />
                <div className="p-3 border-t bg-zinc-50 text-sm text-right">
                  Total : <strong>{formatXOF(s.total)}</strong>
                </div>
              </CardContent>
            </Card>
          ))}
          {report.produits.map((s, i) => (
            <Card key={`p-${i}`}>
              <CardHeader><CardTitle>{s.label} (classe {s.accountClass})</CardTitle></CardHeader>
              <CardContent className="p-0">
                <ReportTable
                  columns={[
                    { header: 'Code', key: 'code' },
                    { header: 'Libellé', key: 'label' },
                    { header: 'Solde', key: 'solde', align: 'right', format: MoneyCell },
                  ]}
                  rows={s.rows}
                />
                <div className="p-3 border-t bg-zinc-50 text-sm text-right">
                  Total : <strong>{formatXOF(s.total)}</strong>
                </div>
              </CardContent>
            </Card>
          ))}
          <Card>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Résultat d&apos;exploitation</span>
                <strong>{formatXOF(report.resultatExploitation)}</strong>
              </div>
              <div className="flex justify-between text-sm">
                <span>Charges financières</span>
                <span>{formatXOF(report.chargesFinancieres)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Produits financiers</span>
                <span>{formatXOF(report.produitsFinanciers)}</span>
              </div>
              <div className="flex justify-between text-lg pt-2 border-t border-zinc-200">
                <span className="font-bold">Résultat net</span>
                <strong className={parseFloat(report.resultatNet) < 0 ? 'text-destructive' : 'text-success'}>
                  {formatXOF(report.resultatNet)}
                </strong>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
