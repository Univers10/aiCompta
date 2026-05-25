'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../api/client';

interface Membership {
  organizationId: string;
  organization: { id: string; name: string; slug: string };
  role: 'OWNER' | 'ACCOUNTANT' | 'VIEWER';
}

interface MeResponse {
  data: {
    user: { id: string; email: string; name: string | null };
    currentOrganizationId: string;
    role: 'OWNER' | 'ACCOUNTANT' | 'VIEWER';
    memberships: Membership[];
  };
}

interface AuthState {
  user: MeResponse['data']['user'] | null;
  organizationId: string | null;
  role: Membership['role'] | null;
  memberships: Membership[];
  loading: boolean;
  refresh: () => Promise<void>;
  switchOrg: (organizationId: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Omit<AuthState, 'refresh' | 'switchOrg' | 'logout'>>({
    user: null,
    organizationId: null,
    role: null,
    memberships: [],
    loading: true,
  });

  const refresh = useCallback(async () => {
    try {
      const res = await api.get<MeResponse>('/auth/me');
      setState({
        user: res.data.user,
        organizationId: res.data.currentOrganizationId,
        role: res.data.role,
        memberships: res.data.memberships,
        loading: false,
      });
    } catch {
      setState({ user: null, organizationId: null, role: null, memberships: [], loading: false });
    }
  }, []);

  const switchOrg = useCallback(async (organizationId: string) => {
    await api.post('/auth/switch-org', { organizationId });
    await refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setState({ user: null, organizationId: null, role: null, memberships: [], loading: false });
      if (typeof window !== 'undefined') window.location.href = '/login';
    }
  }, []);

  useEffect(() => {
    // MODE DEV: Bypass auth complètement
    setState({
      user: { id: 'dev-user', email: 'dev@test.com', name: 'Dev User' },
      organizationId: 'dev-org',
      role: 'OWNER',
      memberships: [],
      loading: false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, refresh, switchOrg, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
