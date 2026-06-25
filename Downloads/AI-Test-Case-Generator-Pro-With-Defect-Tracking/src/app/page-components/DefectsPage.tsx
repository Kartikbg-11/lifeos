'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import {
  Bug, Plus, Search, Filter, Edit, Trash2, Eye, ChevronLeft, ChevronRight,
  AlertTriangle, ArrowUpCircle, CheckCircle2, Clock, XCircle, RotateCcw
} from 'lucide-react';

/* ── Types ── */
interface Defect {
  id: string;
  defectId: string;
  title: string;
  description: string;
  severity: string;
  priority: string;
  status: string;
  projectId: string;
  project: { id: string; name: string };
  testCaseId: string;
  stepsToReproduce: string;
  expectedBehavior: string;
  actualBehavior: string;
  environment: string;
  module: string;
  reportedById: string;
  reportedBy: { id: string; firstName: string; lastName: string; email: string };
  assignedToId: string | null;
  assignedTo: { id: string; firstName: string; lastName: string; email: string } | null;
  resolution: string;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Project { id: string; name: string; }
interface User { id: string; firstName: string; lastName: string; email: string; }

const SEVERITY_OPTIONS = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const PRIORITY_OPTIONS = ['HIGH', 'MEDIUM', 'LOW'];
const STATUS_OPTIONS = ['OPEN', 'IN_PROGRESS', 'FIXED', 'VERIFIED', 'CLOSED', 'REOPENED'];

const severityConfig: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  CRITICAL: { color: 'text-red-400', bg: 'bg-red-500/15 border-red-500/30', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  HIGH: { color: 'text-orange-400', bg: 'bg-orange-500/15 border-orange-500/30', icon: <ArrowUpCircle className="w-3.5 h-3.5" /> },
  MEDIUM: { color: 'text-yellow-400', bg: 'bg-yellow-500/15 border-yellow-500/30', icon: <Clock className="w-3.5 h-3.5" /> },
  LOW: { color: 'text-blue-400', bg: 'bg-blue-500/15 border-blue-500/30', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
};

const statusConfig: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  OPEN: { color: 'text-red-400', bg: 'bg-red-500/15', icon: <XCircle className="w-3.5 h-3.5" /> },
  IN_PROGRESS: { color: 'text-blue-400', bg: 'bg-blue-500/15', icon: <Clock className="w-3.5 h-3.5" /> },
  FIXED: { color: 'text-emerald-400', bg: 'bg-emerald-500/15', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  VERIFIED: { color: 'text-purple-400', bg: 'bg-purple-500/15', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  CLOSED: { color: 'text-zinc-400', bg: 'bg-zinc-500/15', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  REOPENED: { color: 'text-orange-400', bg: 'bg-orange-500/15', icon: <RotateCcw className="w-3.5 h-3.5" /> },
};

const emptyForm = {
  title: '', description: '', severity: 'MEDIUM', priority: 'MEDIUM',
  projectId: '', testCaseId: '', stepsToReproduce: '', expectedBehavior: '',
  actualBehavior: '', environment: '', module: '', assignedToId: '', resolution: '',
};

export default function DefectsPage() {
  const [defects, setDefects] = useState<Defect[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [filterProject, setFilterProject] = useState('ALL');

  // Dialog states
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showView, setShowView] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selectedDefect, setSelectedDefect] = useState<Defect | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const perPage = 10;

  const fetchDefects = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterProject !== 'ALL') params.set('projectId', filterProject);
      if (filterStatus !== 'ALL') params.set('status', filterStatus);
      if (filterSeverity !== 'ALL') params.set('severity', filterSeverity);
      const res = await fetch(`/api/defects?${params}`);
      if (res.ok) setDefects(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, [filterProject, filterStatus, filterSeverity]);

  useEffect(() => { fetchDefects(); }, [fetchDefects]);

  useEffect(() => {
    fetch('/api/projects?userId=cmqp0a8lg00bfq2td50zek40q').then(r => r.json()).then(setProjects).catch(() => {});
    fetch('/api/users').then(r => r.json()).then(setUsers).catch(() => {});
  }, []);

  const filtered = defects.filter(d => {
    if (!search) return true;
    const s = search.toLowerCase();
    return d.title.toLowerCase().includes(s) || d.defectId.toLowerCase().includes(s) || d.module.toLowerCase().includes(s);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Stats
  const stats = {
    total: defects.length,
    open: defects.filter(d => d.status === 'OPEN' || d.status === 'REOPENED').length,
    inProgress: defects.filter(d => d.status === 'IN_PROGRESS').length,
    fixed: defects.filter(d => d.status === 'FIXED' || d.status === 'VERIFIED').length,
    closed: defects.filter(d => d.status === 'CLOSED').length,
    critical: defects.filter(d => d.severity === 'CRITICAL').length,
  };

  const openCreate = () => { setForm({ ...emptyForm, projectId: filterProject !== 'ALL' ? filterProject : (projects[0]?.id || '') }); setShowCreate(true); };
  const openEdit = (d: Defect) => {
    setSelectedDefect(d);
    setForm({
      title: d.title, description: d.description, severity: d.severity, priority: d.priority,
      projectId: d.projectId, testCaseId: d.testCaseId, stepsToReproduce: d.stepsToReproduce,
      expectedBehavior: d.expectedBehavior, actualBehavior: d.actualBehavior,
      environment: d.environment, module: d.module, assignedToId: d.assignedToId || '',
      resolution: d.resolution,
    });
    setShowEdit(true);
  };
  const openView = (d: Defect) => { setSelectedDefect(d); setShowView(true); };
  const openDelete = (d: Defect) => { setSelectedDefect(d); setShowDelete(true); };

  const handleCreate = async () => {
    if (!form.title || !form.projectId) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/defects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, reportedById: 'cmqp0a8lg00bfq2td50zek40q' }),
      });
      if (res.ok) { setShowCreate(false); fetchDefects(); }
    } catch { /* ignore */ }
    setSubmitting(false);
  };

  const handleUpdate = async () => {
    if (!selectedDefect) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/defects/${selectedDefect.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) { setShowEdit(false); fetchDefects(); }
    } catch { /* ignore */ }
    setSubmitting(false);
  };

  const handleDelete = async () => {
    if (!selectedDefect) return;
    try {
      await fetch(`/api/defects/${selectedDefect.id}`, { method: 'DELETE' });
      setShowDelete(false); fetchDefects();
    } catch { /* ignore */ }
  };

  const getUserName = (u: { firstName: string; lastName: string } | null) => u ? `${u.firstName} ${u.lastName}` : 'Unassigned';

  // ─── Dialog Fields Component ───
  const DialogFields = ({ isEdit }: { isEdit?: boolean }) => (
    <div className="grid gap-4 max-h-[60vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label className="text-zinc-300">Title *</Label>
          <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Defect title" className="bg-zinc-800 border-zinc-700 text-white mt-1.5" />
        </div>
        <div>
          <Label className="text-zinc-300">Severity</Label>
          <Select value={form.severity} onValueChange={v => setForm({ ...form, severity: v })}>
            <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white mt-1.5"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              {SEVERITY_OPTIONS.map(s => <SelectItem key={s} value={s} className="text-zinc-300">{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-zinc-300">Priority</Label>
          <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
            <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white mt-1.5"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              {PRIORITY_OPTIONS.map(p => <SelectItem key={p} value={p} className="text-zinc-300">{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {isEdit && (
          <div>
            <Label className="text-zinc-300">Status</Label>
            <Select value={form.status || selectedDefect?.status} onValueChange={v => setForm({ ...form, status: v })}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s} className="text-zinc-300">{s.replace('_', ' ')}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
        <div>
          <Label className="text-zinc-300">Project *</Label>
          <Select value={form.projectId} onValueChange={v => setForm({ ...form, projectId: v })}>
            <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white mt-1.5"><SelectValue placeholder="Select project" /></SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              {projects.map(p => <SelectItem key={p.id} value={p.id} className="text-zinc-300">{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-zinc-300">Module</Label>
          <Input value={form.module} onChange={e => setForm({ ...form, module: e.target.value })} placeholder="e.g. Auth, API, UI" className="bg-zinc-800 border-zinc-700 text-white mt-1.5" />
        </div>
        <div>
          <Label className="text-zinc-300">Assign To</Label>
          <Select value={form.assignedToId} onValueChange={v => setForm({ ...form, assignedToId: v })}>
            <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white mt-1.5"><SelectValue placeholder="Unassigned" /></SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              <SelectItem value="" className="text-zinc-500">Unassigned</SelectItem>
              {users.map(u => <SelectItem key={u.id} value={u.id} className="text-zinc-300">{u.firstName} {u.lastName}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-zinc-300">Environment</Label>
          <Input value={form.environment} onChange={e => setForm({ ...form, environment: e.target.value })} placeholder="e.g. Chrome 120, Windows 11" className="bg-zinc-800 border-zinc-700 text-white mt-1.5" />
        </div>
      </div>
      <div>
        <Label className="text-zinc-300">Description</Label>
        <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Detailed description of the defect" rows={3} className="bg-zinc-800 border-zinc-700 text-white mt-1.5" />
      </div>
      <div>
        <Label className="text-zinc-300">Steps to Reproduce</Label>
        <Textarea value={form.stepsToReproduce} onChange={e => setForm({ ...form, stepsToReproduce: e.target.value })} placeholder="1. Navigate to...&#10;2. Click on...&#10;3. Observe..." rows={3} className="bg-zinc-800 border-zinc-700 text-white mt-1.5" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-zinc-300">Expected Behavior</Label>
          <Textarea value={form.expectedBehavior} onChange={e => setForm({ ...form, expectedBehavior: e.target.value })} placeholder="What should happen" rows={2} className="bg-zinc-800 border-zinc-700 text-white mt-1.5" />
        </div>
        <div>
          <Label className="text-zinc-300">Actual Behavior</Label>
          <Textarea value={form.actualBehavior} onChange={e => setForm({ ...form, actualBehavior: e.target.value })} placeholder="What actually happens" rows={2} className="bg-zinc-800 border-zinc-700 text-white mt-1.5" />
        </div>
      </div>
      {isEdit && (
        <div>
          <Label className="text-zinc-300">Resolution Notes</Label>
          <Textarea value={form.resolution} onChange={e => setForm({ ...form, resolution: e.target.value })} placeholder="How the defect was resolved" rows={2} className="bg-zinc-800 border-zinc-700 text-white mt-1.5" />
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'text-white', bg: 'bg-zinc-800/50', border: 'border-zinc-700/50' },
          { label: 'Open', value: stats.open, color: 'text-red-400', bg: 'bg-red-500/5', border: 'border-red-500/20' },
          { label: 'In Progress', value: stats.inProgress, color: 'text-blue-400', bg: 'bg-blue-500/5', border: 'border-blue-500/20' },
          { label: 'Fixed', value: stats.fixed, color: 'text-emerald-400', bg: 'bg-emerald-500/5', border: 'border-emerald-500/20' },
          { label: 'Closed', value: stats.closed, color: 'text-zinc-400', bg: 'bg-zinc-500/5', border: 'border-zinc-500/20' },
          { label: 'Critical', value: stats.critical, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
        ].map(s => (
          <Card key={s.label} className={`${s.bg} ${s.border} border`}>
            <CardContent className="p-4">
              <p className="text-xs text-zinc-500 mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters & Actions */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input placeholder="Search defects by title, ID, or module..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-10 bg-zinc-800 border-zinc-700 text-white" />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={filterProject} onValueChange={v => { setFilterProject(v); setPage(1); }}>
                <SelectTrigger className="w-[160px] bg-zinc-800 border-zinc-700 text-zinc-300"><Filter className="w-4 h-4 mr-2" /><SelectValue placeholder="Project" /></SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  <SelectItem value="ALL" className="text-zinc-300">All Projects</SelectItem>
                  {projects.map(p => <SelectItem key={p.id} value={p.id} className="text-zinc-300">{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={v => { setFilterStatus(v); setPage(1); }}>
                <SelectTrigger className="w-[150px] bg-zinc-800 border-zinc-700 text-zinc-300"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  <SelectItem value="ALL" className="text-zinc-300">All Status</SelectItem>
                  {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s} className="text-zinc-300">{s.replace('_', ' ')}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterSeverity} onValueChange={v => { setFilterSeverity(v); setPage(1); }}>
                <SelectTrigger className="w-[140px] bg-zinc-800 border-zinc-700 text-zinc-300"><SelectValue placeholder="Severity" /></SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  <SelectItem value="ALL" className="text-zinc-300">All Severity</SelectItem>
                  {SEVERITY_OPTIONS.map(s => <SelectItem key={s} value={s} className="text-zinc-300">{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button onClick={openCreate} className="bg-emerald-500 hover:bg-emerald-600 text-white">
                <Plus className="w-4 h-4 mr-2" />Report Defect
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Defects Table */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-400">ID</TableHead>
                <TableHead className="text-zinc-400">Title</TableHead>
                <TableHead className="text-zinc-400">Severity</TableHead>
                <TableHead className="text-zinc-400">Priority</TableHead>
                <TableHead className="text-zinc-400">Status</TableHead>
                <TableHead className="text-zinc-400">Module</TableHead>
                <TableHead className="text-zinc-400">Assigned To</TableHead>
                <TableHead className="text-zinc-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-12 text-zinc-500">Loading defects...</TableCell></TableRow>
              ) : paged.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-12">
                  <Bug className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                  <p className="text-zinc-500">No defects found</p>
                  <Button variant="ghost" onClick={openCreate} className="text-emerald-400 mt-2"><Plus className="w-4 h-4 mr-1" />Report your first defect</Button>
                </TableCell></TableRow>
              ) : paged.map(d => {
                const sev = severityConfig[d.severity] || severityConfig.MEDIUM;
                const sta = statusConfig[d.status] || statusConfig.OPEN;
                return (
                  <TableRow key={d.id} className="border-zinc-800 hover:bg-zinc-800/50">
                    <TableCell className="font-mono text-xs text-zinc-400">{d.defectId}</TableCell>
                    <TableCell>
                      <p className="text-white text-sm font-medium truncate max-w-[250px]">{d.title}</p>
                      <p className="text-xs text-zinc-500">{d.project.name}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${sev.bg} ${sev.color} border text-xs gap-1`}>
                        {sev.icon}{d.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${d.priority === 'HIGH' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : d.priority === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'} border text-xs`}>
                        {d.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${sta.bg} ${sta.color} border text-xs gap-1`}>
                        {sta.icon}{d.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-zinc-400 text-sm">{d.module || '-'}</TableCell>
                    <TableCell className="text-zinc-400 text-sm">{getUserName(d.assignedTo)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openView(d)} className="text-zinc-400 hover:text-white h-8 w-8"><Eye className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(d)} className="text-zinc-400 hover:text-white h-8 w-8"><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => openDelete(d)} className="text-zinc-400 hover:text-red-400 h-8 w-8"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
              <p className="text-sm text-zinc-500">Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length}</p>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="text-zinc-400 h-8 w-8"><ChevronLeft className="w-4 h-4" /></Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <Button key={p} variant={p === page ? 'default' : 'ghost'} size="icon" onClick={() => setPage(p)} className={p === page ? 'bg-emerald-500 text-white h-8 w-8' : 'text-zinc-400 h-8 w-8'}>{p}</Button>
                ))}
                <Button variant="ghost" size="icon" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="text-zinc-400 h-8 w-8"><ChevronRight className="w-4 h-4" /></Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Create Dialog ─── */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-zinc-900 border-zinc-700 max-w-2xl">
          <DialogHeader><DialogTitle className="text-white flex items-center gap-2"><Bug className="w-5 h-5 text-red-400" />Report New Defect</DialogTitle></DialogHeader>
          <DialogFields />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreate(false)} className="text-zinc-400">Cancel</Button>
            <Button onClick={handleCreate} disabled={submitting || !form.title || !form.projectId} className="bg-emerald-500 hover:bg-emerald-600 text-white">
              {submitting ? 'Creating...' : 'Create Defect'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Edit Dialog ─── */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="bg-zinc-900 border-zinc-700 max-w-2xl">
          <DialogHeader><DialogTitle className="text-white flex items-center gap-2"><Edit className="w-5 h-5 text-emerald-400" />Edit Defect - {selectedDefect?.defectId}</DialogTitle></DialogHeader>
          <DialogFields isEdit />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowEdit(false)} className="text-zinc-400">Cancel</Button>
            <Button onClick={handleUpdate} disabled={submitting} className="bg-emerald-500 hover:bg-emerald-600 text-white">
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── View Dialog ─── */}
      <Dialog open={showView} onOpenChange={setShowView}>
        <DialogContent className="bg-zinc-900 border-zinc-700 max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-white flex items-center gap-2"><Bug className="w-5 h-5 text-red-400" />{selectedDefect?.defectId} — {selectedDefect?.title}</DialogTitle></DialogHeader>
          {selectedDefect && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <p className="text-xs text-zinc-500 mb-1">Severity</p>
                  <Badge variant="outline" className={`${severityConfig[selectedDefect.severity]?.bg} ${severityConfig[selectedDefect.severity]?.color} border text-xs gap-1`}>
                    {severityConfig[selectedDefect.severity]?.icon}{selectedDefect.severity}
                  </Badge>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <p className="text-xs text-zinc-500 mb-1">Priority</p>
                  <Badge variant="outline" className={`${selectedDefect.priority === 'HIGH' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'} border text-xs`}>{selectedDefect.priority}</Badge>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <p className="text-xs text-zinc-500 mb-1">Status</p>
                  <Badge variant="outline" className={`${statusConfig[selectedDefect.status]?.bg} ${statusConfig[selectedDefect.status]?.color} border text-xs gap-1`}>
                    {statusConfig[selectedDefect.status]?.icon}{selectedDefect.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <p className="text-xs text-zinc-500 mb-1">Module</p>
                  <p className="text-white">{selectedDefect.module || '-'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <p className="text-xs text-zinc-500 mb-1">Reported By</p>
                  <p className="text-white">{getUserName(selectedDefect.reportedBy)}</p>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <p className="text-xs text-zinc-500 mb-1">Assigned To</p>
                  <p className="text-white">{getUserName(selectedDefect.assignedTo)}</p>
                </div>
              </div>
              {selectedDefect.description && (
                <div><p className="text-xs text-zinc-500 mb-1">Description</p><p className="text-zinc-300 bg-zinc-800/50 rounded-lg p-3 whitespace-pre-wrap">{selectedDefect.description}</p></div>
              )}
              {selectedDefect.stepsToReproduce && (
                <div><p className="text-xs text-zinc-500 mb-1">Steps to Reproduce</p><p className="text-zinc-300 bg-zinc-800/50 rounded-lg p-3 whitespace-pre-wrap">{selectedDefect.stepsToReproduce}</p></div>
              )}
              <div className="grid grid-cols-2 gap-3">
                {selectedDefect.expectedBehavior && (
                  <div><p className="text-xs text-zinc-500 mb-1">Expected Behavior</p><p className="text-zinc-300 bg-zinc-800/50 rounded-lg p-3 whitespace-pre-wrap">{selectedDefect.expectedBehavior}</p></div>
                )}
                {selectedDefect.actualBehavior && (
                  <div><p className="text-xs text-zinc-500 mb-1">Actual Behavior</p><p className="text-zinc-300 bg-zinc-800/50 rounded-lg p-3 whitespace-pre-wrap">{selectedDefect.actualBehavior}</p></div>
                )}
              </div>
              {selectedDefect.environment && (
                <div><p className="text-xs text-zinc-500 mb-1">Environment</p><p className="text-zinc-300 bg-zinc-800/50 rounded-lg p-3">{selectedDefect.environment}</p></div>
              )}
              {selectedDefect.resolution && (
                <div><p className="text-xs text-zinc-500 mb-1">Resolution</p><p className="text-emerald-300 bg-emerald-500/5 rounded-lg p-3 border border-emerald-500/20 whitespace-pre-wrap">{selectedDefect.resolution}</p></div>
              )}
              <div className="flex justify-between text-xs text-zinc-600 pt-2 border-t border-zinc-800">
                <span>Created: {new Date(selectedDefect.createdAt).toLocaleString()}</span>
                <span>Updated: {new Date(selectedDefect.updatedAt).toLocaleString()}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation ─── */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Defect</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Are you sure you want to delete defect <span className="text-white font-mono">{selectedDefect?.defectId}</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 border-zinc-600 text-zinc-300">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}