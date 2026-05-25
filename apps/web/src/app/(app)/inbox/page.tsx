'use client';

import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Link from 'next/link';
import { Upload, FileText } from 'lucide-react';
import { api, ApiClientError, API_BASE_URL } from '@/lib/api/client';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/documents/StatusBadge';
import { formatXOF } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date';
import type { Document, PaginatedResponse } from '@aicompta/types';

interface UploadEntry {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export default function InboxPage() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [uploads, setUploads] = useState<UploadEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocs = useCallback(async () => {
    try {
      const res = await api.get<PaginatedResponse<Document>>('/documents?limit=50');
      setDocs(res.data);
    } catch {
      /* noop */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDocs();
    const id = setInterval(() => void fetchDocs(), 5000);
    return () => clearInterval(id);
  }, [fetchDocs]);

  const onDrop = useCallback(async (accepted: File[]) => {
    const entries: UploadEntry[] = accepted.map((f) => ({ file: f, status: 'pending' }));
    setUploads((prev) => [...prev, ...entries]);
    for (const entry of entries) {
      setUploads((prev) =>
        prev.map((u) => (u.file === entry.file ? { ...u, status: 'uploading' } : u)),
      );
      try {
        const fd = new FormData();
        fd.append('file', entry.file);
        const res = await fetch(`${API_BASE_URL}/api/v1/documents`, {
          method: 'POST',
          credentials: 'include',
          body: fd,
        });
        if (!res.ok) {
          const payload = await res.json().catch(() => ({ message: 'Erreur' }));
          throw new ApiClientError(res.status, payload);
        }
        setUploads((prev) =>
          prev.map((u) => (u.file === entry.file ? { ...u, status: 'success' } : u)),
        );
      } catch (err) {
        setUploads((prev) =>
          prev.map((u) =>
            u.file === entry.file
              ? { ...u, status: 'error', error: err instanceof ApiClientError ? err.payload.message : 'Erreur' }
              : u,
          ),
        );
      }
    }
    void fetchDocs();
  }, [fetchDocs]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] },
    maxSize: 25 * 1024 * 1024,
    maxFiles: 10,
  });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Inbox — Pièces justificatives</h1>
        <p className="text-zinc-500 text-sm mt-1">Glissez vos factures ici pour les analyser automatiquement</p>
      </header>

      <Card>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-primary bg-primary/5' : 'border-zinc-300 hover:bg-zinc-50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto mb-3 text-zinc-400" size={28} />
            <p className="text-sm font-medium text-zinc-700">
              {isDragActive ? 'Déposez ici…' : 'Glissez vos PDF/images ou cliquez'}
            </p>
            <p className="text-xs text-zinc-500 mt-1">PDF, JPG, PNG · max 25 Mo · 10 fichiers max</p>
          </div>

          {uploads.length > 0 && (
            <ul className="mt-4 space-y-2">
              {uploads.map((u, i) => (
                <li key={i} className="flex items-center gap-3 text-sm">
                  <FileText size={14} className="text-zinc-400" />
                  <span className="flex-1 truncate">{u.file.name}</span>
                  {u.status === 'uploading' && <span className="text-blue-600">Envoi…</span>}
                  {u.status === 'success' && <span className="text-success">✓ Envoyé</span>}
                  {u.status === 'error' && <span className="text-destructive">{u.error}</span>}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold mb-3">Documents récents</h2>
        {loading ? (
          <div className="text-zinc-500 text-sm">Chargement…</div>
        ) : docs.length === 0 ? (
          <div className="text-zinc-500 text-sm">Aucun document pour l&apos;instant</div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {docs.map((d) => (
              <Link key={d.id} href={`/documents/${d.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <FileText className="text-zinc-400" size={20} />
                      <StatusBadge status={d.status} />
                    </div>
                    <div className="font-medium text-sm truncate" title={d.fileName}>{d.fileName}</div>
                    <div className="text-xs text-zinc-500 mt-1">{formatDate(d.createdAt)}</div>
                    {d.totalTTC && (
                      <div className="text-sm font-semibold mt-2">{formatXOF(d.totalTTC)}</div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
