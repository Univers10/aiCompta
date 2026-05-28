'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { formatXOF } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date';
import type { JournalEntry, JournalLine, PaginatedResponse } from '@aicompta/types';

type Entry = JournalEntry & { lines: JournalLine[] };

export default function JournalPage() {
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => {
    void api.get<PaginatedResponse<Entry>>('/journal-entries?limit=50').then((r) => setEntries(r.data));
  }, []);

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Journal général</h1>
      <Card>
        <CardHeader><CardTitle>Écritures comptables</CardTitle></CardHeader>
        <CardContent className="p-6">
          <DataTable
            data={entries}
            columns={[
              {
                key: 'expand',
                header: '',
                accessor: (e) => e.id,
                render: (id) => (
                  <button onClick={() => toggleRow(id)} className="p-1 hover:bg-zinc-100 rounded">
                    {expandedRows.has(id) ? (
                      <ChevronDown className="w-4 h-4 text-zinc-600" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-zinc-600" />
                    )}
                  </button>
                ),
                sortable: false,
                filterable: false,
                width: '40px',
              },
              {
                key: 'reference',
                header: 'Référence',
                accessor: (e) => e.reference,
                render: (val, e) => (
                  <div>
                    <span className="font-semibold">{val}</span>
                    {e.isReversal && <span className="ml-2 text-xs text-orange-600">⚠ Contre-passation</span>}
                  </div>
                ),
              },
              {
                key: 'journal',
                header: 'Journal',
                accessor: (e) => e.journal,
                render: (val) => (
                  <span className="text-xs uppercase bg-zinc-100 px-2 py-1 rounded font-medium">{val}</span>
                ),
                width: '100px',
              },
              {
                key: 'date',
                header: 'Date',
                accessor: (e) => e.date,
                render: (val) => formatDate(val),
                width: '120px',
              },
              {
                key: 'description',
                header: 'Description',
                accessor: (e) => e.description,
              },
              {
                key: 'amount',
                header: 'Montant',
                accessor: (e) => {
                  const debit = e.lines.filter((l) => l.lineType === 'DEBIT').reduce((a, l) => a + parseFloat(l.amountXof), 0);
                  return debit;
                },
                render: (val) => <span className="font-medium">{formatXOF(val)}</span>,
                align: 'right',
                width: '140px',
              },
              {
                key: 'lines',
                header: 'Lignes',
                accessor: (e) => e.lines.length,
                render: (val) => <span className="text-zinc-500">{val}</span>,
                align: 'center',
                width: '80px',
              },
            ]}
            searchPlaceholder="Rechercher une écriture..."
            emptyMessage="Aucune écriture comptable"
            pageSize={20}
          />
          
          {/* Lignes détaillées pour les entrées expandées */}
          {entries.filter((e) => expandedRows.has(e.id)).map((e) => (
            <div key={`detail-${e.id}`} className="mt-4 ml-12 border-l-2 border-blue-200 pl-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-xs text-zinc-500 bg-zinc-50">
                    <th className="py-2 px-3 text-left">Compte</th>
                    <th className="py-2 px-3 text-left">Libellé</th>
                    <th className="py-2 px-3 text-right">Débit</th>
                    <th className="py-2 px-3 text-right">Crédit</th>
                  </tr>
                </thead>
                <tbody>
                  {e.lines.map((l) => (
                    <tr key={l.id} className="border-b border-zinc-100">
                      <td className="py-2 px-3 text-zinc-600 font-mono text-xs">{l.accountCode}</td>
                      <td className="py-2 px-3">{l.accountLabel}</td>
                      <td className="py-2 px-3 text-right tabular-nums">
                        {l.lineType === 'DEBIT' ? formatXOF(l.amountXof) : '—'}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums">
                        {l.lineType === 'CREDIT' ? formatXOF(l.amountXof) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-medium bg-zinc-50">
                    <td colSpan={2} className="py-2 px-3 text-right">Total :</td>
                    <td className="py-2 px-3 text-right tabular-nums">
                      {formatXOF(e.lines.filter((l) => l.lineType === 'DEBIT').reduce((a, l) => a + parseFloat(l.amountXof), 0))}
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums">
                      {formatXOF(e.lines.filter((l) => l.lineType === 'CREDIT').reduce((a, l) => a + parseFloat(l.amountXof), 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
