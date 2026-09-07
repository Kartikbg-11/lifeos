'use client';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { ArrowDownToLine, ChevronLeft, ChevronRight, Inbox, Loader2, RefreshCw, Search, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { adminFetch, useAdmin } from './admin-shell';

export function useAdminData<T = any>(path: string) {
  const [data, setData] = useState<T | null>(null), [error, setError] = useState(''), [loading, setLoading] = useState(true), [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion(v => v + 1), []);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError('');
    adminFetch<T>(path, { signal: controller.signal }).then(result => { if (!controller.signal.aborted) setData(result); }).catch(e => { if (!controller.signal.aborted) setError(e.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [path, version]);
  return { data, error, loading, refresh };
}
export function useDebounce(value: string, delay = 250) { const [result, setResult] = useState(value); useEffect(() => { const timer = setTimeout(() => setResult(value), delay); return () => clearTimeout(timer); }, [value, delay]); return result; }
export function PageHeading({ eyebrow, title, description, children }: { eyebrow?: string; title: string; description: string; children?: ReactNode }) { return <div className="ad-page-heading"><div>{eyebrow && <p className="ad-eyebrow">{eyebrow}</p>}<h1>{title}</h1><p>{description}</p></div><div className="ad-heading-actions">{children}</div></div>; }
export function Badge({ value }: { value: string }) { return <span className={`ad-badge ad-badge-${value.replaceAll(' ', '-').toLowerCase()}`}><i />{value.replaceAll('-', ' ')}</span>; }
export function Panel({ title, subtitle, children, actions, className = '' }: { title?: string; subtitle?: string; children: ReactNode; actions?: ReactNode; className?: string }) { return <section className={`ad-panel ${className}`}>{title && <div className="ad-panel-heading"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{actions}</div>}{children}</section>; }
export function Empty({ title = 'Nothing here yet', description = 'Records will appear here as your community uses LIFEOS.', children }: { title?: string; description?: string; children?: ReactNode }) { return <div className="ad-empty"><span><Inbox size={26} /></span><h3>{title}</h3><p>{description}</p>{children}</div>; }
export function Loading() { return <div className="ad-skeleton-page" role="status" aria-label="Loading records"><div /><div /><div /></div>; }
export function ErrorNotice({ message, retry }: { message: string; retry?: () => void }) { return <div className="ad-error" role="alert"><span>{message}</span>{retry && <button className="ad-button" onClick={retry}><RefreshCw size={15} />Try again</button>}</div>; }
export function Pager({ page, total, limit = 20, onChange }: { page: number; total: number; limit?: number; onChange: (page: number) => void }) { return <div className="ad-pagination"><span>{total ? `${(page - 1) * limit + 1}–${Math.min(page * limit, total)} of ${total.toLocaleString()}` : '0 records'}</span><div><button className="ad-button" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page"><ChevronLeft size={16} /></button><span>Page {page} of {Math.max(1, Math.ceil(total / limit))}</span><button className="ad-button" disabled={page * limit >= total} onClick={() => onChange(page + 1)} aria-label="Next page"><ChevronRight size={16} /></button></div></div>; }
export function SearchInput({ value, onChange, placeholder = 'Search records…' }: { value: string; onChange: (value: string) => void; placeholder?: string }) { return <label className="ad-search-field"><Search size={17} /><input value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} aria-label={placeholder} />{value && <button aria-label="Clear search" onClick={() => onChange('')}><X size={14} /></button>}</label>; }
export function DateFilter({ value, onChange }: { value: string; onChange: (value: string) => void }) { return <select className="ad-select" aria-label="Reporting period" value={value} onChange={e => onChange(e.target.value)}>{[['1', 'Today'], ['7', 'Last 7 days'], ['30', 'Last 30 days'], ['90', 'Last 90 days'], ['365', 'Last year'], ['custom', 'Custom dates']].map(([v, label]) => <option key={v} value={v}>{label}</option>)}</select>; }
export function Confirm({ title, description, open, close, action, label = 'Confirm', danger = false }: { title: string; description: string; open: boolean; close: () => void; action: () => Promise<void>; label?: string; danger?: boolean }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  return <Dialog open={open} onOpenChange={value => { if (!value && !busy) { setError(''); close(); } }}><DialogContent className="admin-dialog"><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription>{error && <ErrorNotice message={error} />}<div className="ad-form-actions"><button className="ad-button" disabled={busy} onClick={close}>Cancel</button><button className={`ad-button ${danger ? 'danger' : 'primary'}`} disabled={busy} onClick={async () => { setBusy(true); setError(''); try { await action(); close(); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } }}>{busy && <Loader2 className="ad-spin" size={16} />}{label}</button></div></DialogContent></Dialog>;
}
export const dateText = (value: string | null | undefined) => value ? new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(value)) : 'Not recorded';
export function AdminDate({ value }: { value?: string | null }) {
  const { datePreferences } = useAdmin();
  if (!value) return <>Not recorded</>;
  const format = datePreferences?.dateFormat || 'dd MMM yyyy';
  const parts = new Intl.DateTimeFormat('en', { timeZone: datePreferences?.timezone || 'UTC', year: 'numeric', month: format === 'dd MMM yyyy' ? 'short' : '2-digit', day: '2-digit' }).formatToParts(new Date(value));
  const part = (type: string) => parts.find(p => p.type === type)?.value;
  const label = format === 'yyyy-MM-dd' ? `${part('year')}-${part('month')}-${part('day')}` : format === 'MM/dd/yyyy' ? `${part('month')}/${part('day')}/${part('year')}` : `${part('day')} ${part('month')} ${part('year')}`;
  return <time dateTime={value}>{label}</time>;
}
export function AnimatedCounter({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    if (media.matches) { setDisplay(value); return; }
    let frame = 0; const start = performance.now();
    const step = (now: number) => { const progress = Math.min(1, (now - start) / 650); setDisplay(Math.round(value * (1 - Math.pow(1 - progress, 3)))); if (progress < 1) frame = requestAnimationFrame(step); };
    frame = requestAnimationFrame(step);
    const reduce = () => { if (media.matches) { cancelAnimationFrame(frame); setDisplay(value); } };
    media.addEventListener('change', reduce);
    return () => { cancelAnimationFrame(frame); media.removeEventListener('change', reduce); };
  }, [value]);
  return <><span aria-hidden="true">{display.toLocaleString()}</span><span className="sr-only">{value.toLocaleString()}</span></>;
}
export const money = (cents: number, currency = 'INR') => new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(cents / 100);
export function Download({ href, children = 'Export CSV' }: { href: string; children?: ReactNode }) { return <a className="ad-button" href={href}><ArrowDownToLine size={16} />{children}</a>; }
export function Stat({ label, value, description, icon, accent = '' }: { label: string; value: number | string; description: ReactNode; icon: ReactNode; accent?: string }) { return <div className={`ad-stat ${accent}`}><div className="ad-stat-label">{label}<span>{icon}</span></div><strong>{typeof value === 'number' ? <AnimatedCounter value={value} /> : value}</strong><p>{description}</p></div>; }
