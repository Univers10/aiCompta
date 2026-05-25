'use client';

import { useState, useRef } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { API_BASE_URL } from '@/lib/api/client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{ tool: string; summary: string }>;
}

const SUGGESTIONS = [
  'Total achats ce mois',
  'Trésorerie disponible',
  'Top fournisseurs',
];

export function ChatPanel() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const send = async (text: string): Promise<void> => {
    if (!text.trim() || streaming) return;
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setInput('');
    setStreaming(true);

    const assistantIdx = messages.length + 1;
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/chat`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId, message: text }),
      });
      if (!res.body) throw new Error('Pas de stream');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const chunk = JSON.parse(line.slice(6));
            if (chunk.type === 'thread') {
              setThreadId(chunk.threadId);
            } else if (chunk.type === 'text') {
              setMessages((prev) =>
                prev.map((m, i) => (i === assistantIdx ? { ...m, content: m.content + chunk.content } : m)),
              );
            } else if (chunk.type === 'done') {
              setMessages((prev) =>
                prev.map((m, i) => (i === assistantIdx ? { ...m, sources: chunk.sources } : m)),
              );
            }
          } catch {
            /* noop */
          }
        }
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    } catch {
      setMessages((prev) =>
        prev.map((m, i) =>
          i === assistantIdx ? { ...m, content: 'Erreur lors de la requête.' } : m,
        ),
      );
    } finally {
      setStreaming(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 bg-primary text-white rounded-full p-4 shadow-lg hover:bg-primary/90 z-40"
        aria-label="Ouvrir le copilote"
      >
        <MessageSquare size={20} />
      </button>
    );
  }

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white border-l border-zinc-200 shadow-xl z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-zinc-200">
        <div className="font-semibold">Copilote AI Compta</div>
        <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-zinc-900">
          <X size={18} />
        </button>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-sm text-zinc-500">
            <p className="mb-3">Posez une question sur votre comptabilité.</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => void send(s)}
                  className="text-xs px-2.5 py-1 rounded-full bg-zinc-100 hover:bg-zinc-200"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === 'user'
                ? 'ml-auto max-w-[85%] bg-primary text-white rounded-lg px-3 py-2 text-sm'
                : 'mr-auto max-w-[85%] bg-zinc-100 text-zinc-900 rounded-lg px-3 py-2 text-sm whitespace-pre-wrap'
            }
          >
            {m.content || (streaming && i === messages.length - 1 ? '…' : '')}
            {m.sources && m.sources.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {m.sources.map((s, j) => (
                  <span key={j} className="text-[10px] bg-white border border-zinc-200 px-1.5 py-0.5 rounded">
                    {s.tool} · {s.summary}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="border-t border-zinc-200 p-3">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void send(input);
              }
            }}
            rows={2}
            placeholder="Votre question…"
            disabled={streaming}
          />
          <Button size="sm" onClick={() => void send(input)} disabled={streaming || !input.trim()}>
            <Send size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}
