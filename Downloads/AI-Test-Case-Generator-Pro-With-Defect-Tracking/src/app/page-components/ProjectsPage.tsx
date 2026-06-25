'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockProjects, type Project } from '@/lib/mock-data';
import { Plus, Users, TestTube2, Calendar, MoreVertical, Grid3X3, List, Pencil, Trash2, Search } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const statusColors: Record<string, string> = {
  Active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  Completed: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  'On Hold': 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  Planning: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
};

function ProjectCard({ p, onEdit, onDelete }: { p: Project; onEdit: (p: Project) => void; onDelete: (p: Project) => void }) {
  return (
    <Card className="border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 transition-colors group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-semibold text-white truncate">{p.name}</CardTitle>
            <p className="text-sm text-zinc-400 mt-1 line-clamp-2">{p.description}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-zinc-400">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-700">
              <DropdownMenuItem onClick={() => onEdit(p)} className="text-zinc-300 focus:bg-zinc-800 focus:text-white">
                <Pencil className="w-4 h-4 mr-2" />Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(p)} className="text-red-400 focus:bg-zinc-800 focus:text-red-300">
                <Trash2 className="w-4 h-4 mr-2" />Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <Badge variant="outline" className={statusColors[p.status]}>{p.status}</Badge>
          <div className="flex items-center gap-4 text-xs text-zinc-400">
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{p.members}</span>
            <span className="flex items-center gap-1"><TestTube2 className="w-3.5 h-3.5" />{p.testCases}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-zinc-500 mt-3">
          <Calendar className="w-3 h-3" />
          {p.createdAt}
        </div>
      </CardContent>
    </Card>
  );
}

function ProjectRow({ p, onEdit, onDelete }: { p: Project; onEdit: (p: Project) => void; onDelete: (p: Project) => void }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 transition-colors group">
      <div className="flex-1 min-w-0 mr-4">
        <div className="flex items-center gap-3">
          <p className="font-medium text-white truncate">{p.name}</p>
          <Badge variant="outline" className={statusColors[p.status] + ' shrink-0'}>{p.status}</Badge>
        </div>
        <p className="text-sm text-zinc-400 mt-0.5 truncate">{p.description}</p>
      </div>
      <div className="flex items-center gap-4 text-sm text-zinc-400 shrink-0">
        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{p.members}</span>
        <span className="flex items-center gap-1"><TestTube2 className="w-3.5 h-3.5" />{p.testCases}</span>
        <span className="flex items-center gap-1 text-zinc-500"><Calendar className="w-3.5 h-3.5" />{p.createdAt}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-zinc-400">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-700">
            <DropdownMenuItem onClick={() => onEdit(p)} className="text-zinc-300 focus:bg-zinc-800 focus:text-white">
              <Pencil className="w-4 h-4 mr-2" />Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(p)} className="text-red-400 focus:bg-zinc-800 focus:text-red-300">
              <Trash2 className="w-4 h-4 mr-2" />Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function ProjectFormDialog({ open, onClose, title, form, setForm, onSave }: {
  open: boolean; onClose: () => void; title: string;
  form: { name: string; description: string; status: Project['status'] };
  setForm: React.Dispatch<React.SetStateAction<{ name: string; description: string; status: Project['status'] }>>;
  onSave: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-700 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">{title}</DialogTitle>
          <DialogDescription className="text-zinc-400">Fill in the project details below.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-zinc-300">Project Name</Label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Enter project name" className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500" />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">Description</Label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe your project" rows={3} className="flex w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 resize-none" />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">Status</Label>
            <Select value={form.status} onValueChange={(v: Project['status']) => setForm(f => ({ ...f, status: v }))}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                <SelectItem value="Planning">Planning</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="On Hold">On Hold</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-zinc-700 text-zinc-300">Cancel</Button>
          <Button onClick={onSave} disabled={!form.name.trim()} className="bg-emerald-500 hover:bg-emerald-600 text-white">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [deleteProject, setDeleteProject] = useState<Project | null>(null);
  const [form, setForm] = useState({ name: '', description: '', status: 'Planning' as Project['status'] });

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setForm({ name: '', description: '', status: 'Planning' });
    setCreateOpen(true);
  };

  const openEdit = (p: Project) => {
    setForm({ name: p.name, description: p.description, status: p.status });
    setEditProject(p);
  };

  const handleSave = () => {
    if (editProject) {
      setProjects(prev => prev.map(p => p.id === editProject.id ? { ...p, ...form } : p));
      setEditProject(null);
    } else {
      const newP: Project = {
        id: `p${Date.now()}`,
        name: form.name,
        description: form.description,
        status: form.status,
        members: 1,
        testCases: 0,
        createdAt: new Date().toISOString().split('T')[0],
      };
      setProjects(prev => [newP, ...prev]);
      setCreateOpen(false);
    }
  };

  const handleDelete = () => {
    if (deleteProject) {
      setProjects(prev => prev.filter(p => p.id !== deleteProject.id));
      setDeleteProject(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input placeholder="Search projects..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500" />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-zinc-800 rounded-lg overflow-hidden">
            <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('grid')} className={viewMode === 'grid' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}>
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('list')} className={viewMode === 'list' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}>
              <List className="w-4 h-4" />
            </Button>
          </div>
          <Button onClick={openCreate} className="bg-emerald-500 hover:bg-emerald-600 text-white">
            <Plus className="w-4 h-4 mr-2" />Create Project
          </Button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(p => <ProjectCard key={p.id} p={p} onEdit={openEdit} onDelete={setDeleteProject} />)}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(p => <ProjectRow key={p.id} p={p} onEdit={openEdit} onDelete={setDeleteProject} />)}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-12 text-zinc-500">No projects found.</div>
      )}

      {/* Dialogs */}
      <ProjectFormDialog open={createOpen} onClose={() => setCreateOpen(false)} title="Create New Project" form={form} setForm={setForm} onSave={handleSave} />
      <ProjectFormDialog open={!!editProject} onClose={() => setEditProject(null)} title="Edit Project" form={form} setForm={setForm} onSave={handleSave} />

      <AlertDialog open={!!deleteProject} onOpenChange={() => setDeleteProject(null)}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Project</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Are you sure you want to delete &quot;{deleteProject?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-zinc-700 text-zinc-300">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}