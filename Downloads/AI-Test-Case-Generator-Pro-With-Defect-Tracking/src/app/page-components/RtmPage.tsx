'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { mockProjects, mockRtmEntries } from '@/lib/mock-data';
import { Sparkles, CheckCircle2, AlertTriangle, XCircle, Shield } from 'lucide-react';

const coverageColors: Record<string, string> = {
  'Covered': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  'Partially Covered': 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  'Not Covered': 'bg-red-500/15 text-red-400 border-red-500/20',
};

export default function RtmPage() {
  const [projectFilter, setProjectFilter] = useState('all');
  const [isGenerating, setIsGenerating] = useState(false);

  const entries = useMemo(() =>
    projectFilter === 'all' ? mockRtmEntries : mockRtmEntries.filter(e => e.projectId === projectFilter),
    [projectFilter]
  );

  const stats = useMemo(() => {
    const covered = entries.filter(e => e.coverage === 'Covered').length;
    const partial = entries.filter(e => e.coverage === 'Partially Covered').length;
    const notCovered = entries.filter(e => e.coverage === 'Not Covered').length;
    const total = entries.length;
    return {
      covered, partial, notCovered, total,
      coveredPct: total ? Math.round((covered / total) * 100) : 0,
      partialPct: total ? Math.round((partial / total) * 100) : 0,
      notPct: total ? Math.round((notCovered / total) * 100) : 0,
    };
  }, [entries]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    await new Promise(r => setTimeout(r, 2000));
    setIsGenerating(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-full sm:w-[250px] bg-zinc-900 border-zinc-800 text-white">
            <SelectValue placeholder="All Projects" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-700">
            <SelectItem value="all">All Projects</SelectItem>
            {mockProjects.map(p => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}
          </SelectContent>
        </Select>
        <Button onClick={handleGenerate} disabled={isGenerating} className="bg-emerald-500 hover:bg-emerald-600 text-white">
          <Sparkles className="w-4 h-4 mr-2" />
          {isGenerating ? 'Auto-Generating...' : 'Auto-Generate RTM'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.covered}</p>
                <p className="text-sm text-zinc-400">Covered ({stats.coveredPct}%)</p>
              </div>
            </div>
            <Progress value={stats.coveredPct} className="mt-3 h-2 [&>div]:bg-emerald-500" />
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.partial}</p>
                <p className="text-sm text-zinc-400">Partially Covered ({stats.partialPct}%)</p>
              </div>
            </div>
            <Progress value={stats.partialPct} className="mt-3 h-2 [&>div]:bg-amber-500" />
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-500/10">
                <XCircle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.notCovered}</p>
                <p className="text-sm text-zinc-400">Not Covered ({stats.notPct}%)</p>
              </div>
            </div>
            <Progress value={stats.notPct} className="mt-3 h-2 [&>div]:bg-red-500" />
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10">
                <Shield className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
                <p className="text-sm text-zinc-400">Total Requirements</p>
              </div>
            </div>
            <Progress value={stats.coveredPct + stats.partialPct} className="mt-3 h-2 [&>div]:bg-emerald-500" />
          </CardContent>
        </Card>
      </div>

      {/* RTM Table */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-white">Requirements Traceability Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent bg-zinc-800/30">
                  <TableHead className="text-zinc-400 font-medium text-xs">Req ID</TableHead>
                  <TableHead className="text-zinc-400 font-medium text-xs">Requirement</TableHead>
                  <TableHead className="text-zinc-400 font-medium text-xs hidden md:table-cell">Scenario ID</TableHead>
                  <TableHead className="text-zinc-400 font-medium text-xs hidden lg:table-cell">Test Case ID</TableHead>
                  <TableHead className="text-zinc-400 font-medium text-xs">Coverage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map(entry => (
                  <TableRow key={entry.id} className="border-zinc-800 hover:bg-zinc-800/50">
                    <TableCell className="text-sm font-mono text-emerald-400">{entry.requirementId}</TableCell>
                    <TableCell className="text-sm text-white max-w-[300px] truncate">{entry.requirement}</TableCell>
                    <TableCell className="text-sm text-zinc-400 font-mono hidden md:table-cell">{entry.scenarioId}</TableCell>
                    <TableCell className="text-sm text-zinc-400 font-mono hidden lg:table-cell">{entry.testCaseId}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={coverageColors[entry.coverage]}>{entry.coverage}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {entries.length === 0 && (
            <div className="text-center py-12 text-zinc-500">No RTM entries found.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}