import ExcelJS from 'exceljs';
import type { Response } from 'express';

export async function exportXlsx<T extends Record<string, unknown>>(
  res: Response,
  filename: string,
  sheetName: string,
  columns: { header: string; key: string; width?: number }[],
  rows: T[],
): Promise<void> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(sheetName);
  ws.columns = columns.map((c) => ({ header: c.header, key: c.key, width: c.width ?? 20 }));
  ws.addRows(rows as unknown[]);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
  await wb.xlsx.write(res);
  res.end();
}

export function exportCsv<T extends Record<string, unknown>>(
  res: Response,
  filename: string,
  columns: { header: string; key: string }[],
  rows: T[],
): void {
  const headerLine = columns.map((c) => `"${c.header}"`).join(',');
  const lines = rows.map((r) =>
    columns
      .map((c) => {
        const v = r[c.key];
        if (v === undefined || v === null) return '""';
        const str = String(v).replace(/"/g, '""');
        return `"${str}"`;
      })
      .join(','),
  );
  const csv = `\uFEFF${headerLine}\n${lines.join('\n')}`;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
  res.send(csv);
}
