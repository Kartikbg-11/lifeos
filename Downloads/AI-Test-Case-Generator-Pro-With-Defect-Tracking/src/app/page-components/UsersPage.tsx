'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mockUsers, type User } from '@/lib/mock-data';
import { Plus, Pencil, Search, UserCircle } from 'lucide-react';

const roleColors: Record<string, string> = {
  Admin: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  'QA Lead': 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  'QA Engineer': 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
  Viewer: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
};

function UserFormDialog({ open, onClose, title, form, setForm, onSave }: {
  open: boolean; onClose: () => void; title: string;
  form: { name: string; email: string; role: User['role'] };
  setForm: React.Dispatch<React.SetStateAction<{ name: string; email: string; role: User['role'] }>>;
  onSave: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-700 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">{title}</DialogTitle>
          <DialogDescription className="text-zinc-400">Fill in the user details below.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-zinc-300">Full Name</Label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="John Smith" className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500" />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">Email</Label>
            <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="john@company.com" className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500" />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">Role</Label>
            <Select value={form.role} onValueChange={(v: User['role']) => setForm(f => ({ ...f, role: v }))}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="QA Lead">QA Lead</SelectItem>
                <SelectItem value="QA Engineer">QA Engineer</SelectItem>
                <SelectItem value="Viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-zinc-700 text-zinc-300">Cancel</Button>
          <Button onClick={onSave} disabled={!form.name.trim() || !form.email.trim()} className="bg-emerald-500 hover:bg-emerald-600 text-white">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState({ name: '', email: '', role: 'QA Engineer' as User['role'] });

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setForm({ name: '', email: '', role: 'QA Engineer' });
    setCreateOpen(true);
  };

  const openEdit = (u: User) => {
    setEditUser(u);
    setForm({ name: u.name, email: u.email, role: u.role });
  };

  const handleSave = () => {
    if (editUser) {
      setUsers(prev => prev.map(u => u.id === editUser.id ? { ...u, ...form } : u));
      setEditUser(null);
    } else {
      const newUser: User = {
        id: `u${Date.now()}`,
        name: form.name,
        email: form.email,
        role: form.role,
        status: 'Active',
        lastActive: 'Just now',
      };
      setUsers(prev => [newUser, ...prev]);
      setCreateOpen(false);
    }
  };

  const toggleStatus = (id: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: u.status === 'Active' ? 'Inactive' as const : 'Active' as const } : u));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500" />
        </div>
        <Button onClick={openCreate} className="bg-emerald-500 hover:bg-emerald-600 text-white">
          <Plus className="w-4 h-4 mr-2" />Create User
        </Button>
      </div>

      {/* Table */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent bg-zinc-800/30">
                  <TableHead className="text-zinc-400 font-medium text-xs">User</TableHead>
                  <TableHead className="text-zinc-400 font-medium text-xs hidden sm:table-cell">Email</TableHead>
                  <TableHead className="text-zinc-400 font-medium text-xs">Role</TableHead>
                  <TableHead className="text-zinc-400 font-medium text-xs">Status</TableHead>
                  <TableHead className="text-zinc-400 font-medium text-xs hidden md:table-cell">Last Active</TableHead>
                  <TableHead className="text-zinc-400 font-medium text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(user => (
                  <TableRow key={user.id} className="border-zinc-800 hover:bg-zinc-800/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                          <UserCircle className="w-5 h-5 text-emerald-400" />
                        </div>
                        <span className="text-sm font-medium text-white">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-zinc-400 hidden sm:table-cell">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={roleColors[user.role]}>{user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={user.status === 'Active'}
                          onCheckedChange={() => toggleStatus(user.id)}
                          className="data-[state=checked]:bg-emerald-500"
                        />
                        <span className={`text-xs ${user.status === 'Active' ? 'text-emerald-400' : 'text-zinc-500'}`}>
                          {user.status}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-zinc-400 hidden md:table-cell">{user.lastActive}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white" onClick={() => openEdit(user)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <UserFormDialog open={createOpen} onClose={() => setCreateOpen(false)} title="Create User" form={form} setForm={setForm} onSave={handleSave} />
      <UserFormDialog open={!!editUser} onClose={() => setEditUser(null)} title="Edit User" form={form} setForm={setForm} onSave={handleSave} />
    </div>
  );
}