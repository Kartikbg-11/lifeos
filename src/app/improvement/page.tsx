'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowRight, Check, Circle, Lightbulb, Loader2, NotebookPen, Pencil, Pin, Plus, Search, Sparkles, Sprout, Target, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { categories, Improvement, suggestions } from '@/lib/improvement';
import { toast } from 'sonner';

const blank = { title: '', content: '', category: 'Mindset' as Improvement['category'], kind: 'note' as Improvement['kind'] };
const tones: Record<string, string> = { Mindset: 'bg-amber-50 text-amber-800', Learning: 'bg-blue-50 text-blue-800', Productivity: 'bg-violet-50 text-violet-800', Wellbeing: 'bg-emerald-50 text-emerald-800', Career: 'bg-rose-50 text-rose-800' };

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json' } });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || 'Something went wrong. Please try again.');
  return body.data as T;
}

export default function ImprovementPage() {
  const [items, setItems] = useState<Improvement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'notes' | 'suggestions' | 'actions'>('notes');
  const [category, setCategory] = useState('All areas');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState<Improvement | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try { setItems(await request<Improvement[]>('/api/improvements')); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not load improvements.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  function compose(item?: Improvement) {
    setEditing(item?.id || null);
    setDraft(item ? { title: item.title, content: item.content, category: item.category, kind: item.kind } : { ...blank, kind: tab === 'actions' ? 'action' : 'note' });
    setOpen(true);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const saved = await request<Improvement>(editing ? `/api/improvements/${editing}` : '/api/improvements', { method: editing ? 'PATCH' : 'POST', body: JSON.stringify(draft) });
      setItems(current => editing ? current.map(item => item.id === editing ? saved : item) : [saved, ...current]);
      setOpen(false);
      setTab(saved.kind === 'note' ? 'notes' : 'actions');
      setCategory('All areas'); setQuery('');
      toast.success(editing ? 'Changes saved' : saved.kind === 'note' ? 'Reflection saved' : 'Action added');
    } catch (err) { toast.error((err as Error).message); }
    finally { setBusy(false); }
  }

  async function update(item: Improvement, changes: Partial<Improvement>) {
    setBusy(true);
    try {
      const saved = await request<Improvement>(`/api/improvements/${item.id}`, { method: 'PATCH', body: JSON.stringify(changes) });
      setItems(current => current.map(entry => entry.id === saved.id ? saved : entry));
      if (changes.kind === 'action') { setTab('actions'); toast.success('Added to your action plan'); }
    } catch (err) { toast.error((err as Error).message); }
    finally { setBusy(false); }
  }

  async function addSuggestion(suggestion: typeof suggestions[number]) {
    setBusy(true);
    try {
      const saved = await request<Improvement>('/api/improvements', { method: 'POST', body: JSON.stringify({ ...suggestion, kind: 'action' }) });
      setItems(current => [saved, ...current]);
      toast.success('Added to your action plan');
    } catch (err) { toast.error((err as Error).message); }
    finally { setBusy(false); }
  }

  async function remove() {
    if (!deleting) return;
    setBusy(true);
    try {
      await request(`/api/improvements/${deleting.id}`, { method: 'DELETE' });
      setItems(current => current.filter(item => item.id !== deleting.id));
      setDeleting(null); toast.success('Improvement deleted');
    } catch (err) { toast.error((err as Error).message); }
    finally { setBusy(false); }
  }

  const notes = items.filter(item => item.kind === 'note');
  const actions = items.filter(item => item.kind === 'action');
  const completed = actions.filter(item => item.completed).length;
  const progress = actions.length ? Math.round(completed / actions.length * 100) : 0;
  const matches = (item: { category: string; title: string; content: string }) => (category === 'All areas' || category === item.category) && `${item.title} ${item.content}`.toLowerCase().includes(query.toLowerCase());
  const visible = (tab === 'notes' ? notes : actions).filter(matches).sort((a, b) => Number(b.pinned) - Number(a.pinned));
  const visibleSuggestions = suggestions.filter(matches);

  return (
    <div className="mx-auto max-w-7xl space-y-7 pb-8 text-slate-800">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700"><Sprout size={15} /> Your space to grow</p><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">A little better, every day.</h1><p className="mt-3 text-sm text-slate-500">Capture what you notice. Explore what’s possible. Take your next step.</p></div>
        <Button onClick={() => compose()} className="h-11 rounded-xl bg-emerald-700 px-5 shadow-sm hover:bg-emerald-800"><Plus size={17} /> New {tab === 'actions' ? 'action' : 'note'}</Button>
      </div>

      <section className="relative overflow-hidden rounded-3xl bg-[#123e35] p-7 text-white sm:p-10">
        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-28 h-96 w-96 rounded-full border-[50px] border-white/5" />
        <div className="relative grid items-center gap-8 md:grid-cols-[1.6fr_1fr]">
          <div><span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/20 bg-white/5 px-3 py-1.5 text-xs text-emerald-100"><Sparkles size={13} /> THE IMPROVEMENT STUDIO</span><h2 className="mt-5 max-w-md text-3xl font-medium leading-tight tracking-tight sm:text-4xl">Small steps.<br /><span className="text-[#c4e6a5]">Meaningful change.</span></h2><p className="mt-4 max-w-md text-sm leading-6 text-emerald-100/80">You don’t need a perfect plan. Start with one reflection and one thing you’d like to try.</p><button onClick={() => { setTab('suggestions'); setCategory('All areas'); setQuery(''); document.getElementById('workspace')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} className="mt-6 inline-flex items-center gap-3 text-sm font-medium text-white underline-offset-4 hover:underline">Find your next step <ArrowRight size={17} /></button></div>
          <div className="rounded-2xl border border-white/15 bg-white/[0.07] p-6 backdrop-blur-sm"><div className="flex items-center justify-between"><span className="text-sm text-emerald-100">Your action plan</span><Target size={19} className="text-[#c4e6a5]" /></div><div className="my-5 flex items-baseline gap-2"><span className="text-5xl font-semibold tracking-tight">{loading || error ? '—' : completed}</span><span className="text-sm text-emerald-100/75">/ {loading || error ? '—' : actions.length} steps completed</span></div><div role="progressbar" aria-label="Action plan completion" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} className="h-2 overflow-hidden rounded-full bg-black/20"><div className="h-full rounded-full bg-[#c4e6a5] transition-all" style={{ width: `${progress}%` }} /></div><p className="mt-4 text-xs leading-5 text-emerald-100/80">{actions.length ? 'Every completed step is something to build on.' : 'Your first small step starts a new chapter.'}</p></div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[{ label: 'Reflections captured', value: notes.length, icon: NotebookPen, color: 'bg-amber-50 text-amber-700' }, { label: 'Steps in progress', value: actions.length - completed, icon: Target, color: 'bg-violet-50 text-violet-700' }, { label: 'Small wins collected', value: completed, icon: Sprout, color: 'bg-emerald-50 text-emerald-700' }].map(stat => <div key={stat.label} className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-5"><div className={`rounded-xl p-3 ${stat.color}`}><stat.icon size={21} /></div><div><p className="text-2xl font-semibold">{loading || error ? '—' : stat.value}</p><p className="text-xs text-slate-500">{stat.label}</p></div></div>)}
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_290px]">
        <section id="workspace" className="min-w-0 scroll-mt-24 rounded-2xl border border-slate-200/80 bg-white">
          <div className="flex overflow-x-auto border-b border-slate-100 px-4" role="tablist" aria-label="Improvement workspace" onKeyDown={event => {
            const tabs = ['notes', 'suggestions', 'actions'] as const;
            if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
            event.preventDefault();
            const index = event.key === 'Home' ? 0 : event.key === 'End' ? 2 : (tabs.indexOf(tab) + (event.key === 'ArrowRight' ? 1 : 2)) % 3;
            setTab(tabs[index]); document.getElementById(`tab-${tabs[index]}`)?.focus();
          }}>
            {([{ id: 'notes', label: 'My notes', icon: NotebookPen }, { id: 'suggestions', label: 'Suggestions', icon: Lightbulb }, { id: 'actions', label: 'Action plan', icon: Target }] as const).map(item => <button key={item.id} role="tab" id={`tab-${item.id}`} aria-controls="workspace-panel" aria-selected={tab === item.id} onClick={() => setTab(item.id)} className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-5 text-sm font-medium transition-colors ${tab === item.id ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}><item.icon size={16} />{item.label}</button>)}
          </div>
          <div className="space-y-5 p-5" role="tabpanel" id="workspace-panel" aria-labelledby={`tab-${tab}`}>
            <div className="relative"><Search size={16} className="absolute left-3 top-3 text-slate-400" /><Input aria-label="Search improvements" placeholder={tab === 'suggestions' ? 'Find an idea to try…' : 'Search your thoughts and ideas…'} value={query} onChange={event => setQuery(event.target.value)} className="rounded-xl border-slate-200 pl-10" /></div>
            <div className="flex flex-wrap gap-2">{['All areas', ...categories].map(area => <button key={area} aria-pressed={category === area} onClick={() => setCategory(area)} className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${category === area ? 'bg-emerald-700 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>{area}</button>)}</div>

            {loading ? <div role="status" className="flex justify-center gap-2 py-16 text-sm text-slate-500"><Loader2 size={18} className="animate-spin" /> Loading your space…</div> : error ? <div role="alert" className="space-y-3 rounded-xl bg-red-50 p-6 text-sm text-red-800"><p>{error}</p><Button variant="outline" onClick={() => void load()}>Try again</Button></div> : tab === 'suggestions' ? <><p className="text-xs leading-5 text-slate-500">Curated ideas to experiment with. Choose what fits your day.</p><div className="grid gap-4 md:grid-cols-2">{visibleSuggestions.map(suggestion => {
              const added = actions.some(item => item.title === suggestion.title);
              return <article key={suggestion.title} className="flex flex-col rounded-2xl border border-slate-200 p-5"><div className="flex items-center justify-between gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${tones[suggestion.category]}`}>{suggestion.category}</span><span className="text-xs text-slate-400">{suggestion.time}</span></div><h3 className="mt-4 font-semibold">{suggestion.title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{suggestion.content}</p><p className="mb-5 mt-4 rounded-xl bg-[#f8f8f2] p-3 text-xs leading-5 text-slate-600">{suggestion.why}</p><Button variant="outline" disabled={busy || added} onClick={() => void addSuggestion(suggestion)} className="mt-auto rounded-xl text-emerald-700">{added ? <Check size={15} /> : <Plus size={15} />}{added ? 'Added to your plan' : 'Try this step'}</Button></article>;
            })}</div>{!visibleSuggestions.length && <p className="py-10 text-center text-sm text-slate-500">No matching ideas. Try another search or area.</p>}</> : visible.length ? <div className="grid gap-4 md:grid-cols-2">{visible.map(item => <article key={item.id} className={`flex min-w-0 flex-col rounded-2xl border p-5 ${item.completed ? 'border-emerald-100 bg-emerald-50/40' : 'border-slate-200 bg-white'}`}><div className="flex items-center justify-between"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${tones[item.category]}`}>{item.category}</span><button disabled={busy} onClick={() => void update(item, { pinned: !item.pinned })} aria-label={item.pinned ? `Unpin ${item.title}` : `Pin ${item.title}`} aria-pressed={item.pinned} className={`rounded-lg p-2 hover:bg-slate-100 ${item.pinned ? 'text-emerald-700' : 'text-slate-400'}`}><Pin size={15} /></button></div><h3 className={`mt-3 break-words font-semibold ${item.completed ? 'text-emerald-800' : ''}`}>{item.title}</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-500">{item.content || 'A new thought, ready to grow.'}</p><div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3"><span className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span><div className="flex"><button disabled={busy} aria-label={`Edit ${item.title}`} onClick={() => compose(item)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><Pencil size={15} /></button><button disabled={busy} aria-label={`Delete ${item.title}`} onClick={() => setDeleting(item)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button></div></div><button disabled={busy} onClick={() => void update(item, item.kind === 'note' ? { kind: 'action' } : { completed: !item.completed })} className="mt-3 flex items-center gap-2 text-left text-xs font-medium text-emerald-700 hover:underline disabled:opacity-50">{item.kind === 'note' ? <ArrowRight size={15} /> : item.completed ? <Check size={16} /> : <Circle size={16} />}{item.kind === 'note' ? 'Turn into a next step' : item.completed ? 'Completed · mark as open' : 'Mark as completed'}</button></article>)}</div> : <div className="rounded-2xl border border-dashed border-slate-200 bg-[#fafbf8] px-5 py-12 text-center"><div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100/60 text-emerald-700"><NotebookPen size={25} /></div><h3 className="font-semibold">{query || category !== 'All areas' ? 'No matching entries' : tab === 'notes' ? 'Every change starts with a thought.' : 'One small step is enough to begin.'}</h3><p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-500">{query || category !== 'All areas' ? 'Try a different search or choose another area.' : tab === 'notes' ? 'What worked today? What would you do differently? Give your ideas a place to grow.' : 'Create a next step or explore a suggestion that feels right for you.'}</p><Button onClick={() => compose()} variant="outline" className="mt-5 rounded-xl border-emerald-200 text-emerald-700"><Plus size={15} />{tab === 'notes' ? 'Write a reflection' : 'Add your first step'}</Button></div>}
          </div>
        </section>

        <aside className="space-y-5">
          <div className="rounded-2xl border border-[#e8e6d7] bg-[#f8f6eb] p-6"><span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-amber-800"><Sparkles size={15} /> A moment to reflect</span><h3 className="mt-5 text-xl font-medium leading-8 tracking-tight">What’s one thing you could make a little easier tomorrow?</h3><p className="mt-3 text-sm leading-6 text-slate-500">Think smaller. A two-minute change still counts.</p><Button variant="outline" className="mt-5 w-full rounded-xl border-[#dfdcc9] bg-white/60" onClick={() => { setEditing(null); setDraft({ ...blank, title: 'Make tomorrow a little easier', content: 'One thing I can simplify:\n\nMy smallest next step:\n' }); setOpen(true); }}>Write about this <ArrowRight size={15} /></Button></div>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6"><h3 className="font-semibold">Your growth loop</h3><p className="mt-1 text-xs text-slate-500">A simple practice. At your own pace.</p><div className="mt-6 space-y-3">{[{ title: 'Reflect', text: 'Capture an honest observation.', icon: NotebookPen }, { title: 'Experiment', text: 'Choose one small thing to try.', icon: Lightbulb }, { title: 'Celebrate', text: 'Notice what changed. Keep going.', icon: Sprout }].map((step, index) => <div key={step.title}><div className="flex items-start gap-3"><div className="rounded-xl bg-slate-50 p-2.5 text-emerald-700"><step.icon size={17} /></div><div><p className="text-sm font-medium">{step.title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{step.text}</p></div></div>{index < 2 && <ArrowDown size={13} className="ml-3 mt-3 text-slate-300" />}</div>)}</div></div>
        </aside>
      </div>

      <Dialog open={open} onOpenChange={value => { if (!busy) setOpen(value); }}><DialogContent className="max-h-[90dvh] overflow-y-auto rounded-2xl"><DialogHeader><DialogTitle>{editing ? 'Edit your improvement' : draft.kind === 'action' ? 'One small next step' : 'Capture a reflection'}</DialogTitle><DialogDescription>A thought today can become a change tomorrow.</DialogDescription></DialogHeader><form onSubmit={save} className="space-y-4"><div><label htmlFor="entry-title" className="text-sm font-medium">Title</label><Input id="entry-title" required maxLength={120} value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} placeholder="What’s on your mind?" className="mt-1.5" /></div><div className="grid grid-cols-2 gap-4"><div><label htmlFor="entry-area" className="text-sm font-medium">Life area</label><select id="entry-area" value={draft.category} onChange={event => setDraft({ ...draft, category: event.target.value as Improvement['category'] })} className="mt-1.5 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm">{categories.map(area => <option key={area}>{area}</option>)}</select></div><div><label htmlFor="entry-kind" className="text-sm font-medium">Save as</label><select id="entry-kind" value={draft.kind} onChange={event => setDraft({ ...draft, kind: event.target.value as Improvement['kind'] })} className="mt-1.5 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"><option value="note">Reflection note</option><option value="action">Action step</option></select></div></div><div><label htmlFor="entry-content" className="text-sm font-medium">Notes & details</label><Textarea id="entry-content" maxLength={5000} rows={7} value={draft.content} onChange={event => setDraft({ ...draft, content: event.target.value })} placeholder="What did you notice? What could you try next?" className="mt-1.5" /><p className="mt-1 text-right text-xs text-slate-400">{draft.content.length} / 5,000</p></div><div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={busy} onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={busy || !draft.title.trim()} className="bg-emerald-700 hover:bg-emerald-800">{busy && <Loader2 size={15} className="animate-spin" />}Save {draft.kind === 'note' ? 'note' : 'step'}</Button></div></form></DialogContent></Dialog>
      <Dialog open={!!deleting} onOpenChange={value => { if (!value && !busy) setDeleting(null); }}><DialogContent><DialogHeader><DialogTitle>Delete this improvement?</DialogTitle><DialogDescription>“{deleting?.title}” will be permanently removed.</DialogDescription></DialogHeader><div className="flex justify-end gap-2"><Button variant="outline" disabled={busy} onClick={() => setDeleting(null)}>Keep it</Button><Button variant="destructive" disabled={busy} onClick={() => void remove()}>Delete</Button></div></DialogContent></Dialog>
    </div>
  );
}
