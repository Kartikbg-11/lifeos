'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { ListSkeleton } from '@/components/shared/loading-skeleton';
import api from '@/services/api';
import {
  CalendarDays,
  Dumbbell,
  BookOpen,
  GraduationCap,
  Moon,
  UtensilsCrossed,
  Droplets,
  Receipt,
  Plus,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface TimelineItem {
  id: string;
  type: 'fitness' | 'learning' | 'interview' | 'sleep' | 'food' | 'water' | 'expense';
  title: string;
  subtitle?: string;
  time?: string;
  amount?: string;
  icon: React.ReactNode;
  color: string;
  data: any;
}

const TYPE_CONFIG = {
  fitness: { icon: <Dumbbell className="w-5 h-5" />, color: '#f97316', label: 'Workout' },
  learning: { icon: <BookOpen className="w-5 h-5" />, color: '#3b82f6', label: 'Learning' },
  interview: { icon: <GraduationCap className="w-5 h-5" />, color: '#8b5cf6', label: 'Interview Prep' },
  sleep: { icon: <Moon className="w-5 h-5" />, color: '#6366f1', label: 'Sleep' },
  food: { icon: <UtensilsCrossed className="w-5 h-5" />, color: '#ef4444', label: 'Meal' },
  water: { icon: <Droplets className="w-5 h-5" />, color: '#06b6d4', label: 'Water' },
  expense: { icon: <Receipt className="w-5 h-5" />, color: '#f59e0b', label: 'Expense' },
};

export default function TodayPage() {
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  const fetchTimelineData = async (date: string) => {
    try {
      setIsLoading(true);
      
      const [fitnessData, learningData, interviewData, sleepData, foodData, waterData, expenseData] = 
        await Promise.all([
          api.fitness.getAll({ startDate: date, endDate: date }),
          api.learning.getAll({ startDate: date, endDate: date }),
          api.interview.getAll({ startDate: date, endDate: date }),
          api.sleep.getAll({ startDate: date, endDate: date }),
          api.food.getAll({ startDate: date, endDate: date }),
          api.water.getAll({ startDate: date, endDate: date }),
          api.expenses.getAll({ startDate: date, endDate: date }),
        ]);

      const items: TimelineItem[] = [];

      // Process fitness entries
      fitnessData.forEach((entry: any) => {
        if (entry.workoutDuration && entry.workoutDuration > 0) {
          items.push({
            id: entry.id,
            type: 'fitness',
            title: `${entry.workoutDuration} min ${entry.workoutType || 'Workout'}`,
            subtitle: [
              entry.pushups > 0 && `${entry.pushups} push-ups`,
              entry.squats > 0 && `${entry.squats} squats`,
              entry.pullups > 0 && `${entry.pullups} pull-ups`,
              entry.notes,
            ].filter(Boolean).join(' • ') || undefined,
            time: entry.createdAt ? format(parseISO(entry.createdAt), 'hh:mm a') : undefined,
            ...TYPE_CONFIG.fitness,
            data: entry,
          });
        }
      });

      // Process learning sessions
      learningData.forEach((session: any) => {
        if (session.duration && session.duration > 0) {
          items.push({
            id: session.id,
            type: 'learning',
            title: session.topic || 'Learning Session',
            subtitle: session.category ? `${session.category} • ${session.duration} min` : `${session.duration} min`,
            time: session.startTime ? format(parseISO(session.startTime), 'hh:mm a') : undefined,
            ...TYPE_CONFIG.learning,
            data: session,
          });
        }
      });

      // Process interview sessions
      interviewData.forEach((session: any) => {
        if (session.duration && session.duration > 0) {
          const accuracy = session.questionsAnswered > 0 
            ? Math.round((session.correctAnswers / session.questionsAnswered) * 100)
            : null;
          
          items.push({
            id: session.id,
            type: 'interview',
            title: session.topic || 'Interview Prep',
            subtitle: [
              `${session.duration} min`,
              session.category,
              accuracy !== null && `${accuracy}% accuracy`,
            ].filter(Boolean).join(' • ') || undefined,
            time: session.startTime ? format(parseISO(session.startTime), 'hh:mm a') : undefined,
            ...TYPE_CONFIG.interview,
            data: session,
          });
        }
      });

      // Process sleep
      sleepData.forEach((entry: any) => {
        if (entry.totalMinutes) {
          const hours = Math.floor(entry.totalMinutes / 60);
          const mins = entry.totalMinutes % 60;
          items.push({
            id: entry.id,
            type: 'sleep',
            title: `Slept ${hours}h ${mins > 0 ? `${mins}m` : ''}`,
            subtitle: entry.quality ? `Quality: ${entry.quality}` : undefined,
            time: entry.sleepStart ? format(parseISO(entry.sleepStart), 'hh:mm a') : undefined,
            ...TYPE_CONFIG.sleep,
            data: entry,
          });
        }
      });

      // Process food entries
      foodData.forEach((entry: any) => {
        items.push({
          id: entry.id,
          type: 'food',
          title: entry.foodName,
          subtitle: [
            entry.mealType?.replace('-', ' '),
            entry.protein && `${entry.protein}g protein`,
            entry.calories && `${entry.calories} cal`,
          ].filter(Boolean).join(' • ') || undefined,
            time: entry.createdAt ? format(parseISO(entry.createdAt), 'hh:mm a') : undefined,
          ...TYPE_CONFIG.food,
          data: entry,
        });
      });

      // Process water entries
      waterData.forEach((entry: any) => {
        items.push({
          id: entry.id,
          type: 'water',
          title: `${entry.amount >= 1000 ? `${entry.amount / 1000}L` : `${entry.amount}ml`} Water`,
          subtitle: entry.notes || undefined,
          time: entry.createdAt ? format(parseISO(entry.createdAt), 'hh:mm a') : undefined,
          ...TYPE_CONFIG.water,
          data: entry,
        });
      });

      // Process expenses
      expenseData.forEach((entry: any) => {
        items.push({
          id: entry.id,
          type: 'expense',
          title: `₹${entry.amount.toFixed(2)}`,
          subtitle: [
            entry.category?.replace('-', ' '),
            entry.reason,
            entry.paymentMethod,
          ].filter(Boolean).join(' • ') || undefined,
          time: entry.createdAt ? format(parseISO(entry.createdAt), 'hh:mm a') : undefined,
          amount: `₹${entry.amount.toFixed(2)}`,
          ...TYPE_CONFIG.expense,
          data: entry,
        });
      });

      // Sort by time (items without time go to end)
      items.sort((a, b) => {
        if (!a.time) return 1;
        if (!b.time) return -1;
        return a.time.localeCompare(b.time);
      });

      setTimelineItems(items);
    } catch (error) {
      console.error('Failed to load timeline:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTimelineData(selectedDate);
  }, [selectedDate]);

  // Calculate summary stats for the day
  const summaryStats = (() => {
    const stats = {
      totalActivities: timelineItems.length,
      workoutMins: 0,
      learningMins: 0,
      interviewMins: 0,
      waterMl: 0,
      expenses: 0,
    };

    timelineItems.forEach(item => {
      switch (item.type) {
        case 'fitness':
          stats.workoutMins += item.data.workoutDuration || 0;
          break;
        case 'learning':
          stats.learningMins += item.data.duration || 0;
          break;
        case 'interview':
          stats.interviewMins += item.data.duration || 0;
          break;
        case 'water':
          stats.waterMl += item.data.amount || 0;
          break;
        case 'expense':
          stats.expenses += item.data.amount || 0;
          break;
      }
    });

    return stats;
  })();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarDays className="w-7 h-7 text-blue-500" />
            Today&apos;s Timeline
          </h1>
          <p className="text-gray-500 mt-1">
            Complete view of all your activities on {format(new Date(selectedDate), 'MMMM d, yyyy')}
          </p>
        </div>

        {/* Quick Add Menu */}
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 rounded-xl">
              <Plus className="w-4 h-4 mr-2" />
              Quick Add
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl p-0 max-w-sm">
            <DialogHeader className="p-4 pb-2">
              <DialogTitle>Quick Add Activity</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-2 p-4 pt-2">
              {[
                { href: '/fitness', label: 'Workout', icon: <Dumbbell className="w-5 h-5 text-orange-500" /> },
                { href: '/learning', label: 'Learning', icon: <BookOpen className="w-5 h-5 text-blue-500" /> },
                { href: '/interview', label: 'Interview', icon: <GraduationCap className="w-5 h-5 text-purple-500" /> },
                { href: '/sleep', label: 'Sleep', icon: <Moon className="w-5 h-5 text-indigo-500" /> },
                { href: '/food', label: 'Food', icon: <UtensilsCrossed className="w-5 h-5 text-red-500" /> },
                { href: '/water', label: 'Water', icon: <Droplets className="w-5 h-5 text-cyan-500" /> },
                { href: '/expenses', label: 'Expense', icon: <Receipt className="w-5 h-5 text-amber-500" /> },
                { href: '/journal', label: 'Journal', icon: <span className="text-lg">📝</span> },
              ].map((action) => (
                <a
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  {action.icon}
                  <span className="font-medium text-sm text-gray-700">{action.label}</span>
                </a>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="rounded-xl border-0 shadow-sm bg-orange-50 p-3">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-orange-500" />
            <div>
              <p className="text-xs text-gray-500">Fitness</p>
              <p className="font-bold text-gray-900">{summaryStats.workoutMins} min</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-xl border-0 shadow-sm bg-blue-50 p-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-xs text-gray-500">Learning</p>
              <p className="font-bold text-gray-900">{Math.round(summaryStats.learningMins / 60)} hrs</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-xl border-0 shadow-sm bg-purple-50 p-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-purple-500" />
            <div>
              <p className="text-xs text-gray-500">Interview</p>
              <p className="font-bold text-gray-900">{Math.round(summaryStats.interviewMins / 60)} hrs</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-xl border-0 shadow-sm bg-cyan-50 p-3">
          <div className="flex items-center gap-2">
            <Droplets className="w-5 h-5 text-cyan-500" />
            <div>
              <p className="text-xs text-gray-500">Water</p>
              <p className="font-bold text-gray-900">{(summaryStats.waterMl / 1000).toFixed(1)} L</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Timeline */}
      <Card className="rounded-2xl border-0 shadow-sm bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            📋 Activities ({summaryStats.totalActivities})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <ListSkeleton rows={5} />
          ) : timelineItems.length === 0 ? (
            <EmptyState
              icon={<CalendarDays className="w-8 h-8" />}
              title="No activities yet"
              description="Start adding your activities to see them here!"
              actionLabel="Add First Activity"
              onAction={() => {}}
            />
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-gray-200" />

              <div className="space-y-4">
                {timelineItems.map((item) => (
                  <div key={item.id} className="relative flex gap-4 group">
                    {/* Time & Icon */}
                    <div className="flex flex-col items-center w-10">
                      {/* Icon circle */}
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center z-10 border-2 border-white"
                        style={{ backgroundColor: `${item.color}15`, color: item.color }}
                      >
                        {item.icon}
                      </div>
                      
                      {/* Time */}
                      {item.time && (
                        <span className="text-xs text-gray-400 mt-1 whitespace-nowrap">
                          {item.time}
                        </span>
                      )}
                    </div>

                    {/* Content Card */}
                    <div className="flex-1 pb-4">
                      <div className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className="px-2 py-0.5 text-xs rounded-full font-medium capitalize"
                                style={{ backgroundColor: `${item.color}15`, color: item.color }}
                              >
                                {item.type === 'food' ? item.data.mealType?.replace('-', ' ') : item.type}
                              </span>
                            </div>
                            
                            <p className="font-medium text-gray-900">{item.title}</p>
                            
                            {item.subtitle && (
                              <p className="text-sm text-gray-500 mt-1">{item.subtitle}</p>
                            )}
                          </div>

                          {item.amount && (
                            <span className="font-bold text-gray-900 ml-4 flex-shrink-0">
                              {item.amount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Empty State for Expenses Summary */}
      {summaryStats.expenses > 0 && (
        <Card className="rounded-2xl border-0 shadow-sm bg-amber-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-amber-600" />
              <span className="font-medium text-amber-800">Today&apos;s Spending</span>
            </div>
            <span className="text-xl font-bold text-amber-800">₹{summaryStats.expenses.toFixed(2)}</span>
          </div>
        </Card>
      )}
    </div>
  );
}
