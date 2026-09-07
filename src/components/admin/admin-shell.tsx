'use client';

import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, Activity, ChartNoAxesCombined, ListChecks, BookOpen, FileChartColumn, Bell, CreditCard, Wallet, Layers, Files, MessageSquare, LifeBuoy, ShieldCheck, Settings, PanelLeftClose, PanelLeftOpen, Search, Sun, Moon, Monitor, LogOut, ChevronDown, ArrowUpRight, Zap, Menu, X, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { can, type AdminIdentity, type Permission } from '@/lib/admin/permissions';

export const adminNavigation = [
  { key: '', label: 'Overview', icon: LayoutDashboard, permission: 'dashboard.read', group: 'Workspace' },
  { key: 'users', label: 'Users', icon: Users, permission: 'users.read', group: 'Workspace' },
  { key: 'activity', label: 'User activity', icon: Activity, permission: 'activity.read', group: 'Workspace' },
  { key: 'analytics', label: 'Analytics', icon: ChartNoAxesCombined, permission: 'analytics.read', group: 'Workspace' },
  { key: 'productivity', label: 'Tasks & goals', icon: ListChecks, permission: 'productivity.read', group: 'Workspace' },
  { key: 'learning', label: 'Learning & progress', icon: BookOpen, permission: 'productivity.read', group: 'Workspace' },
  { key: 'reports', label: 'Reports', icon: FileChartColumn, permission: 'reports.read', group: 'Workspace' },
  { key: 'subscriptions', label: 'Subscriptions', icon: CreditCard, permission: 'billing.read', group: 'Business' },
  { key: 'payments', label: 'Payments', icon: Wallet, permission: 'billing.read', group: 'Business' },
  { key: 'plans', label: 'Plans', icon: Layers, permission: 'billing.read', group: 'Business' },
  { key: 'content', label: 'Content', icon: Files, permission: 'content.read', group: 'Community' },
  { key: 'feedback', label: 'Feedback', icon: MessageSquare, permission: 'feedback.read', group: 'Community' },
  { key: 'support', label: 'Support', icon: LifeBuoy, permission: 'support.read', group: 'Community' },
  { key: 'notifications', label: 'Notifications', icon: Bell, permission: 'notifications.read', group: 'Community' },
  { key: 'audit', label: 'Audit logs', icon: ShieldCheck, permission: 'audit.read', group: 'Administration' },
  { key: 'settings', label: 'Settings', icon: Settings, permission: 'settings.read', group: 'Administration' },
] as const;

const AdminContext = createContext<AdminIdentity | null>(null);
export function useAdmin() { const value = useContext(AdminContext); if (!value) throw new Error('Admin context is missing'); return value; }
export async function adminFetch<T = any>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api/admin/${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...options?.headers }, cache: 'no-store' });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Unable to complete this request.');
  return result.data;
}

