'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ScoreRing } from '@/components/shared/progress-ring';
import { MetricCard } from '@/components/shared/stat-card';
import { DashboardSkeleton } from '@/components/shared/loading-skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { useDashboardStore } from '@/store/use-dashboard-store';
import api from '@/services/api';
import {
  Dumbbell,
  BookOpen,
  GraduationCap,
  Moon,
  UtensilsCrossed,
  Droplets,
  Receipt,
  CheckSquare,
  Plus,
  TrendingUp,
  Clock,
  Flame,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { format, formatDuration, intervalToDuration } from 'date-fns';
import { toast } from 'sonner';

// Quick Add Dialog Component
function QuickAddDialog() {
  const [open, setOpen] = useState(false);

  const quickActions = [
    { label: 'Workout', href: '/fitness', icon: <Dumbbell className="w-5 h-5" />, color: '#f97316' },
    { label: 'Learning', href: '/learning', icon: <BookOpen className="w-5 h-5" />, color: '#3b82f6' },
    { label: 'Interview Prep', href: '/interview', icon: <GraduationCap className="w-5 h-5" />, color: '#8b5cf6' },
    { label: 'Sleep', href: '/sleep', icon: <Moon className="w-5 h-5" />, color: '#6366f1' },
    { label: 'Food', href: '/food', icon: <UtensilsCrossed className="w-5 h-5" />, color: '#ef4444' },
    { label: 'Water', href: '/water', icon: <Droplets className="w-5 h-5" />, color: '#06b6d4' },
    { label: 'Expense', href: '/expenses', icon: <Receipt className="w-5 h-5" />, color: '#f59e0b' },
    { label: 'Journal', href: '/journal', icon: <CheckSquare className="w-5 h-5" />, color: '#10b981' },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="fixed bottom-24 lg:bottom-8 right-4 lg:right-8 w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/30 z-40 p-0"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl p-0 max-w-sm">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-lg">Quick Add</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2 p-4 pt-2">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                style={{ backgroundColor: `${action.color}15`, color: action.color }}
              >
                {action.icon}
              </div>
              <span className="font-medium text-sm text-gray-700">{action.label}</span>
            </Link>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Timeline Item Component
interface TimelineItem {
  time: string;
  title: string;
  type: string;
  icon: React.ReactNode;
  color: string;
}

function TimelineItem({ item }: { item: TimelineItem }) {
  return (
    <div className="flex gap-4 group">
      {/* Time */}
      <div className="flex-shrink-0 w-16 text-right">
        <span className="text-xs font-medium text-gray-500">{item.time}</span>
      </div>

      {/* Line */}
      <div className="relative flex flex-col items-center">
        <div
          className="w-3 h-3 rounded-full border-2 border-white shadow-sm z-10"
          style={{ backgroundColor: item.color }}
        />
        <div className="w-0.5 h-full bg-gray-100 absolute top-3" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-4">
        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 group-hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2">
            <span style={{ color: item.color }}>{item.icon}</span>
            <span className="font-medium text-sm text-gray-800">{item.title}</span>
          </div>
          <span className="text-xs text-gray-400 mt-1 block">{item.type}</span>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading, error, setData, setLoading, setError } = useDashboardStore();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const dashboardData = await api.dashboard.getToday();
        setData(dashboardData);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data');
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [setData, setLoading, setError]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <EmptyState
        icon={<TrendingUp className="w-8 h-8" />}
        title="Something went wrong"
        description={error}
        actionLabel="Try Again"
        onAction={() => window.location.reload()}
      />
    );
  }

  if (!data) {
    return null;
  }

  // Calculate daily score based on data
  const calculateScore = () => {
    let score = 0;
    let count = 0;

    // Fitness (20%)
    const fitnessPct = Math.min(100, (data.fitness.totals.workoutDuration / data.fitness.goal) * 100);
    score += fitnessPct * 0.2;
    count++;

    // Learning (15%)
    const learningPct = Math.min(100, (data.learning.totalDuration / data.learning.goal) * 100);
    score += learningPct * 0.15;
    count++;

    // Interview (20%)
    const interviewPct = Math.min(100, (data.interview.totalDuration / data.interview.goal) * 100);
    score += interviewPct * 0.2;
    count++;

    // Sleep (15%)
    const sleepPct = Math.min(100, (data.sleep.totalMinutes / data.sleep.goal) * 100);
    score += sleepPct * 0.15;
    count++;

    // Water (10%)
    const waterPct = Math.min(100, (data.hydration.totalMl / data.hydration.goal) * 100);
    score += waterPct * 0.1;
    count++;

    // Protein (10%)
    const proteinPct = Math.min(100, (data.nutrition.totals.protein / data.nutrition.proteinGoal) * 100);
    score += proteinPct * 0.1;
    count++;

    // Habits (10%)
    if (data.habits.totalCount > 0) {
      const habitsPct = (data.habits.completedCount / data.habits.totalCount) * 100;
      score += habitsPct * 0.1;
    }

    return Math.round(score);
  };

  const dailyScore = calculateScore();

  // Format duration helper
  const formatMins = (mins: number) => {
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h${remainingMins > 0 ? ` ${remainingMins}m` : ''}`;
  };

  // Build timeline from today's activities
  const buildTimeline = (): TimelineItem[] => {
    const items: TimelineItem[] = [];

    data.fitness.entries.forEach((entry: any) => {
      if (entry.workoutDuration && entry.workoutDuration > 0) {
        items.push({
          time: entry.createdAt ? format(new Date(entry.createdAt), 'hh:mm a') : '--:--',
          title: `${formatMins(entry.workoutDuration)} Workout`,
          type: entry.workoutType || 'Exercise',
          icon: <Dumbbell className="w-4 h-4" />,
          color: '#f97316',
        });
      }
    });

    data.learning.sessions.forEach((session: any) => {
      if (session.duration && session.duration > 0) {
        items.push({
          time: session.startTime ? format(new Date(session.startTime), 'hh:mm a') : '--:--',
          title: `${formatMins(session.duration)} - ${session.topic}`,
          type: session.category || 'Learning',
          icon: <BookOpen className="w-4 h-4" />,
          color: '#3b82f6',
        });
      }
    });

    data.interview.sessions.forEach((session: any) => {
      if (session.duration && session.duration > 0) {
        items.push({
          time: session.startTime ? format(new Date(session.startTime), 'hh:mm a') : '--:--',
          title: `${formatMins(session.duration)} - ${session.topic}`,
          type: session.category || 'Interview Prep',
          icon: <GraduationCap className="w-4 h-4" />,
          color: '#8b5cf6',
        });
      }
    });

    // Sort by time
    return items.sort((a, b) => a.time.localeCompare(b.time));
  };

  const timelineItems = buildTimeline();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Daily Score Section */}
      <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-white overflow-hidden">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <ScoreRing score={dailyScore} size={160} strokeWidth={12} />
            <div className="text-center md:text-left flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Today&apos;s Progress
              </h2>
              <p className="text-gray-500 mb-4">
                You&apos;re doing great! Keep pushing towards your goals.
              </p>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                {dailyScore >= 80 && (
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                    🎯 On Track!
                  </span>
                )}
                {dailyScore >= 50 && dailyScore < 80 && (
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                    💪 Good Progress
                  </span>
                )}
                {dailyScore < 50 && (
                  <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                    🚀 Room for Improvement
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Fitness */}
        <MetricCard
          label="Fitness"
          current={data.fitness.totals.workoutDuration}
          goal={data.fitness.goal}
          unit="min"
          icon={<Dumbbell className="w-4 h-4 text-orange-500" />}
          color="#f97316"
          completed={data.fitness.completed}
        />

        {/* Learning */}
        <MetricCard
          label="Learning"
          current={Math.round(data.learning.totalDuration)}
          goal={data.learning.goal}
          unit="min"
          icon={<BookOpen className="w-4 h-4 text-blue-500" />}
          color="#3b82f6"
          completed={data.learning.completed}
        />

        {/* Interview */}
        <MetricCard
          label="Interview Prep"
          current={Math.round(data.interview.totalDuration)}
          goal={data.interview.goal}
          unit="min"
          icon={<GraduationCap className="w-4 h-4 text-purple-500" />}
          color="#8b5cf6"
          completed={data.interview.completed}
        />

        {/* Sleep */}
        <MetricCard
          label="Sleep"
          current={Math.round(data.sleep.totalMinutes / 60 * 10) / 10}
          goal={Math.round(data.sleep.goal / 60 * 10) / 10}
          unit="hr"
          icon={<Moon className="w-4 h-4 text-indigo-500" />}
          color="#6366f1"
          completed={data.sleep.totalMinutes >= data.sleep.goal}
        />

        {/* Protein */}
        <MetricCard
          label="Protein"
          current={data.nutrition.totals.protein}
          goal={data.nutrition.proteinGoal}
          unit="g"
          icon={<Flame className="w-4 h-4 text-red-500" />}
          color="#ef4444"
          completed={data.nutrition.totals.protein >= data.nutrition.proteinGoal}
        />

        {/* Water */}
        <MetricCard
          label="Water"
          current={Math.round(data.hydration.totalMl / 1000 * 10) / 10}
          goal={Math.round(data.hydration.goal / 1000 * 10) / 10}
          unit="L"
          icon={<Droplets className="w-4 h-4 text-cyan-500" />}
          color="#06b6d4"
          completed={data.hydration.completed}
        />

        {/* Expenses */}
        <Link href="/expenses" className="col-span-1">
          <MetricCard
            label="Expenses"
            current={data.expenses.total}
            goal={0}
            unit=""
            icon={<Receipt className="w-4 h-4 text-amber-500" />}
            color="#f59e0b"
          >
            <span className="text-xs text-gray-400">
              {data.expenses.currency}{data.expenses.total} today
            </span>
          </MetricCard>
        </Link>

        {/* Habits */}
        <Link href="/habits" className="col-span-1">
          <MetricCard
            label="Habits"
            current={data.habits.completedCount}
            goal={data.habits.totalCount}
            unit=""
            icon={<CheckSquare className="w-4 h-4 text-emerald-500" />}
            color="#10b981"
            completed={data.habits.allCompleted}
          />
        </Link>
      </div>

      {/* Today's Timeline */}
      <Card className="rounded-2xl border-0 shadow-sm bg-white">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-400" />
              Today&apos;s Timeline
            </CardTitle>
            <Link href="/today">
              <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700">
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {timelineItems.length === 0 ? (
            <EmptyState
              icon={<Clock className="w-8 h-8" />}
              title="No activities yet"
              description="Start tracking your day by adding your first activity!"
              actionLabel="Add Activity"
              onAction={() => document.querySelector('[data-state="open"]')?.dispatchEvent(new Event('click'))}
            />
          ) : (
            <div className="max-h-80 overflow-y-auto pr-2">
              {timelineItems.map((item, index) => (
                <TimelineItem key={index} item={item} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Add FAB */}
      <QuickAddDialog />
    </div>
  );
}
