'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Inbox, LayoutDashboard, BookOpen, FileSpreadsheet, PieChart, Scale, Layers,
  Settings, Users, BookText, Tag, LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/lib/auth/context';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Comptabilité',
    items: [
      { href: '/inbox', label: 'Inbox', icon: Inbox },
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/journal', label: 'Journal', icon: BookOpen },
    ],
  },
  {
    title: 'États financiers',
    items: [
      { href: '/reports/balance', label: 'Balance', icon: Scale },
      { href: '/reports/pnl', label: 'Compte de résultat', icon: PieChart },
      { href: '/reports/balance-sheet', label: 'Bilan', icon: FileSpreadsheet },
      { href: '/ledger', label: 'Grand livre', icon: BookText },
    ],
  },
  {
    title: 'Paramètres',
    items: [
      { href: '/settings', label: 'Organisation', icon: Settings },
      { href: '/settings/members', label: 'Membres', icon: Users },
      { href: '/settings/chart-of-accounts', label: 'Plan comptable', icon: BookText },
      { href: '/settings/analytics', label: 'Analytique', icon: Tag },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const auth = useAuth();
  const orgName = auth.memberships.find((m) => m.organizationId === auth.organizationId)?.organization.name ?? '—';

  return (
    <aside className="w-60 shrink-0 border-r border-zinc-200 bg-white flex flex-col">
      <div className="px-5 py-4 border-b border-zinc-200">
        <div className="text-lg font-bold text-primary">AI Compta</div>
        <div className="text-xs text-zinc-500 mt-0.5 truncate" title={orgName}>
          {orgName}
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        {GROUPS.map((group) => (
          <div key={group.title} className="mb-5">
            <div className="px-5 mb-1 text-xs font-semibold uppercase text-zinc-400 tracking-wide">
              {group.title}
            </div>
            <ul>
              {group.items.map((item) => {
                const active = pathname === item.href || pathname?.startsWith(item.href + '/');
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-2.5 px-5 py-2 text-sm transition-colors',
                        active
                          ? 'bg-primary/10 text-primary font-medium border-r-2 border-primary'
                          : 'text-zinc-700 hover:bg-zinc-50',
                      )}
                    >
                      <Icon width={16} height={16} />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-zinc-200 p-4">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <div className="text-sm font-medium text-zinc-900 truncate">{auth.user?.email}</div>
            <div className="text-xs text-zinc-500">{auth.role}</div>
          </div>
          <button
            onClick={() => void auth.logout()}
            className="p-1.5 rounded hover:bg-zinc-100 text-zinc-500"
            title="Déconnexion"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
