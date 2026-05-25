'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
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
            <div className="divide-y divide-zinc-100">
              {entries.map((e) => {
                const debit = e.lines.filter((l) => l.lineType === 'DEBIT').reduce((a, l) => a + parseFloat(l.amountXof), 0);
                return (
                  <div key={e.id} className="p-4">
                    <div className="flex justify-between items-baseline mb-2">
                      <div>
                        <span className="font-semibold">{e.reference}</span>
                        <span className="ml-2 text-xs uppercase bg-zinc-100 px-1.5 py-0.5 rounded">{e.journal}</span>
                        {e.isReversal && <span className="ml-2 text-xs text-orange-600">Contre-passation</span>}
                      </div>
                      <div className="text-sm text-zinc-500">{formatDate(e.date)}</div>
                    </div>
                    <div className="text-sm text-zinc-600 mb-2">{e.description}</div>
                    <table className="w-full text-xs">
                      <tbody>
                        {e.lines.map((l) => (
                          <tr key={l.id}>
                            <td className="py-0.5 text-zinc-500 w-20">{l.accountCode}</td>
                            <td className="py-0.5">{l.accountLabel}</td>
                            <td className="py-0.5 text-right tabular-nums w-32">
                              {l.lineType === 'DEBIT' ? formatXOF(l.amountXof) : ''}
                            </td>
                            <td className="py-0.5 text-right tabular-nums w-32">
                              {l.lineType === 'CREDIT' ? formatXOF(l.amountXof) : ''}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="text-xs text-right text-zinc-500 mt-1">Total : {formatXOF(debit)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
