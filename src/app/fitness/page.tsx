'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { ProgressRing } from '@/components/shared/progress-ring';
import { ProgressBar } from '@/components/shared/progress-bar';
import { EmptyState } from '@/components/shared/empty-state';
import { ListSkeleton } from '@/components/shared/loading-skeleton';
import api from '@/services/api';
import { useAuthStore } from '@/store/use-auth-store';
import {
  Dumbbell,
  Plus,
  Trash2,
  Edit2,
  Flame,
  Target,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { toast } from 'sonner';

const WORKOUT_TYPES = [
  { value: 'cardio', label: 'Cardio' },
  { value: 'strength', label: 'Strength Training' },
  { value: 'hiit', label: 'HIIT' },
  { value: 'yoga', label: 'Yoga' },
  { value: 'sports', label: 'Sports' },
  { value: 'other', label: 'Other' },
];

interface FitnessEntry {
  id: string;
  date: string;
  workoutDuration?: number;
  workoutType?: string;
  pushups: number;
  squats: number;
  pullups: number;
  otherExercises?: string;
  caloriesBurned?: number;
  completed: boolean;
  notes?: string;
  createdAt: string;
}

export default function FitnessPage() {
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<FitnessEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FitnessEntry | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    workoutDuration: '',
    workoutType: '',
    pushups: '',
    squats: '',
    pullups: '',
    caloriesBurned: '',
    notes: '',
  });

  const goal = user?.settings?.workoutGoal || 60; // minutes
  const pushupGoal = user?.settings?.pushupGoal || 60;

  const fetchEntries = async () => {
    try {
      setIsLoading(true);
      const response = await api.fitness.getAll();
      // Handle both array and object responses
      setEntries(Array.isArray(response) ? response : (response?.entries || []));
    } catch (error) {
      toast.error('Failed to load fitness data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  // Calculate today's totals
  const today = format(new Date(), 'yyyy-MM-dd');
  const safeEntries = Array.isArray(entries) ? entries : [];
  const todayEntries = safeEntries.filter((e) => e.date === today);
  const todayTotalMins = todayEntries.reduce((sum, e) => sum + (e.workoutDuration || 0), 0);
  const todayPushups = todayEntries.reduce((sum, e) => sum + e.pushups, 0);
  const todaySquats = todayEntries.reduce((sum, e) => sum + e.squats, 0);
  const todayPullups = todayEntries.reduce((sum, e) => sum + e.pullups, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const payload = {
        workoutDuration: formData.workoutDuration ? parseInt(formData.workoutDuration) : undefined,
        workoutType: formData.workoutType || undefined,
        pushups: formData.pushups ? parseInt(formData.pushups) : 0,
        squats: formData.squats ? parseInt(formData.squats) : 0,
        pullups: formData.pullups ? parseInt(formData.pullups) : 0,
        caloriesBurned: formData.caloriesBurned ? parseInt(formData.caloriesBurned) : undefined,
        notes: formData.notes || undefined,
      };

      if (editingEntry) {
        await api.fitness.update(editingEntry.id, payload);
        toast.success('Workout updated! 💪');
      } else {
        await api.fitness.create(payload);
        toast.success('Workout added! 💪');
      }

      resetForm();
      setDialogOpen(false);
      fetchEntries();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save workout');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      await api.fitness.delete(deleteId);
      toast.success('Workout deleted');
      setDeleteId(null);
      fetchEntries();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete');
    }
  };

  const resetForm = () => {
    setFormData({
      workoutDuration: '',
      workoutType: '',
      pushups: '',
      squats: '',
      pullups: '',
      caloriesBurned: '',
      notes: '',
    });
    setEditingEntry(null);
  };

  const openEditDialog = (entry: FitnessEntry) => {
    setEditingEntry(entry);
    setFormData({
      workoutDuration: entry.workoutDuration?.toString() || '',
      workoutType: entry.workoutType || '',
      pushups: entry.pushups.toString(),
      squats: entry.squats.toString(),
      pullups: entry.pullups.toString(),
      caloriesBurned: entry.caloriesBurned?.toString() || '',
      notes: entry.notes || '',
    });
    setDialogOpen(true);
  };

  // Chart data - last 7 days
  const chartData = (() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayEntries = safeEntries.filter((e) => e.date === dateStr);
      return {
        date: format(date, 'EEE'),
        duration: dayEntries.reduce((sum, e) => sum + (e.workoutDuration || 0), 0),
        pushups: dayEntries.reduce((sum, e) => sum + e.pushups, 0),
      };
    });
    return last7Days;
  })();

  if (isLoading) {
    return <ListSkeleton rows={5} />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Dumbbell className="w-7 h-7 text-orange-500" />
            Fitness Tracker
          </h1>
          <p className="text-gray-500 mt-1">Track your workouts and exercises</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 rounded-xl">
              <Plus className="w-4 h-4 mr-2" />
              Add Workout
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingEntry ? 'Edit Workout' : 'Add Workout'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Duration (mins)</Label>
                  <Input
                    type="number"
                    placeholder="30"
                    value={formData.workoutDuration}
                    onChange={(e) => setFormData({ ...formData, workoutDuration: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Workout Type</Label>
                  <Select
                    value={formData.workoutType}
                    onValueChange={(v) => setFormData({ ...formData, workoutType: v })}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {WORKOUT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Push-ups</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.pushups}
                    onChange={(e) => setFormData({ ...formData, pushups: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Squats</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.squats}
                    onChange={(e) => setFormData({ ...formData, squats: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pull-ups</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.pullups}
                    onChange={(e) => setFormData({ ...formData, pullups: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Calories Burned</Label>
                <Input
                  type="number"
                  placeholder="Optional"
                  value={formData.caloriesBurned}
                  onChange={(e) => setFormData({ ...formData, caloriesBurned: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="How did it go?"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-xl">
                {editingEntry ? 'Update Workout' : 'Save Workout'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Today's Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-orange-50 to-white">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <ProgressRing
                progress={Math.min(100, (todayTotalMins / goal) * 100)}
                size={80}
                strokeWidth={8}
                color="#f97316"
              >
                <span className="text-lg font-bold text-gray-900">{todayTotalMins}</span>
                <span className="text-xs text-gray-500">min</span>
              </ProgressRing>
              <div>
                <h3 className="font-semibold text-gray-900">Today&apos;s Workout</h3>
                <p className="text-sm text-gray-500">Goal: {goal} min</p>
                {todayTotalMins >= goal && (
                  <span className="text-xs text-emerald-600 font-medium">✓ Goal reached!</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <Flame className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Push-ups</h3>
                <p className="text-sm text-gray-500">{todayPushups} / {pushupGoal}</p>
              </div>
            </div>
            <ProgressBar
              value={todayPushups}
              max={pushupGoal}
              color="#ef4444"
            />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-xl">
                <p className="text-2xl font-bold text-blue-600">{todaySquats}</p>
                <p className="text-xs text-gray-500">Squats</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-xl">
                <p className="text-2xl font-bold text-purple-600">{todayPullups}</p>
                <p className="text-xs text-gray-500">Pull-ups</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Chart */}
      <Card className="rounded-2xl border-0 shadow-sm bg-white">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gray-400" />
            This Week&apos;s Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  }}
                />
                <Bar dataKey="duration" fill="#f97316" radius={[6, 6, 0, 0]} name="Minutes" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Workouts */}
      <Card className="rounded-2xl border-0 shadow-sm bg-white">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            Recent Workouts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {safeEntries.length === 0 ? (
            <EmptyState
              icon={<Dumbbell className="w-8 h-8" />}
              title="No workouts yet"
              description="Start tracking your fitness journey!"
              actionLabel="Add First Workout"
              onAction={() => setDialogOpen(true)}
            />
          ) : (
            <div className="space-y-3">
              {safeEntries.slice(0, 10).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl group hover:bg-gray-100 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <Dumbbell className="w-6 h-6 text-orange-500" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 capitalize">
                        {entry.workoutType || 'Workout'}
                      </span>
                      {entry.completed && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                          Complete
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-sm text-gray-500">
                      {entry.workoutDuration && <span>{entry.workoutDuration} min</span>}
                      {entry.pushups > 0 && <span>{entry.pushups} push-ups</span>}
                      {entry.squats > 0 && <span>{entry.squats} squats</span>}
                      {entry.pullups > 0 && <span>{entry.pullups} pull-ups</span>}
                    </div>
                    {entry.notes && (
                      <p className="text-xs text-gray-400 mt-1 truncate">{entry.notes}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditDialog(entry)}
                      className="p-2 hover:bg-white rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-gray-500" />
                    </button>
                    <button
                      onClick={() => setDeleteId(entry.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>

                  <span className="text-xs text-gray-400 hidden sm:block">
                    {format(new Date(entry.date), 'MMM d')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete Workout?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </div>
  );
}
