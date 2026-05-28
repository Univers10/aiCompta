'use client';

import { useState } from 'react';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { AccordionItem } from '@/components/ui/Accordion';
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
            <div>
              {(() => {
                const grouped = report.moves.reduce((acc, move) => {
                  const ref = move.reference || 'Sans référence';
                  if (!acc[ref]) acc[ref] = [];
                  acc[ref].push(move);
                  return acc;
                }, {} as Record<string, typeof report.moves>);

                return Object.entries(grouped).map(([ref, moves]) => {
                  const totalDebit = moves.reduce((sum, m) => sum + parseFloat(m.debit || '0'), 0);
                  const totalCredit = moves.reduce((sum, m) => sum + parseFloat(m.credit || '0'), 0);
                  const firstMove = moves[0];
                  
                  return (
                    <AccordionItem
                      key={ref}
                      title={
                        <div className="flex justify-between items-baseline w-full">
                          <div>
                            <span className="font-semibold">{ref}</span>
                            <span className="ml-3 text-sm text-zinc-600">{firstMove.description}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-zinc-500">{formatDate(firstMove.date)}</span>
                            <span className="text-sm font-medium">{formatXOF(Math.abs(totalDebit - totalCredit))}</span>
                          </div>
                        </div>
                      }
                    >
                      <table className="w-full text-sm mt-2">
                        <thead>
                          <tr className="border-b border-zinc-200 text-xs text-zinc-500">
                            <th className="py-2 text-left">Date</th>
                            <th className="py-2 text-left">Libellé</th>
                            <th className="py-2 text-right">Débit</th>
                            <th className="py-2 text-right">Crédit</th>
                            <th className="py-2 text-right">Solde</th>
                          </tr>
                        </thead>
                        <tbody>
                          {moves.map((move, idx) => (
                            <tr key={idx} className="border-b border-zinc-100">
                              <td className="py-2 text-zinc-500">{formatDate(move.date)}</td>
                              <td className="py-2">{move.description}</td>
                              <td className="py-2 text-right tabular-nums">
                                {move.debit ? formatXOF(move.debit) : '—'}
                              </td>
                              <td className="py-2 text-right tabular-nums">
                                {move.credit ? formatXOF(move.credit) : '—'}
                              </td>
                              <td className="py-2 text-right tabular-nums font-medium">
                                {formatXOF(move.solde)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="font-medium bg-zinc-50">
                            <td colSpan={2} className="py-2 text-right">Total :</td>
                            <td className="py-2 text-right tabular-nums">{formatXOF(totalDebit)}</td>
                            <td className="py-2 text-right tabular-nums">{formatXOF(totalCredit)}</td>
                            <td className="py-2 text-right tabular-nums">{formatXOF(Math.abs(totalDebit - totalCredit))}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </AccordionItem>
                  );
                });
              })()}
            </div>
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
