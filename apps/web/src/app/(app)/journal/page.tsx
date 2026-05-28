'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { AccordionItem } from '@/components/ui/Accordion';
import { formatXOF } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date';
import type { JournalEntry, JournalLine, PaginatedResponse } from '@aicompta/types';

type Entry = JournalEntry & { lines: JournalLine[] };

export default function JournalPage() {
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => {
    void api.get<PaginatedResponse<Entry>>('/journal-entries?limit=50').then((r) => setEntries(r.data));
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Journal général</h1>
      <Card>
        <CardHeader><CardTitle>Écritures récentes</CardTitle></CardHeader>
        <CardContent className="p-0">
          {entries.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-sm">Aucune écriture</div>
          ) : (
            <div>
              {entries.map((e) => {
                const debit = e.lines.filter((l) => l.lineType === 'DEBIT').reduce((a, l) => a + parseFloat(l.amountXof), 0);
                return (
                  <AccordionItem
                    key={e.id}
                    title={
                      <div className="flex justify-between items-baseline w-full">
                        <div>
                          <span className="font-semibold">{e.reference}</span>
                          <span className="ml-2 text-xs uppercase bg-zinc-100 px-1.5 py-0.5 rounded">{e.journal}</span>
                          {e.isReversal && <span className="ml-2 text-xs text-orange-600">Contre-passation</span>}
                          <span className="ml-3 text-sm text-zinc-600">{e.description}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-zinc-500">{formatDate(e.date)}</span>
                          <span className="text-sm font-medium">{formatXOF(debit)}</span>
                        </div>
                      </div>
                    }
                  >
                    <table className="w-full text-sm mt-2">
                      <thead>
                        <tr className="border-b border-zinc-200 text-xs text-zinc-500">
                          <th className="py-2 text-left">Compte</th>
                          <th className="py-2 text-left">Libellé</th>
                          <th className="py-2 text-right">Débit</th>
                          <th className="py-2 text-right">Crédit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {e.lines.map((l) => (
                          <tr key={l.id} className="border-b border-zinc-100">
                            <td className="py-2 text-zinc-500">{l.accountCode}</td>
                            <td className="py-2">{l.accountLabel}</td>
                            <td className="py-2 text-right tabular-nums">
                              {l.lineType === 'DEBIT' ? formatXOF(l.amountXof) : '—'}
                            </td>
                            <td className="py-2 text-right tabular-nums">
                              {l.lineType === 'CREDIT' ? formatXOF(l.amountXof) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="font-medium">
                          <td colSpan={2} className="py-2 text-right">Total :</td>
                          <td className="py-2 text-right tabular-nums">{formatXOF(debit)}</td>
                          <td className="py-2 text-right tabular-nums">{formatXOF(debit)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </AccordionItem>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
