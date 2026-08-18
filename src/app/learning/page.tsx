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
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  Clock,
  TrendingUp,
  Calendar,
  Brain,
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { toast } from 'sonner';

const LEARNING_CATEGORIES = [
  { value: 'api-testing', label: 'API Testing' },
  { value: 'python', label: 'Python' },
  { value: 'ai-testing', label: 'AI Testing' },
  { value: 'sql', label: 'SQL' },
  { value: 'automation', label: 'Automation' },
  { value: 'other', label: 'Other' },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

interface LearningSession {
  id: string;
  date: string;
  topic: string;
  category?: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  whatLearned?: string;
  notes?: string;
  completed: boolean;
  createdAt: string;
}

export default function LearningPage() {
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState<LearningSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<LearningSession | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    topic: '',
    category: '',
    startTime: '',
    endTime: '',
    duration: '',
    whatLearned: '',
    notes: '',
  });

  const goal = user?.settings?.learningGoal || 180; // minutes (3 hours)

  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      const response = await api.learning.getAll();
      // Handle both array and object responses
      setSessions(Array.isArray(response) ? response : (response?.sessions || response?.entries || []));
    } catch (error) {
      toast.error('Failed to load learning sessions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // Calculate today's total
  const today = format(new Date(), 'yyyy-MM-dd');
  const todaySessions = sessions.filter((s) => s.date === today);
  const todayTotalMins = todaySessions.reduce((sum, s) => sum + (s.duration || 0), 0);

  // Auto-calculate duration when start/end times change
  useEffect(() => {
    if (formData.startTime && formData.endTime) {
      const start = new Date(formData.startTime);
      let end = new Date(formData.endTime);
      
      if (end <= start) {
        end.setDate(end.getDate() + 1);
      }
      
      const diffMs = end.getTime() - start.getTime();
      const diffMins = Math.round(diffMs / (1000 * 60));
      setFormData(prev => ({ ...prev, duration: diffMins.toString() }));
    }
  }, [formData.startTime, formData.endTime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.topic.trim()) {
      toast.error('Please enter a topic');
      return;
    }

    try {
      const payload = {
        topic: formData.topic.trim(),
        category: formData.category || undefined,
        startTime: formData.startTime || undefined,
        endTime: formData.endTime || undefined,
        duration: formData.duration ? parseInt(formData.duration) : undefined,
        whatLearned: formData.whatLearned || undefined,
        notes: formData.notes || undefined,
      };

      if (editingSession) {
        await api.learning.update(editingSession.id, payload);
        toast.success('Session updated! 📚');
      } else {
        await api.learning.create(payload);
        toast.success('Session added! 📚');
      }

      resetForm();
      setDialogOpen(false);
      fetchSessions();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save session');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      await api.learning.delete(deleteId);
      toast.error('Session deleted');
      setDeleteId(null);
      fetchSessions();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete');
    }
  };

  const resetForm = () => {
    setFormData({
      topic: '',
      category: '',
      startTime: '',
      endTime: '',
      duration: '',
      whatLearned: '',
      notes: '',
    });
    setEditingSession(null);
  };

  const openEditDialog = (session: LearningSession) => {
    setEditingSession(session);
    setFormData({
      topic: session.topic,
      category: session.category || '',
      startTime: session.startTime ? format(new Date(session.startTime), "yyyy-MM-dd'T'HH:mm") : '',
      endTime: session.endTime ? format(new Date(session.endTime), "yyyy-MM-dd'T'HH:mm") : '',
      duration: session.duration?.toString() || '',
      whatLearned: session.whatLearned || '',
      notes: session.notes || '',
    });
    setDialogOpen(true);
  };

  // Chart data - last 7 days
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = format(date, 'yyyy-MM-dd');
    const daySessions = sessions.filter((s) => s.date === dateStr);
    return {
      date: format(date, 'EEE'),
      hours: Math.round((daySessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 60) * 10) / 10,
    };
  });

  // Category distribution
  const categoryData = LEARNING_CATEGORIES.map((cat) => ({
    name: cat.label,
    value: sessions.filter((s) => s.category === cat.value).length,
  })).filter((d) => d.value > 0);

  if (isLoading) {
    return <ListSkeleton rows={5} />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-blue-500" />
            Learning Tracker
          </h1>
          <p className="text-gray-500 mt-1">Track your learning progress and sessions</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 rounded-xl">
              <Plus className="w-4 h-4 mr-2" />
              Add Session
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingSession ? 'Edit Session' : 'Add Learning Session'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label>Topic *</Label>
                  <Input
                    placeholder="e.g., REST API Testing"
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(v) => setFormData({ ...formData, category: v })}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {LEARNING_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Duration (mins)</Label>
                  <Input
                    type="number"
                    placeholder="Auto-calculated"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>What did you learn?</Label>
                <Textarea
                  placeholder="Key takeaways..."
                  value={formData.whatLearned}
                  onChange={(e) => setFormData({ ...formData, whatLearned: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Additional notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                />
              </div>

              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-xl">
                {editingSession ? 'Update Session' : 'Save Session'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Today's Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <ProgressRing
                progress={Math.min(100, (todayTotalMins / goal) * 100)}
                size={80}
                strokeWidth={8}
                color="#3b82f6"
              >
                <span className="text-lg font-bold text-gray-900">{Math.round(todayTotalMins / 60)}</span>
                <span className="text-xs text-gray-500">hrs</span>
              </ProgressRing>
              <div>
                <h3 className="font-semibold text-gray-900">Today&apos;s Learning</h3>
                <p className="text-sm text-gray-500">Goal: {Math.round(goal / 60)} hours</p>
                {todayTotalMins >= goal && (
                  <span className="text-xs text-emerald-600 font-medium">✓ Goal reached!</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <Brain className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Today&apos;s Sessions</h3>
                <p className="text-2xl font-bold text-gray-900">{todaySessions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Total This Week</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(weeklyData.reduce((sum, d) => sum + d.hours, 0))}h
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="rounded-2xl border-0 shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-gray-400" />
              Weekly Hours
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
                  <Bar dataKey="hours" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Hours" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-gray-400" />
              By Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-400">
                No data yet
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Sessions */}
      <Card className="rounded-2xl border-0 shadow-sm bg-white">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            Recent Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="w-8 h-8" />}
              title="No learning sessions yet"
              description="Start tracking your learning journey!"
              actionLabel="Add First Session"
              onAction={() => setDialogOpen(true)}
            />
          ) : (
            <div className="space-y-3">
              {sessions.slice(0, 15).map((session) => (
                <div
                  key={session.id}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl group hover:bg-gray-100 transition-colors"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    session.completed ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <BookOpen className={`w-6 h-6 ${session.completed ? 'text-blue-500' : 'text-gray-400'}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 truncate">
                        {session.topic}
                      </span>
                      {session.category && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full capitalize">
                          {session.category.replace('-', ' ')}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-sm text-gray-500">
                      {session.duration && <span>{session.duration} min</span>}
                      {session.whatLearned && (
                        <span className="truncate max-w-[200px]">{session.whatLearned}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditDialog(session)}
                      className="p-2 hover:bg-white rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-gray-500" />
                    </button>
                    <button
                      onClick={() => setDeleteId(session.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>

                  <span className="text-xs text-gray-400 hidden sm:block">
                    {format(new Date(session.date), 'MMM d')}
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
        title="Delete Session?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </div>
  );
}
