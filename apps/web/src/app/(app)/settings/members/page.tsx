'use client';

import { useEffect, useState } from 'react';
import { api, ApiClientError } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input, Label } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface Member { id: string; role: string; user: { id: string; email: string; name: string | null } }
interface Invitation { id: string; email: string; role: string; expiresAt: string }

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'OWNER' | 'ACCOUNTANT' | 'VIEWER'>('ACCOUNTANT');
  const [err, setErr] = useState<string | null>(null);

  const load = async (): Promise<void> => {
    const r = await api.get<{ data: { members: Member[]; invitations: Invitation[] } }>('/settings/members');
    setMembers(r.data.members);
    setInvitations(r.data.invitations);
  };
  useEffect(() => { void load(); }, []);

  const invite = async (): Promise<void> => {
    setErr(null);
    try {
      await api.post('/auth/invite', { email, role });
      setEmail('');
      await load();
    } catch (e) {
      setErr(e instanceof ApiClientError ? e.payload.message : 'Erreur');
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Membres</h1>
      <Card>
        <CardHeader><CardTitle>Inviter un membre</CardTitle></CardHeader>
        <CardContent className="flex items-end gap-2">
          <div className="flex-1">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label>Rôle</Label>
            <select
              className="h-10 rounded-md border border-zinc-300 px-3 text-sm"
              value={role}
              onChange={(e) => setRole(e.target.value as 'OWNER' | 'ACCOUNTANT' | 'VIEWER')}
            >
              <option value="OWNER">Propriétaire</option>
              <option value="ACCOUNTANT">Comptable</option>
              <option value="VIEWER">Lecteur</option>
            </select>
          </div>
          <Button onClick={invite}>Inviter</Button>
        </CardContent>
        {err && <CardContent><p className="text-destructive text-sm">{err}</p></CardContent>}
      </Card>

      <Card>
        <CardHeader><CardTitle>Membres actifs ({members.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y divide-zinc-100">
            {members.map((m) => (
              <li key={m.id} className="px-5 py-3 flex justify-between text-sm">
                <span>{m.user.email}</span>
                <span className="text-zinc-500">{m.role}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {invitations.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Invitations en attente</CardTitle></CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-zinc-100">
              {invitations.map((i) => (
                <li key={i.id} className="px-5 py-3 flex justify-between text-sm">
                  <span>{i.email}</span>
                  <span className="text-zinc-500">{i.role}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
