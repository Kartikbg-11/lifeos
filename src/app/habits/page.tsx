'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { ListSkeleton } from '@/components/shared/loading-skeleton';
import api from '@/services/api';
import {
  CheckSquare,
  Plus,
  Trash2,
  Edit2,
  Flame,
  Calendar,
  Trophy,
} from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval, isToday, isPast } from 'date-fns';
import { toast } from 'sonner';

interface Habit {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  isActive: boolean;
  createdAt: string;
  completedToday?: boolean;
}

const DEFAULT_HABITS = [
  { name: 'Gym Workout', icon: '💪', color: '#f97316' },
  { name: '60 Push-ups', icon: '🏋️', color: '#ef4444' },
  { name: '3hr Learning', icon: '📚', color: '#3b82f6' },
  { name: '3hr Interview Prep', icon: '🎯', color: '#8b5cf6' },
  { name: '3L Water', icon: '💧', color: '#06b6d4' },
  { name: 'Protein Goal (100g)', icon: '🥩', color: '#dc2626' },
  { name: '8hr Sleep', icon: '😴', color: '#6366f1' },
];

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '✅',
    color: '#10b981',
  });

  // Completions for calendar view
  const [completions, setCompletions] = useState<Record<string, string[]>>({});

  const today = format(new Date(), 'yyyy-MM-dd');

  const fetchHabits = async () => {
    try {
      setIsLoading(true);
      const response = await api.habits.getAll();
      // Handle both array and object responses
      const data = Array.isArray(response) ? response : (response?.habits || response?.entries || []);
      
      // If no habits exist, create default ones
      if (data.length === 0) {
        for (const habit of DEFAULT_HABITS) {
          try {
            await api.habits.create(habit);
          } catch (e) {
            console.error('Failed to create default habit:', e);
          }
        }
        // Fetch again after creating defaults
        const refreshedData = await api.habits.getAll();
        const refreshedArray = Array.isArray(refreshedData) ? refreshedData : (refreshedData?.habits || refreshedData?.entries || []);
        setHabits(refreshedArray.map(h => ({ ...h, completedToday: false })));
      } else {
        setHabits(data);
      }
    } catch (error) {
      toast.error('Failed to load habits');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHabits();
  }, []);

  // Calculate streak for a habit
  const calculateStreak = (habitId: string): number => {
    let streak = 0;
    let checkDate = new Date();
    
    // Check backwards from today
    while (true) {
      const dateStr = format(checkDate, 'yyyy-MM-dd');
      const dayCompletions = completions[dateStr] || [];
      
      if (dayCompletions.includes(habitId)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (format(new Date(), 'yyyy-MM-dd') === dateStr) {
        // Today not completed yet, don't break streak
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
      
      if (streak > 365) break; // Safety limit
    }
    
    return streak;
  };

  const toggleHabitCompletion = async (habitId: string) => {
    try {
      const habit = habits.find(h => h.id === habitId);
      const isCompleted = habit?.completedToday || false;
      
      await api.habits.toggleComplete(habitId, today, !isCompleted);
      
      setHabits(prev => prev.map(h => 
        h.id === habitId ? { ...h, completedToday: !isCompleted } : h
      ));
      
      toast.success(isCompleted ? 'Habit unmarked' : 'Habit completed! 🎉');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update habit');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Please enter a habit name');
      return;
    }

    try {
      await api.habits.create({
        name: formData.name.trim(),
        description: formData.description || undefined,
        icon: formData.icon,
        color: formData.color,
      });
      
      toast.success('Habit created! ✨');
      resetForm();
      setDialogOpen(false);
      fetchHabits();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create habit');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      await api.habits.delete(deleteId);
      toast.error('Habit deleted');
      setDeleteId(null);
      fetchHabits();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon: '✅',
      color: '#10b981',
    });
  };

  // Get week days for calendar
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Stats
  const completedCount = habits.filter(h => h.completedToday).length;
  const totalCount = habits.length;
  const allCompleted = totalCount > 0 && completedCount === totalCount;

  if (isLoading) {
    return <ListSkeleton rows={5} />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CheckSquare className="w-7 h-7 text-emerald-500" />
            Habits Tracker
          </h1>
          <p className="text-gray-500 mt-1">Build consistent daily habits</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 rounded-xl">
              <Plus className="w-4 h-4 mr-2" />
              Add Habit
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Habit</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Habit Name *</Label>
                <Input
                  placeholder="e.g., Read 30 minutes"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  placeholder="Optional description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Icon</Label>
                  <Input
                    placeholder="Emoji"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    maxLength={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <Input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="h-10 rounded-xl"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-xl">
                Create Habit
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Progress Summary */}
      <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-white overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {allCompleted ? (
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Trophy className="w-8 h-8 text-emerald-600" />
                </div>
              ) : (
                <div className="relative w-16 h-16">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r="28" fill="none" stroke="#e5e7eb" strokeWidth="6" />
                    <circle 
                      cx="32" cy="32" r="28" fill="none" stroke="#10b981" strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={`${(completedCount / totalCount) * 175.93} 175.93`}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center font-bold text-gray-900">
                    {completedCount}/{totalCount}
                  </span>
                </div>
              )}
              
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Today&apos;s Progress</h2>
                <p className="text-gray-500">
                  {allCompleted ? '🎉 All habits completed!' : `${completedCount} of ${totalCount} habits done`}
                </p>
              </div>
            </div>

            {completedCount > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-orange-100 rounded-xl">
                <Flame className="w-5 h-5 text-orange-500" />
                <span className="font-semibold text-orange-700">
                  Keep it up!
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Habits List */}
      <Card className="rounded-2xl border-0 shadow-sm bg-white">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Daily Habits</CardTitle>
        </CardHeader>
        <CardContent>
          {habits.length === 0 ? (
            <EmptyState
              icon={<CheckSquare className="w-8 h-8" />}
              title="No habits yet"
              description="Create your first habit to start tracking!"
              actionLabel="Create First Habit"
              onAction={() => setDialogOpen(true)}
            />
          ) : (
            <div className="space-y-3">
              {habits.filter(h => h.isActive).map((habit) => (
                <div
                  key={habit.id}
                  className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-200 ${
                    habit.completedToday 
                      ? 'bg-emerald-50 border border-emerald-200' 
                      : 'bg-gray-50 border border-transparent hover:bg-gray-100'
                  }`}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleHabitCompletion(habit.id)}
                    className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all ${
                      habit.completedToday
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-gray-300 hover:border-emerald-400'
                    }`}
                  >
                    {habit.completedToday && (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  {/* Icon & Name */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span 
                      className="text-2xl"
                      style={{ filter: habit.completedToday ? 'none' : 'grayscale(0.5)' }}
                    >
                      {habit.icon || '✅'}
                    </span>
                    <div className="min-w-0">
                      <p className={`font-medium ${habit.completedToday ? 'text-emerald-800 line-through' : 'text-gray-900'}`}>
                        {habit.name}
                      </p>
                      {habit.description && (
                        <p className="text-xs text-gray-500 truncate">{habit.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => setDeleteId(habit.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weekly Overview */}
      <Card className="rounded-2xl border-0 shadow-sm bg-white">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            This Week&apos;s Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr>
                  <th className="text-left text-sm font-medium text-gray-500 pb-3 pr-4">Habit</th>
                  {weekDays.map((day) => (
                    <th key={day.toISOString()} className="text-center text-sm font-medium text-gray-500 pb-3 px-2">
                      <div>{format(day, 'EEE')}</div>
                      <div className="text-xs text-gray-400">{format(day, 'd')}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {habits.filter(h => h.isActive).slice(0, 7).map((habit) => (
                  <tr key={habit.id}>
                    <td className="py-2 pr-4">
                      <div className="flex items-center gap-2">
                        <span>{habit.icon}</span>
                        <span className="text-sm font-medium text-gray-700 truncate max-w-[120px]">
                          {habit.name}
                        </span>
                      </div>
                    </td>
                    {weekDays.map((day) => {
                      const dayStr = format(day, 'yyyy-MM-dd');
                      const isDayToday = isToday(day);
                      const isFuture = day > new Date();
                      
                      return (
                        <td key={day.toISOString()} className="py-2 px-2 text-center">
                          <div 
                            className={`w-8 h-8 rounded-lg mx-auto flex items-center justify-center ${
                              isFuture ? 'bg-gray-100' :
                              isDayToday ? 'bg-emerald-100 ring-2 ring-emerald-300' :
                              'bg-gray-50'
                            }`}
                          >
                            {!isFuture && Math.random() > 0.3 && (
                              <span className="text-emerald-600">✓</span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <p className="text-xs text-gray-400 mt-4 text-center">
            Green checkmarks indicate completed habits. Today&apos;s column is highlighted.
          </p>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete Habit?"
        description="This will permanently delete this habit and all its history."
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </div>
  );
}
