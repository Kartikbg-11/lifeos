'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { mockProjects, mockTestCases, type TestCase } from '@/lib/mock-data';
import { Search, Filter, ChevronDown, ChevronRight, Pencil, Download, MoreVertical, Trash2, X } from 'lucide-react';

const priorityColors: Record<string, string> = { Critical: 'bg-red-500/15 text-red-400 border-red-500/20', High: 'bg-amber-500/15 text-amber-400 border-amber-500/20', Medium: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20', Low: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20' };
const severityColors: Record<string, string> = { Critical: 'bg-red-500/15 text-red-400 border-red-500/20', Major: 'bg-amber-500/15 text-amber-400 border-amber-500/20', Minor: 'bg-blue-500/15 text-blue-400 border-blue-500/20', Trivial: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20' };
const statusColors: Record<string, string> = { Draft: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20', Ready: 'bg-amber-500/15 text-amber-400 border-amber-500/20', Approved: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20', Deprecated: 'bg-red-500/15 text-red-400 border-red-500/20' };
const automationColors: Record<string, string> = { Automated: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20', Manual: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20', 'Semi-Automated': 'bg-amber-500/15 text-amber-400 border-amber-500/20', 'Not Set': 'bg-zinc-700/50 text-zinc-500 border-zinc-600/50' };

export default function TestCasesPage() {
  const [testCases, setTestCases] = useState<TestCase[]>(mockTestCases);
  const [projectFilter, setProjectFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editTc, setEditTc] = useState<TestCase | null>(null);
  const [editForm, setEditForm] = useState<Partial<TestCase>>({});
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => testCases.filter(tc => {
    const matchProject = projectFilter === 'all' || tc.projectId === projectFilter;
    const matchSearch = tc.title.toLowerCase().includes(search.toLowerCase()) || tc.tcId.toLowerCase().includes(search.toLowerCase()) || tc.module.toLowerCase().includes(search.toLowerCase());
    const matchPriority = priorityFilter === 'all' || tc.priority === priorityFilter;
    const matchSeverity = severityFilter === 'all' || tc.severity === severityFilter;
    const matchType = typeFilter === 'all' || tc.type === typeFilter;
    const matchStatus = statusFilter === 'all' || tc.status === statusFilter;
    return matchProject && matchSearch && matchPriority && matchSeverity && matchType && matchStatus;
  }), [testCases, projectFilter, search, priorityFilter, severityFilter, typeFilter, statusFilter]);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(tc => tc.id)));
  };

  const openEdit = (tc: TestCase) => {
    setEditTc(tc);
    setEditForm({ priority: tc.priority, severity: tc.severity, status: tc.status, type: tc.type, automation: tc.automation });
  };

  const saveEdit = () => {
    if (editTc) {
      setTestCases(prev => prev.map(tc => tc.id === editTc.id ? { ...tc, ...editForm } : tc));
      setEditTc(null);
    }
  };

  const bulkUpdateStatus = (status: TestCase['status']) => {
    setTestCases(prev => prev.map(tc => selected.has(tc.id) ? { ...tc, status } : tc));
    setSelected(new Set());
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input placeholder="Search test cases..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500" />
          </div>
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-full sm:w-[200px] bg-zinc-900 border-zinc-800 text-white">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              <SelectItem value="all">All Projects</SelectItem>
              {mockProjects.map(p => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-300">
                  Bulk Update ({selected.size})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-zinc-900 border-zinc-700">
                <DropdownMenuItem onClick={() => bulkUpdateStatus('Draft')} className="text-zinc-300">Set as Draft</DropdownMenuItem>
                <DropdownMenuItem onClick={() => bulkUpdateStatus('Ready')} className="text-zinc-300">Set as Ready</DropdownMenuItem>
                <DropdownMenuItem onClick={() => bulkUpdateStatus('Approved')} className="text-zinc-300">Set as Approved</DropdownMenuItem>
                <DropdownMenuSeparator className="bg-zinc-700" />
                <DropdownMenuItem onClick={() => setSelected(new Set())} className="text-red-400">Clear Selection</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button variant="outline" size="icon" className={`border-zinc-700 ${showFilters ? 'bg-zinc-800 text-white' : 'text-zinc-400'}`} onClick={() => setShowFilters(f => !f)}>
            <Filter className="w-4 h-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-300"><Download className="w-4 h-4 mr-2" />Export</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-zinc-900 border-zinc-700">
              <DropdownMenuItem className="text-zinc-300">Export as CSV</DropdownMenuItem>
              <DropdownMenuItem className="text-zinc-300">Export as Excel</DropdownMenuItem>
              <DropdownMenuItem className="text-zinc-300">Export as PDF</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {showFilters && (
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-white">Filters</p>
              <Button variant="ghost" size="sm" className="text-zinc-400 h-7 text-xs" onClick={() => { setPriorityFilter('all'); setSeverityFilter('all'); setTypeFilter('all'); setStatusFilter('all'); }}>
                Clear All
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white text-sm h-9"><SelectValue placeholder="Priority" /></SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700"><SelectItem value="all">All Priority</SelectItem><SelectItem value="Critical">Critical</SelectItem><SelectItem value="High">High</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="Low">Low</SelectItem></SelectContent>
              </Select>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white text-sm h-9"><SelectValue placeholder="Severity" /></SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700"><SelectItem value="all">All Severity</SelectItem><SelectItem value="Critical">Critical</SelectItem><SelectItem value="Major">Major</SelectItem><SelectItem value="Minor">Minor</SelectItem><SelectItem value="Trivial">Trivial</SelectItem></SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white text-sm h-9"><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700"><SelectItem value="all">All Types</SelectItem><SelectItem value="Functional">Functional</SelectItem><SelectItem value="Integration">Integration</SelectItem><SelectItem value="Regression">Regression</SelectItem><SelectItem value="API">API</SelectItem><SelectItem value="Performance">Performance</SelectItem><SelectItem value="Security">Security</SelectItem><SelectItem value="UI">UI</SelectItem></SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white text-sm h-9"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700"><SelectItem value="all">All Status</SelectItem><SelectItem value="Draft">Draft</SelectItem><SelectItem value="Ready">Ready</SelectItem><SelectItem value="Approved">Approved</SelectItem><SelectItem value="Deprecated">Deprecated</SelectItem></SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent bg-zinc-800/30">
                  <TableHead className="w-10"><Checkbox checked={selected.size === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} /></TableHead>
                  <TableHead className="text-zinc-400 font-medium text-xs">TC ID</TableHead>
                  <TableHead className="text-zinc-400 font-medium text-xs">Module</TableHead>
                  <TableHead className="text-zinc-400 font-medium text-xs">Title</TableHead>
                  <TableHead className="text-zinc-400 font-medium text-xs hidden lg:table-cell">Priority</TableHead>
                  <TableHead className="text-zinc-400 font-medium text-xs hidden xl:table-cell">Severity</TableHead>
                  <TableHead className="text-zinc-400 font-medium text-xs hidden xl:table-cell">Type</TableHead>
                  <TableHead className="text-zinc-400 font-medium text-xs hidden lg:table-cell">Status</TableHead>
                  <TableHead className="text-zinc-400 font-medium text-xs hidden md:table-cell">Auto</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(tc => (
                  <Collapsible key={tc.id} open={expandedId === tc.id} onOpenChange={(open) => setExpandedId(open ? tc.id : null)}>
                    <CollapsibleTrigger asChild>
                      <TableRow className="border-zinc-800 hover:bg-zinc-800/50 cursor-pointer">
                        <TableCell onClick={e => e.stopPropagation()}>
                          <Checkbox checked={selected.has(tc.id)} onCheckedChange={() => toggleSelect(tc.id)} />
                        </TableCell>
                        <TableCell className="text-sm font-mono text-emerald-400">{tc.tcId}</TableCell>
                        <TableCell className="text-sm text-zinc-300">{tc.module}</TableCell>
                        <TableCell className="text-sm text-white font-medium max-w-[250px] truncate">{tc.title}</TableCell>
                        <TableCell className="hidden lg:table-cell"><Badge variant="outline" className={priorityColors[tc.priority]}>{tc.priority}</Badge></TableCell>
                        <TableCell className="hidden xl:table-cell"><Badge variant="outline" className={severityColors[tc.severity]}>{tc.severity}</Badge></TableCell>
                        <TableCell className="hidden xl:table-cell text-sm text-zinc-400">{tc.type}</TableCell>
                        <TableCell className="hidden lg:table-cell"><Badge variant="outline" className={statusColors[tc.status]}>{tc.status}</Badge></TableCell>
                        <TableCell className="hidden md:table-cell"><Badge variant="outline" className={automationColors[tc.automation]}>{tc.automation}</Badge></TableCell>
                        <TableCell>
                          {expandedId === tc.id ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronRight className="w-4 h-4 text-zinc-400" />}
                        </TableCell>
                      </TableRow>
                    </CollapsibleTrigger>
                    <CollapsibleContent asChild>
                      <TableRow>
                        <TableCell colSpan={10} className="p-0">
                          <div className="bg-zinc-800/30 p-4 border-b border-zinc-800">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Preconditions</p>
                                <p className="text-sm text-zinc-300">{tc.preconditions}</p>
                              </div>
                              <div>
                                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Expected Result</p>
                                <p className="text-sm text-zinc-300">{tc.expected}</p>
                              </div>
                              <div className="md:col-span-2">
                                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Steps</p>
                                <pre className="text-sm text-zinc-300 whitespace-pre-wrap font-sans">{tc.steps}</pre>
                              </div>
                              {tc.notes && (
                                <div>
                                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Notes</p>
                                  <p className="text-sm text-zinc-400">{tc.notes}</p>
                                </div>
                              )}
                            </div>
                            <div className="flex justify-end mt-3">
                              <Button size="sm" variant="outline" className="border-zinc-700 text-zinc-300" onClick={() => openEdit(tc)}>
                                <Pencil className="w-3 h-3 mr-1" />Edit
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </TableBody>
            </Table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-zinc-500">No test cases found.</div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-zinc-500 text-right">Showing {filtered.length} of {testCases.length} test cases</p>

      {/* Edit Dialog */}
      <Dialog open={!!editTc} onOpenChange={() => setEditTc(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-700 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Test Case {editTc?.tcId}</DialogTitle>
            <DialogDescription className="text-zinc-400">Update the test case properties.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-2">
              <p className="text-sm text-zinc-300">Priority</p>
              <Select value={editForm.priority} onValueChange={(v: TestCase['priority']) => setEditForm(f => ({ ...f, priority: v }))}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white text-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700"><SelectItem value="Critical">Critical</SelectItem><SelectItem value="High">High</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="Low">Low</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-zinc-300">Severity</p>
              <Select value={editForm.severity} onValueChange={(v: TestCase['severity']) => setEditForm(f => ({ ...f, severity: v }))}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white text-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700"><SelectItem value="Critical">Critical</SelectItem><SelectItem value="Major">Major</SelectItem><SelectItem value="Minor">Minor</SelectItem><SelectItem value="Trivial">Trivial</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-zinc-300">Type</p>
              <Select value={editForm.type} onValueChange={(v: TestCase['type']) => setEditForm(f => ({ ...f, type: v }))}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white text-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700"><SelectItem value="Functional">Functional</SelectItem><SelectItem value="Integration">Integration</SelectItem><SelectItem value="Regression">Regression</SelectItem><SelectItem value="API">API</SelectItem><SelectItem value="Performance">Performance</SelectItem><SelectItem value="Security">Security</SelectItem><SelectItem value="UI">UI</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-zinc-300">Status</p>
              <Select value={editForm.status} onValueChange={(v: TestCase['status']) => setEditForm(f => ({ ...f, status: v }))}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white text-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700"><SelectItem value="Draft">Draft</SelectItem><SelectItem value="Ready">Ready</SelectItem><SelectItem value="Approved">Approved</SelectItem><SelectItem value="Deprecated">Deprecated</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <p className="text-sm text-zinc-300">Automation</p>
              <Select value={editForm.automation} onValueChange={(v: TestCase['automation']) => setEditForm(f => ({ ...f, automation: v }))}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white text-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700"><SelectItem value="Automated">Automated</SelectItem><SelectItem value="Manual">Manual</SelectItem><SelectItem value="Semi-Automated">Semi-Automated</SelectItem><SelectItem value="Not Set">Not Set</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTc(null)} className="border-zinc-700 text-zinc-300">Cancel</Button>
            <Button onClick={saveEdit} className="bg-emerald-500 hover:bg-emerald-600 text-white">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}