export function AdminShell({ actor, branding, children }: { actor: AdminIdentity; branding: { appName: string; logoUrl: string; timezone: string; dateFormat: string }; children: ReactNode }) {
  const pathname = usePathname(); const router = useRouter();
  const [collapsed, setCollapsed] = useState(false), [drawer, setDrawer] = useState(false);
  const [theme, setTheme] = useState('system'), [systemDark, setSystemDark] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false), [query, setQuery] = useState(''), [results, setResults] = useState<any[]>([]), [searchError, setSearchError] = useState(''), [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(0);
  const [logoutError, setLogoutError] = useState('');
  const menuButton = useRef<HTMLButtonElement>(null);
  const current = adminNavigation.find(item => item.key === (pathname.split('/')[2] || ''));
  const activeTheme = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;
  const navigation = adminNavigation.filter(item => can(actor.permissions, item.permission));
  useEffect(() => {
    try { setCollapsed(localStorage.getItem('lifeos-admin-sidebar') === 'collapsed'); setTheme(localStorage.getItem('lifeos-admin-theme') || 'system'); } catch {}
    const media = matchMedia('(prefers-color-scheme: dark)');
    const sync = () => setSystemDark(media.matches); sync(); media.addEventListener('change', sync);
    const keydown = (event: KeyboardEvent) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setSearchOpen(value => !value); } };
    window.addEventListener('keydown', keydown);
    return () => { media.removeEventListener('change', sync); window.removeEventListener('keydown', keydown); };
  }, []);
  useEffect(() => { setDrawer(false); }, [pathname]);
  useEffect(() => {
    if (!searchOpen || query.trim().length < 2) { setResults([]); return; }
    const controller = new AbortController();
    const timer = setTimeout(async () => { setSearching(true); setSearchError(''); try { setResults(await adminFetch(`search?q=${encodeURIComponent(query)}`, { signal: controller.signal })); setSelected(0); } catch (e) { if (!controller.signal.aborted) setSearchError((e as Error).message); } finally { if (!controller.signal.aborted) setSearching(false); } }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, searchOpen]);
  const changeTheme = (value: string) => { setTheme(value); try { localStorage.setItem('lifeos-admin-theme', value); } catch {} };
  const toggleCollapse = () => setCollapsed(value => { try { localStorage.setItem('lifeos-admin-sidebar', value ? 'expanded' : 'collapsed'); } catch {} return !value; });
  const logout = async () => { try { const response = await fetch('/api/auth/logout', { method: 'POST' }); if (!response.ok) throw new Error('Could not sign out. Try again.'); window.location.assign('/login'); } catch (e) { setLogoutError((e as Error).message); } };
  const sidebar = (mobile = false) => <>
    <Link className="ad-brand" href="/admin" aria-label={`${branding.appName} admin home`}><span className="ad-brand-icon">{branding.logoUrl ? <img src={branding.logoUrl} alt="" /> : <Zap size={23} />}</span><span className="ad-sidebar-label">{branding.appName}<small>ADMIN CONSOLE</small></span></Link>
    <nav aria-label={mobile ? 'Mobile admin navigation' : 'Admin navigation'} className="ad-navigation">
      {navigation.map((item, i) => <div key={item.key}>{(i === 0 || item.group !== navigation[i - 1].group) && <p className="ad-nav-group ad-sidebar-label">{item.group}</p>}<Link href={`/admin${item.key ? '/' + item.key : ''}`} className={current?.key === item.key ? 'ad-nav-link active' : 'ad-nav-link'} aria-current={current?.key === item.key ? 'page' : undefined} title={collapsed && !mobile ? item.label : undefined} onClick={() => setDrawer(false)}><item.icon size={18} /><span className="ad-sidebar-label">{item.label}</span></Link></div>)}
    </nav>
    <div className="ad-sidebar-bottom"><Link href="/" className="ad-nav-link" title="Back to LIFEOS"><ArrowUpRight size={18} /><span className="ad-sidebar-label">Open LIFEOS</span></Link><div className="ad-admin-profile"><span className="ad-avatar">{(actor.name || actor.email).charAt(0).toUpperCase()}</span><span className="ad-sidebar-label"><strong>{actor.name || actor.email}</strong><small>{actor.roleName}</small></span></div></div>
  </>;
  return <AdminContext.Provider value={{ ...actor, datePreferences: branding }}><div className={`admin-root ${collapsed ? 'is-collapsed' : ''}`} data-theme={activeTheme}>
    <a href="#admin-main" className="ad-skip">Skip to content</a>
    <aside className="ad-sidebar">{sidebar()}</aside>
    <Dialog open={drawer} onOpenChange={setDrawer}><DialogContent className="ad-drawer" showCloseButton={false}><DialogTitle className="sr-only">Admin navigation</DialogTitle><DialogDescription className="sr-only">Choose a section of the admin console.</DialogDescription><button className="ad-drawer-close" onClick={() => setDrawer(false)} aria-label="Close admin menu"><X size={22} /></button>{sidebar(true)}</DialogContent></Dialog>
    <div className="ad-main-column">
      <header className="ad-topbar"><div className="ad-topbar-left"><button className="ad-icon-button ad-desktop-toggle" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} onClick={toggleCollapse}>{collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}</button><button ref={menuButton} className="ad-icon-button ad-mobile-toggle" aria-label="Open admin menu" onClick={() => setDrawer(true)}><Menu size={23} /></button><div className="ad-breadcrumb"><span>Workspace</span><span>/</span><strong>{current?.label || 'Account'}</strong></div></div>
        <div className="ad-topbar-actions"><button className="ad-search-trigger" onClick={() => setSearchOpen(true)} aria-label="Search admin console"><Search size={16} /><span>Search anything…</span><kbd>Ctrl K</kbd></button>
          <DropdownMenu><DropdownMenuTrigger asChild><button className="ad-icon-button" aria-label="Change theme">{activeTheme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}</button></DropdownMenuTrigger><DropdownMenuContent className="admin-dialog">{[['light', Sun], ['dark', Moon], ['system', Monitor]].map(([value, Icon]: any) => <DropdownMenuItem key={value} onSelect={() => changeTheme(value)}><Icon size={16} /> {value.charAt(0).toUpperCase() + value.slice(1)} {theme === value ? '✓' : ''}</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu>
          {can(actor.permissions, 'notifications.read') && <Link className="ad-icon-button" href="/admin/notifications" aria-label="Notifications"><Bell size={19} /></Link>}
          <DropdownMenu><DropdownMenuTrigger asChild><button className="ad-profile-trigger" aria-label="Admin profile menu"><span className="ad-avatar">{(actor.name || actor.email).charAt(0).toUpperCase()}</span><ChevronDown size={14} /></button></DropdownMenuTrigger><DropdownMenuContent align="end" className="admin-dialog"><DropdownMenuItem onSelect={() => router.push('/admin/account')}>Profile & account settings</DropdownMenuItem><DropdownMenuItem onSelect={() => router.push('/admin/account#security')}>Security</DropdownMenuItem>{can(actor.permissions, 'users.write') && <DropdownMenuItem onSelect={() => router.push('/admin/users')}>Quick action: manage users</DropdownMenuItem>}<DropdownMenuItem onSelect={logout}><LogOut size={16} /> Sign out</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
        </div>
      </header>
      {logoutError && <p role="alert" className="ad-error">{logoutError}</p>}
      <main id="admin-main" className="ad-main" tabIndex={-1}>{children}</main>
      <footer className="ad-footer"><span>{branding.appName} Admin Console</span><span><ShieldCheck size={13} /> Role-protected workspace</span></footer>
    </div>
    <Dialog open={searchOpen} onOpenChange={setSearchOpen}><DialogContent className="admin-dialog ad-command"><DialogTitle>Search your workspace</DialogTitle><DialogDescription>Find users, reports, transactions, goals, and community records.</DialogDescription><label className="ad-search-field"><Search size={19} /><input autoFocus value={query} placeholder="Type at least 2 characters…" aria-label="Global admin search" onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(v => Math.min(results.length - 1, v + 1)); } if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(v => Math.max(0, v - 1)); } if (e.key === 'Enter' && results[selected]) { setSearchOpen(false); router.push(results[selected].href); } }} /></label><div aria-live="polite">{searching ? 'Searching…' : searchError || (query.length >= 2 && !results.length ? 'No matching records.' : '')}</div><div className="ad-search-results">{results.map((result, index) => <Link key={result.id} className={selected === index ? 'selected' : ''} href={result.href} onClick={() => setSearchOpen(false)}><span><strong>{result.title}</strong><small>{result.subtitle}</small></span><ArrowUpRight size={17} /></Link>)}</div></DialogContent></Dialog>
  </div></AdminContext.Provider>;
}
