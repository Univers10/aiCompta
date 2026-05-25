'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, ApiClientError } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { StatusBadge } from '@/components/documents/StatusBadge';
import { ReportTable, MoneyCell } from '@/components/reports/ReportTable';
import { formatXOF } from '@/lib/utils/currency';
import { formatDate, formatDateTime } from '@/lib/utils/date';
import type { Document, JournalEntry, JournalLine, ExtractionAttempt } from '@aicompta/types';

type Detail = Document & {
  fileUrl: string;
  journalEntries: (JournalEntry & { lines: JournalLine[] })[];
  extractionAttempts: ExtractionAttempt[];
  supplier: { name: string } | null;
};

export default function DocumentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [doc, setDoc] = useState<Detail | null>(null);
  const [busy, setBusy] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);

  const load = async (): Promise<void> => {
    try {
      const res = await api.get<{ data: Detail }>(`/documents/${params.id}`);
      setDoc(res.data);
    } catch {
      setDoc(null);
    }
  };
  useEffect(() => { void load(); }, [params.id]);

  const validate = async (): Promise<void> => {
    setBusy(true);
    try {
      await api.post(`/documents/${params.id}/validate`);
      await load();
    } catch (err) {
      if (err instanceof ApiClientError) alert(err.payload.message);
    } finally {
      setBusy(false);
    }
  };

  const reject = async (): Promise<void> => {
    if (rejectReason.length < 10) {
      alert('Motif trop court (10 caractères min)');
      return;
    }
    setBusy(true);
    try {
      await api.post(`/documents/${params.id}/reject`, { reason: rejectReason });
      await load();
      setShowReject(false);
    } finally {
      setBusy(false);
    }
  };

  const reextract = async (): Promise<void> => {
    setBusy(true);
    try {
      await api.post(`/documents/${params.id}/reextract`);
      await load();
    } finally {
      setBusy(false);
    }
  };

  if (!doc) {
    return <div className="p-6 text-zinc-500">Chargement…</div>;
  }

  const journalLines: JournalLine[] = doc.journalEntries.flatMap((e) => e.lines);
  const debit = journalLines.filter((l) => l.lineType === 'DEBIT').reduce((a, l) => a + parseFloat(l.amountXof), 0);
  const credit = journalLines.filter((l) => l.lineType === 'CREDIT').reduce((a, l) => a + parseFloat(l.amountXof), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <Button size="sm" variant="ghost" onClick={() => router.push('/inbox')}>← Retour</Button>
          <h1 className="text-xl font-bold mt-1">{doc.fileName}</h1>
        </div>
        <StatusBadge status={doc.status} />
      </header>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Visionneuse</CardTitle></CardHeader>
          <CardContent>
            {doc.mimeType === 'application/pdf' ? (
              <iframe src={doc.fileUrl} className="w-full h-[600px] border border-zinc-200 rounded" />
            ) : (
              <img src={doc.fileUrl} alt={doc.fileName} className="max-w-full rounded border" />
            )}
            <div className="mt-2">
              <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-primary text-sm hover:underline">
                Télécharger l&apos;original
              </a>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Données extraites</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="Fournisseur" value={doc.supplier?.name ?? '—'} />
              <Row label="Date" value={doc.invoiceDate ? formatDate(doc.invoiceDate) : '—'} />
              <Row label="N° facture" value={doc.invoiceNumber ?? '—'} />
              <Row label="HT" value={doc.totalHT ? formatXOF(doc.totalHT) : '—'} />
              <Row label="TVA" value={doc.totalTVA ? formatXOF(doc.totalTVA) : '—'} />
              <Row label="TTC" value={doc.totalTTC ? formatXOF(doc.totalTTC) : '—'} bold />
              <Row label="Devise" value={doc.currency} />
              <Row label="Confiance IA" value={doc.confidence ? `${(parseFloat(doc.confidence) * 100).toFixed(0)} %` : '—'} />
            </CardContent>
          </Card>

          {journalLines.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Écriture générée</CardTitle></CardHeader>
              <CardContent className="p-0">
                <ReportTable
                  columns={[
                    { header: 'Compte', key: 'accountCode' },
                    { header: 'Libellé', key: 'accountLabel' },
                    { header: 'Débit', key: 'amountXof', align: 'right', format: (v, r) => (r.lineType === 'DEBIT' ? MoneyCell(v) : '') },
                    { header: 'Crédit', key: 'amountXof', align: 'right', format: (v, r) => (r.lineType === 'CREDIT' ? MoneyCell(v) : '') },
                  ]}
                  rows={journalLines as unknown as Record<string, unknown>[]}
                />
                <div className="p-3 border-t bg-zinc-50 text-sm flex justify-end gap-4">
                  <span>ΣD : <strong>{formatXOF(debit)}</strong></span>
                  <span>ΣC : <strong>{formatXOF(credit)}</strong></span>
                  {Math.abs(debit - credit) < 0.01 && <span className="text-success">✓ Équilibrée</span>}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {(doc.status === 'NEEDS_REVIEW' || doc.status === 'EXTRACTED') && (
                <div className="flex gap-2 flex-wrap">
                  <Button onClick={validate} disabled={busy}>Valider</Button>
                  <Button variant="outline" onClick={() => setShowReject(true)}>Rejeter</Button>
                  <Button variant="ghost" onClick={reextract}>Ré-extraire</Button>
                </div>
              )}
              {showReject && (
                <div className="space-y-2 pt-2">
                  <Textarea
                    placeholder="Motif de rejet (min 10 caractères)"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button variant="destructive" onClick={reject} disabled={busy}>Confirmer le rejet</Button>
                    <Button variant="ghost" onClick={() => setShowReject(false)}>Annuler</Button>
                  </div>
                </div>
              )}
              {doc.status === 'REJECTED' && doc.rejectedReason && (
                <div className="text-sm text-zinc-600">
                  <strong>Motif :</strong> {doc.rejectedReason}
                </div>
              )}
            </CardContent>
          </Card>

          {doc.extractionAttempts.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Historique IA</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-2">
                {doc.extractionAttempts.map((a) => (
                  <div key={a.id} className="flex items-center justify-between border-b border-zinc-100 py-1.5">
                    <div>
                      <div className="font-medium">{a.model}</div>
                      <div className="text-xs text-zinc-500">{formatDateTime(a.createdAt)}</div>
                    </div>
                    <div className="text-right">
                      <div>{(parseFloat(a.confidence) * 100).toFixed(0)} %</div>
                      <div className={a.success ? 'text-success text-xs' : 'text-destructive text-xs'}>
                        {a.success ? '✓ Succès' : '✗ Échec'}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between border-b border-zinc-100 py-1.5">
      <span className="text-zinc-500">{label}</span>
      <span className={bold ? 'font-semibold' : ''}>{value}</span>
    </div>
  );
}
