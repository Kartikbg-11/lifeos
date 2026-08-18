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
import { EmptyState } from '@/components/shared/empty-state';
import { ListSkeleton } from '@/components/shared/loading-skeleton';
import api from '@/services/api';
import { useAuthStore } from '@/store/use-auth-store';
import {
  Moon,
  Plus,
  Trash2,
  Edit2,
  Bed,
  TrendingUp,
  Calendar,
  Star,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
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

const SLEEP_QUALITY = [
  { value: 'excellent', label: 'Excellent', emoji: '😴', color: '#10b981' },
  { value: 'good', label: 'Good', emoji: '🙂', color: '#3b82f6' },
  { value: 'fair', label: 'Fair', emoji: '😐', color: '#f59e0b' },
  { value: 'poor', label: 'Poor', emoji: '😫', color: '#ef4444' },
];

interface SleepEntry {
  id: string;
  date: string;
  sleepStart: string;
  sleepEnd: string;
  totalMinutes?: number;
  quality?: string;
  notes?: string;
  createdAt: string;
}

export default function SleepPage() {
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<SleepEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<SleepEntry | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    sleepStart: '',
    sleepEnd: '',
    quality: '',
    notes: '',
  });

  const goal = user?.settings?.sleepGoal || 480; // minutes (8 hours)

  const fetchEntries = async () => {
    try {
      setIsLoading(true);
      const response = await api.sleep.getAll();
      // Handle both array and object responses
      setEntries(Array.isArray(response) ? response : (response?.entries || response?.sleepEntries || []));
    } catch (error) {
      toast.error('Failed to load sleep data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  // Get today's entry
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayEntry = entries.find((e) => e.date === today);

  // Calculate duration when times change
  useEffect(() => {
    if (formData.sleepStart && formData.sleepEnd) {
      const start = new Date(formData.sleepStart);
      let end = new Date(formData.sleepEnd);
      
      // Handle midnight crossing
      if (end <= start) {
        end.setDate(end.getDate() + 1);
      }
      
      const diffMs = end.getTime() - start.getTime();
      const diffMins = Math.round(diffMs / (1000 * 60));
      // We don't show this in form but it helps validate
    }
  }, [formData.sleepStart, formData.sleepEnd]);

  const calculateDuration = (startStr: string, endStr: string): number => {
    const start = new Date(startStr);
    let end = new Date(endStr);
    
    if (end <= start) {
      end.setDate(end.getDate() + 1);
    }
    
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
  };

  const formatDuration = (mins: number): string => {
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}m`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.sleepStart || !formData.sleepEnd) {
      toast.error('Please enter both sleep and wake times');
      return;
    }

    try {
      const payload = {
        sleepStart: formData.sleepStart,
        sleepEnd: formData.sleepEnd,
        quality: formData.quality || undefined,
        notes: formData.notes || undefined,
      };

      if (editingEntry) {
        await api.sleep.update(editingEntry.id, payload);
        toast.success('Sleep entry updated! 😴');
      } else {
        await api.sleep.create(payload);
        toast.success('Sleep entry added! 😴');
      }

      resetForm();
      setDialogOpen(false);
      fetchEntries();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save sleep entry');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      await api.sleep.delete(deleteId);
      toast.error('Sleep entry deleted');
      setDeleteId(null);
      fetchEntries();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete');
    }
  };

  const resetForm = () => {
    setFormData({
      sleepStart: '',
      sleepEnd: '',
      quality: '',
      notes: '',
    });
    setEditingEntry(null);
  };

  const openEditDialog = (entry: SleepEntry) => {
    setEditingEntry(entry);
    setFormData({
      sleepStart: format(parseISO(entry.sleepStart), "yyyy-MM-dd'T'HH:mm"),
      sleepEnd: format(parseISO(entry.sleepEnd), "yyyy-MM-dd'T'HH:mm"),
      quality: entry.quality || '',
      notes: entry.notes || '',
    });
    setDialogOpen(true);
  };

  // Weekly average calculation
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayEntry = entries.find((e) => e.date === dateStr);
    return {
      date: format(date, 'EEE'),
      hours: dayEntry?.totalMinutes ? Math.round(dayEntry.totalMinutes / 60 * 10) / 10 : 0,
      quality: dayEntry?.quality || null,
    };
  });

  const avgWeeklyHours = weeklyData.reduce((sum, d) => sum + d.hours, 0) / 7;

  if (isLoading) {
    return <ListSkeleton rows={5} />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Moon className="w-7 h-7 text-indigo-500" />
            Sleep Tracker
          </h1>
          <p className="text-gray-500 mt-1">Monitor your sleep patterns and quality</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 rounded-xl">
              <Plus className="w-4 h-4 mr-2" />
              Log Sleep
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingEntry ? 'Edit Sleep Entry' : 'Log Your Sleep'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sleep Time</Label>
                  <Input
                    type="datetime-local"
                    value={formData.sleepStart}
                    onChange={(e) => setFormData({ ...formData, sleepStart: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Wake Time</Label>
                  <Input
                    type="datetime-local"
                    value={formData.sleepEnd}
                    onChange={(e) => setFormData({ ...formData, sleepEnd: e.target.value })}
                  />
                </div>
              </div>

              {formData.sleepStart && formData.sleepEnd && (
                <div className="p-3 bg-indigo-50 rounded-xl text-center">
                  <span className="text-sm text-indigo-600 font-medium">
                    Duration: {formatDuration(calculateDuration(formData.sleepStart, formData.sleepEnd))}
                  </span>
                </div>
              )}

              <div className="space-y-2">
                <Label>Sleep Quality</Label>
                <Select
                  value={formData.quality}
                  onValueChange={(v) => setFormData({ ...formData, quality: v })}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="How did you sleep?" />
                  </SelectTrigger>
                  <SelectContent>
                    {SLEEP_QUALITY.map((q) => (
                      <SelectItem key={q.value} value={q.value}>
                        {q.emoji} {q.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Any factors affecting your sleep?"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-xl">
                {editingEntry ? 'Update Entry' : 'Save Entry'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Today's Summary */}
      <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-indigo-50 to-white overflow-hidden">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <ProgressRing
              progress={todayEntry ? Math.min(100, ((todayEntry.totalMinutes || 0) / goal) * 100) : 0}
              size={140}
              strokeWidth={10}
              color="#6366f1"
            >
              <div className="text-center">
                <span className="text-2xl font-bold text-gray-900">
                  {todayEntry ? formatDuration(todayEntry.totalMinutes || 0) : '--h --m'}
                </span>
                <p className="text-xs text-gray-500 mt-1">Goal: {formatDuration(goal)}</p>
              </div>
            </ProgressRing>
            
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Tonight&apos;s Sleep
              </h2>
              {todayEntry ? (
                <>
                  <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-3">
                    {todayEntry.quality && (() => {
                      const q = SLEEP_QUALITY.find(sq => sq.value === todayEntry.quality);
                      return q ? (
                        <span 
                          className="px-3 py-1 rounded-full text-sm font-medium"
                          style={{ backgroundColor: `${q.color}15`, color: q.color }}
                        >
                          {q.emoji} {q.label}
                        </span>
                      ) : null;
                    })()}
                    {(todayEntry.totalMinutes || 0) >= goal && (
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                        ✓ Goal Met!
                      </span>
                    )}
                  </div>
                  {todayEntry.notes && (
                    <p className="text-sm text-gray-600">{todayEntry.notes}</p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-gray-500 mb-3">
                    No sleep logged for tonight yet.
                  </p>
                  <Button
                    onClick={() => setDialogOpen(true)}
                    variant="outline"
                    className="rounded-xl border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                  >
                    <Bed className="w-4 h-4 mr-2" />
                    Log Sleep Now
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-0 shadow-sm bg-white">
          <CardContent className="p-5 flex flex-col items-center justify-center">
            <TrendingUp className="w-8 h-8 text-blue-500 mb-2" />
            <p className="text-3xl font-bold text-gray-900">{avgWeeklyHours.toFixed(1)}h</p>
            <p className="text-xs text-gray-500">Weekly Average</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm bg-white">
          <CardContent className="p-5 flex flex-col items-center justify-center">
            <Star className="w-8 h-8 text-yellow-500 mb-2" />
            <p className="text-3xl font-bold text-gray-900">
              {(() => {
                const recentQuality = entries.slice(-7).filter(e => e.quality).map(e => e.quality);
                if (recentQuality.length === 0) return '--';
                const scores = { excellent: 4, good: 3, fair: 2, poor: 1 };
                const avgScore = recentQuality.reduce((sum, q) => sum + (scores[q as keyof typeof scores] || 0), 0) / recentQuality.length;
                return avgScore.toFixed(1);
              })()}
            </p>
            <p className="text-xs text-gray-500">Avg Quality Score</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm bg-white">
          <CardContent className="p-5 flex flex-col items-center justify-center">
            <Calendar className="w-8 h-8 text-emerald-500 mb-2" />
            <p className="text-3xl font-bold text-gray-900">{entries.length}</p>
            <p className="text-xs text-gray-500">Total Entries</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Chart */}
      <Card className="rounded-2xl border-0 shadow-sm bg-white">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gray-400" />
            This Week&apos;s Sleep Pattern
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} unit="h" />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  }}
                />
                <Bar 
                  dataKey="hours" 
                  fill="#6366f1" 
                  radius={[6, 6, 0, 0]} 
                  name="Hours"
                  maxBarSize={50}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Goal line indicator */}
          <div className="mt-4 p-3 bg-gray-50 rounded-xl flex items-center justify-between">
            <span className="text-sm text-gray-500">Daily Goal</span>
            <span className="font-semibold text-indigo-600">{formatDuration(goal)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Recent Entries */}
      <Card className="rounded-2xl border-0 shadow-sm bg-white">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            Sleep History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <EmptyState
              icon={<Moon className="w-8 h-8" />}
              title="No sleep data yet"
              description="Start tracking your sleep patterns!"
              actionLabel="Log First Sleep"
              onAction={() => setDialogOpen(true)}
            />
          ) : (
            <div className="space-y-3">
              {[...entries].reverse().slice(0, 10).map((entry) => {
                const quality = SLEEP_QUALITY.find(q => q.value === entry.quality);
                
                return (
                  <div
                    key={entry.id}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl group hover:bg-gray-100 transition-colors"
                  >
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${quality?.color || '#9ca3af'}15` }}
                    >
                      <Moon className={`w-6 h-6`} style={{ color: quality?.color || '#9ca3af' }} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {formatDuration(entry.totalMinutes || 0)}
                        </span>
                        {quality && (
                          <span 
                            className="px-2 py-0.5 text-xs rounded-full font-medium"
                            style={{ backgroundColor: `${quality.color}15`, color: quality.color }}
                          >
                            {quality.emoji} {quality.label}
                          </span>
                        )}
                        {(entry.totalMinutes || 0) >= goal && (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                            Goal ✓
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-3 mt-1 text-sm text-gray-500">
                        <span>
                          {format(parseISO(entry.sleepStart), 'hh:mm a')} → {format(parseISO(entry.sleepEnd), 'hh:mm a')}
                        </span>
                        {entry.notes && (
                          <span className="truncate max-w-[200px]">{entry.notes}</span>
                        )}
                      </div>
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
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete Sleep Entry?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </div>
  );
}
