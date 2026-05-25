import { formatXOF } from '@/lib/utils/currency';

interface Column<T> {
  header: string;
  key: keyof T;
  align?: 'left' | 'right' | 'center';
  format?: (val: unknown, row: T) => React.ReactNode;
}

interface Props<T extends Record<string, unknown>> {
  columns: Column<T>[];
  rows: T[];
  emptyMessage?: string;
}

export function ReportTable<T extends Record<string, unknown>>({ columns, rows, emptyMessage }: Props<T>) {
  if (rows.length === 0) {
    return <div className="text-zinc-500 text-sm py-8 text-center">{emptyMessage ?? 'Aucune donnée'}</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50">
            {columns.map((c) => (
              <th
                key={String(c.key)}
                className={`px-3 py-2 font-medium text-zinc-700 ${
                  c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left'
                }`}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-zinc-100 hover:bg-zinc-50">
              {columns.map((c) => {
                const val = row[c.key];
                return (
                  <td
                    key={String(c.key)}
                    className={`px-3 py-2 ${
                      c.align === 'right' ? 'text-right tabular-nums' : c.align === 'center' ? 'text-center' : 'text-left'
                    }`}
                  >
                    {c.format ? c.format(val, row) : String(val ?? '')}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MoneyCell(amount: unknown): React.ReactNode {
  if (amount === null || amount === undefined || amount === '') return '—';
  const n = parseFloat(String(amount));
  const cls = n < 0 ? 'text-destructive' : '';
  return <span className={cls}>{formatXOF(amount as string)}</span>;
}
