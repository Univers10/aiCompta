'use client';

import { useState, useCallback } from 'react';
import { Upload, FileText, X, Loader2 } from 'lucide-react';
import { api } from '@/lib/api/client';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface UploadedFile {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  documentId?: string;
}

export function DocumentUpload({ onUploadComplete }: { onUploadComplete?: () => void }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    const validFiles = droppedFiles.filter(f => 
      f.type === 'application/pdf' || 
      f.type.startsWith('image/')
    );
    
    setFiles(prev => [
      ...prev,
      ...validFiles.map(file => ({
        file,
        status: 'pending' as const,
        progress: 0,
      }))
    ]);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(prev => [
      ...prev,
      ...selectedFiles.map(file => ({
        file,
        status: 'pending' as const,
        progress: 0,
      }))
    ]);
  }, []);

  const uploadFile = async (index: number) => {
    const fileData = files[index];
    if (!fileData) return;

    setFiles(prev => prev.map((f, i) => 
      i === index ? { ...f, status: 'uploading' as const, progress: 0 } : f
    ));

    try {
      const formData = new FormData();
      formData.append('file', fileData.file);

      const response = await api.post<{ id: string }>('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent: { loaded: number; total?: number }) => {
          const progress = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          setFiles(prev => prev.map((f, i) => 
            i === index ? { ...f, progress } : f
          ));
        },
      });

      setFiles(prev => prev.map((f, i) => 
        i === index ? { 
          ...f, 
          status: 'success' as const, 
          progress: 100,
          documentId: response.id 
        } : f
      ));

      onUploadComplete?.();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'upload';
      setFiles(prev => prev.map((f, i) => 
        i === index ? { 
          ...f, 
          status: 'error' as const, 
          error: errorMessage 
        } : f
      ));
    }
  };

  const uploadAll = async () => {
    for (let i = 0; i < files.length; i++) {
      if (files[i]?.status === 'pending') {
        await uploadFile(i);
      }
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging 
            ? 'border-primary bg-primary/5' 
            : 'border-zinc-300 hover:border-zinc-400'
        }`}
      >
        <Upload className="w-12 h-12 mx-auto mb-4 text-zinc-400" />
        <p className="text-lg font-medium mb-2">
          Glissez-déposez vos documents ici
        </p>
        <p className="text-sm text-zinc-500 mb-4">
          ou cliquez pour sélectionner (PDF, JPG, PNG)
        </p>
        <input
          type="file"
          multiple
          accept=".pdf,image/*"
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload">
          <Button variant="outline" type="button">
            Sélectionner des fichiers
          </Button>
        </label>
      </div>

      {files.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">
              {files.length} fichier{files.length > 1 ? 's' : ''}
            </h3>
            <Button
              onClick={uploadAll}
              disabled={!files.some(f => f.status === 'pending')}
              size="sm"
            >
              Tout envoyer
            </Button>
          </div>

          <div className="space-y-2">
            {files.map((fileData, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg"
              >
                <FileText className="w-5 h-5 text-zinc-400 flex-shrink-0" />
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {fileData.file.name}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {formatFileSize(fileData.file.size)}
                  </p>
                  
                  {fileData.status === 'uploading' && (
                    <div className="mt-2">
                      <div className="h-1 bg-zinc-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${fileData.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {fileData.status === 'error' && (
                    <p className="text-xs text-red-600 mt-1">
                      {fileData.error}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {fileData.status === 'pending' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => uploadFile(index)}
                    >
                      Envoyer
                    </Button>
                  )}
                  
                  {fileData.status === 'uploading' && (
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  )}
                  
                  {fileData.status === 'success' && (
                    <span className="text-xs text-green-600 font-medium">
                      ✓ Envoyé
                    </span>
                  )}
                  
                  {fileData.status !== 'uploading' && (
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1 hover:bg-zinc-200 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
