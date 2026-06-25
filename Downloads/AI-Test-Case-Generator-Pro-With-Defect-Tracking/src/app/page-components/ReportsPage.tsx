'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent
} from '@/components/ui/chart';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { mockTestCases, dashboardChartData } from '@/lib/mock-data';
import { Download, TestTube2, FileText, CheckCircle2, Zap, TrendingUp } from 'lucide-react';

const priorityData = [
  { priority: 'Critical', count: mockTestCases.filter(tc => tc.priority === 'Critical').length, fill: '#ef4444' },
  { priority: 'High', count: mockTestCases.filter(tc => tc.priority === 'High').length, fill: '#f59e0b' },
  { priority: 'Medium', count: mockTestCases.filter(tc => tc.priority === 'Medium').length, fill: '#10b981' },
  { priority: 'Low', count: mockTestCases.filter(tc => tc.priority === 'Low').length, fill: '#71717a' },
];

const typeData = [
  { name: 'Functional', value: 142, fill: '#10b981' },
  { name: 'Integration', value: 68, fill: '#f59e0b' },
  { name: 'Regression', value: 45, fill: '#8b5cf6' },
  { name: 'API', value: 38, fill: '#06b6d4' },
  { name: 'Performance', value: 25, fill: '#ef4444' },
  { name: 'Security', value: 24, fill: '#ec4899' },
];

const automationData = [
  { name: 'Automated', value: 145, fill: '#10b981' },
  { name: 'Manual', value: 132, fill: '#71717a' },
  { name: 'Semi-Automated', value: 42, fill: '#f59e0b' },
  { name: 'Not Set', value: 23, fill: '#3f3f46' },
];

const severityData = [
  { severity: 'Critical', count: mockTestCases.filter(tc => tc.severity === 'Critical').length, fill: '#ef4444' },
  { severity: 'Major', count: mockTestCases.filter(tc => tc.severity === 'Major').length, fill: '#f59e0b' },
  { severity: 'Minor', count: mockTestCases.filter(tc => tc.severity === 'Minor').length, fill: '#3b82f6' },
  { severity: 'Trivial', count: mockTestCases.filter(tc => tc.severity === 'Trivial').length, fill: '#71717a' },
];

const priorityConfig = { Critical: { label: 'Critical', color: '#ef4444' }, High: { label: 'High', color: '#f59e0b' }, Medium: { label: 'Medium', color: '#10b981' }, Low: { label: 'Low', color: '#71717a' } };
const typeConfig = { Functional: { label: 'Functional', color: '#10b981' }, Integration: { label: 'Integration', color: '#f59e0b' }, Regression: { label: 'Regression', color: '#8b5cf6' }, API: { label: 'API', color: '#06b6d4' }, Performance: { label: 'Performance', color: '#ef4444' }, Security: { label: 'Security', color: '#ec4899' } };
const autoConfig = { Automated: { label: 'Automated', color: '#10b981' }, Manual: { label: 'Manual', color: '#71717a' }, 'Semi-Automated': { label: 'Semi-Automated', color: '#f59e0b' }, 'Not Set': { label: 'Not Set', color: '#3f3f46' } };
const sevConfig = { Critical: { label: 'Critical', color: '#ef4444' }, Major: { label: 'Major', color: '#f59e0b' }, Minor: { label: 'Minor', color: '#3b82f6' }, Trivial: { label: 'Trivial', color: '#71717a' } };

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10"><TestTube2 className="w-5 h-5 text-emerald-400" /></div>
              <div>
                <p className="text-2xl font-bold text-white">342</p>
                <p className="text-sm text-zinc-400">Total Test Cases</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10"><FileText className="w-5 h-5 text-cyan-400" /></div>
              <div>
                <p className="text-2xl font-bold text-white">48</p>
                <p className="text-sm text-zinc-400">Documents Processed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-green-500/10"><CheckCircle2 className="w-5 h-5 text-green-400" /></div>
              <div>
                <p className="text-2xl font-bold text-white">72%</p>
                <p className="text-sm text-zinc-400">Requirements Covered</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10"><Zap className="w-5 h-5 text-amber-400" /></div>
              <div>
                <p className="text-2xl font-bold text-white">68%</p>
                <p className="text-sm text-zinc-400">Automation Coverage</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Bar Chart */}
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-white">Test Cases by Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={priorityConfig} className="h-[280px] w-full">
              <BarChart data={priorityData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="priority" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={50}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Type Pie Chart */}
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-white">Test Cases by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={typeConfig} className="h-[280px] w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie data={typeData} cx="50%" cy="45%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value">
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent nameKey="name" />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Automation Donut */}
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-white">Automation Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={autoConfig} className="h-[280px] w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie data={automationData} cx="50%" cy="45%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {automationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent nameKey="name" />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Severity Bar Chart */}
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-white">Severity Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={sevConfig} className="h-[280px] w-full">
              <BarChart data={severityData} layout="vertical" margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis type="number" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="severity" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={30}>
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Export */}
      <div className="flex justify-end">
        <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
          <Download className="w-4 h-4 mr-2" />Export Full Report
        </Button>
      </div>
    </div>
  );
}