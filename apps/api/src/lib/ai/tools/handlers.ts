import Decimal from 'decimal.js';
import { prisma } from '../../db/prisma';
import { withOrg } from '../../db/tenant';
import { getBalance } from '../../accounting/reports/balance';
import { getPnL } from '../../accounting/reports/pnl';

type Params = Record<string, unknown>;

export async function searchDocuments(params: Params, orgId: string) {
  return withOrg(orgId, async (id) => {
    const docs = await prisma.document.findMany({
      where: {
        organizationId: id,
        ...(params.type ? { type: params.type as never } : {}),
        ...(params.supplierId ? { supplierId: params.supplierId as string } : {}),
        ...(params.dateFrom || params.dateTo
          ? {
              invoiceDate: {
                ...(params.dateFrom ? { gte: new Date(params.dateFrom as string) } : {}),
                ...(params.dateTo ? { lte: new Date(params.dateTo as string) } : {}),
              },
            }
          : {}),
        ...(params.amountMin
          ? { totalTTC: { gte: new Decimal(params.amountMin as number).toString() } }
          : {}),
      },
      include: { supplier: true },
      take: 50,
      orderBy: { invoiceDate: 'desc' },
    });
    return {
      count: docs.length,
      items: docs.map((d) => ({
        id: d.id,
        supplier: d.supplier?.name ?? null,
        invoiceNumber: d.invoiceNumber,
        invoiceDate: d.invoiceDate?.toISOString() ?? null,
        totalTTC: d.totalTTC?.toString() ?? null,
        currency: d.currency,
        status: d.status,
      })),
    };
  });
}

export async function searchJournalEntries(params: Params, orgId: string) {
  return withOrg(orgId, async (id) => {
    const entries = await prisma.journalEntry.findMany({
      where: {
        organizationId: id,
        ...(params.journal ? { journal: params.journal as never } : {}),
        ...(params.accountCode
          ? { lines: { some: { accountCode: params.accountCode as string } } }
          : {}),
        ...(params.dateFrom || params.dateTo
          ? {
              date: {
                ...(params.dateFrom ? { gte: new Date(params.dateFrom as string) } : {}),
                ...(params.dateTo ? { lte: new Date(params.dateTo as string) } : {}),
              },
            }
          : {}),
      },
      include: { lines: true },
      take: 50,
      orderBy: { date: 'desc' },
    });
    return { count: entries.length, items: entries };
  });
}

export async function getBalanceTool(params: Params, orgId: string) {
  const date = new Date(params.date as string);
  const report = await getBalance(orgId, date);
  const row = report.rows.find((r) => r.code === (params.accountCode as string));
  return row ?? { code: params.accountCode, solde: '0.00', totalDebit: '0.00', totalCredit: '0.00' };
}

export async function getPnlTool(params: Params, orgId: string) {
  return getPnL(orgId, new Date(params.dateFrom as string), new Date(params.dateTo as string));
}

export async function getTop(params: Params, orgId: string) {
  return withOrg(orgId, async (id) => {
    const limit = Number(params.limit ?? 5);
    if (params.dimension === 'supplier') {
      const rows = await prisma.document.groupBy({
        by: ['supplierId'],
        where: {
          organizationId: id,
          status: 'POSTED',
          ...(params.dateFrom ? { invoiceDate: { gte: new Date(params.dateFrom as string) } } : {}),
          ...(params.dateTo ? { invoiceDate: { lte: new Date(params.dateTo as string) } } : {}),
        },
        _sum: { totalHT: true },
        _count: { _all: true },
        orderBy: { _sum: { totalHT: 'desc' } },
        take: limit,
      });
      const enriched = await Promise.all(
        rows.map(async (r) => {
          if (!r.supplierId) return null;
          const supplier = await prisma.supplier.findUnique({ where: { id: r.supplierId } });
          return {
            supplierId: r.supplierId,
            supplierName: supplier?.name ?? '—',
            count: r._count._all,
            totalHT: r._sum.totalHT?.toString() ?? '0',
          };
        }),
      );
      return enriched.filter(Boolean);
    }
    if (params.dimension === 'account') {
      const lines = await prisma.journalLine.findMany({
        where: { organizationId: id },
        select: { accountCode: true, accountLabel: true, amountXof: true, lineType: true },
      });
      const map = new Map<string, { label: string; total: Decimal }>();
      for (const l of lines) {
        const cur = map.get(l.accountCode) ?? { label: l.accountLabel, total: new Decimal(0) };
        cur.total = cur.total.plus(new Decimal(l.amountXof.toString()));
        map.set(l.accountCode, cur);
      }
      return Array.from(map.entries())
        .map(([code, v]) => ({ code, label: v.label, total: v.total.toFixed(2) }))
        .sort((a, b) => parseFloat(b.total) - parseFloat(a.total))
        .slice(0, limit);
    }
    return [];
  });
}

export async function getTrend(params: Params, orgId: string) {
  return withOrg(orgId, async (id) => {
    const from = new Date(params.dateFrom as string);
    const to = new Date(params.dateTo as string);
    const lines = await prisma.journalLine.findMany({
      where: {
        organizationId: id,
        entry: { date: { gte: from, lte: to } },
        accountCode: { startsWith: '7' },
      },
      include: { entry: true },
    });
    const buckets = new Map<string, Decimal>();
    for (const l of lines) {
      const month = l.entry.date.toISOString().slice(0, 7);
      const cur = buckets.get(month) ?? new Decimal(0);
      const amt = new Decimal(l.amountXof.toString());
      buckets.set(month, l.lineType === 'CREDIT' ? cur.plus(amt) : cur.minus(amt));
    }
    return Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, v]) => ({ period, value: v.toFixed(2) }));
  });
}

export async function compareToBudget(_params: Params, _orgId: string) {
  return { available: false, message: 'Budgétisation non disponible en v1' };
}

export async function forecast(_params: Params, _orgId: string) {
  return { available: false, message: 'Forecast non disponible en v1' };
}

export const TOOL_HANDLERS: Record<string, (p: Params, orgId: string) => Promise<unknown>> = {
  search_documents: searchDocuments,
  search_journal_entries: searchJournalEntries,
  get_balance: getBalanceTool,
  get_pnl: getPnlTool,
  get_top: getTop,
  get_trend: getTrend,
  compare_to_budget: compareToBudget,
  forecast,
};
