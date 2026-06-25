'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockProjects, mockActivities, dashboardChartData } from '@/lib/mock-data';
import {
  FolderOpen, FileText, TestTube2, Zap, Plus, Upload, Sparkles,
  TrendingUp, Clock, UserPlus, CheckCircle2
} from 'lucide-react';
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent
} from '@/components/ui/chart';
import { LineChart, Line, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Area, AreaChart } from 'recharts';

interface DashboardPageProps {
  onNavigate: (page: string) => void;
}

const lineConfig = {
  cases: { label: 'Test Cases', color: '#10b981' },
};

const pieConfig = {
  Functional: { label: 'Functional', color: '#10b981' },
  Integration: { label: 'Integration', color: '#f59e0b' },
  Regression: { label: 'Regression', color: '#8b5cf6' },
  API: { label: 'API', color: '#06b6d4' },
  Performance: { label: 'Performance', color: '#ef4444' },
  Security: { label: 'Security', color: '#ec4899' },
};

const barConfig = {
  coverage: { label: 'Coverage %', color: '#10b981' },
};

const activityIcons: Record<string, React.ReactNode> = {
  generated: <Sparkles className="w-4 h-4 text-emerald-400" />,
  uploaded: <Upload className="w-4 h-4 text-blue-400" />,
  approved: <CheckCircle2 className="w-4 h-4 text-green-400" />,
  'created project': <FolderOpen className="w-4 h-4 text-amber-400" />,
  'updated RTM for': <FileText className="w-4 h-4 text-purple-400" />,
};

export default function DashboardPage({ onNavigate }: DashboardPageProps) {
  const stats = [
    { title: 'Total Projects', value: '12', change: '+2 this month', icon: FolderOpen, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { title: 'Total Documents', value: '48', change: '+8 this month', icon: FileText, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { title: 'Test Cases Generated', value: '342', change: '+74 this month', icon: TestTube2, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { title: 'Automation Coverage', value: '68%', change: '+12% vs last month', icon: Zap, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-zinc-800 bg-zinc-900/50">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-zinc-400">{stat.title}</p>
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-zinc-500 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                    {stat.change}
                  </p>
                </div>
                <div className={`${stat.bg} p-3 rounded-xl`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart */}
        <Card className="lg:col-span-2 border-zinc-800 bg-zinc-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-white">Test Cases Generated Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={lineConfig} className="h-[280px] w-full">
              <AreaChart data={dashboardChartData.testCasesOverTime} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillCases" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="cases" stroke="#10b981" fill="url(#fillCases)" strokeWidth={2} dot={{ r: 4, fill: '#10b981' }} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-white">Test Case Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={pieConfig} className="h-[280px] w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie
                  data={dashboardChartData.testCaseDistribution}
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {dashboardChartData.testCaseDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent nameKey="name" />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <Card className="lg:col-span-2 border-zinc-800 bg-zinc-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-white">Coverage by Project</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={barConfig} className="h-[260px] w-full">
              <BarChart data={dashboardChartData.coverageByProject} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="project" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="coverage" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-white">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="mt-0.5 p-1.5 rounded-lg bg-zinc-800/80">
                  {activityIcons[activity.action] || <Clock className="w-4 h-4 text-zinc-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-200">
                    <span className="font-medium text-white">{activity.user}</span>{' '}
                    {activity.action}{' '}
                    <span className="text-zinc-400 truncate block sm:inline">{activity.target}</span>
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">{activity.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-white">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => onNavigate('projects')} variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white">
              <Plus className="w-4 h-4 mr-2" />New Project
            </Button>
            <Button onClick={() => onNavigate('documents')} variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white">
              <Upload className="w-4 h-4 mr-2" />Upload Document
            </Button>
            <Button onClick={() => onNavigate('generator')} className="bg-emerald-500 hover:bg-emerald-600 text-white">
              <Sparkles className="w-4 h-4 mr-2" />Generate Tests
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}