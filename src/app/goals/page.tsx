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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { ProgressBar } from '@/components/shared/progress-bar';
import { EmptyState } from '@/components/shared/empty-state';
import { ListSkeleton } from '@/components/shared/loading-skeleton';
import api from '@/services/api';
import {
  Target,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Trophy,
  Flag,
  Star,
  Zap,
} from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { toast } from 'sonner';

const GOAL_TYPES = [
  { value: 'daily', label: 'Daily', icon: '📅' },
  { value: 'weekly', label: 'Weekly', icon: '📆' },
  { value: 'monthly', label: 'Monthly', icon: '🗓️' },
];

const GOAL_CATEGORIES = [
  { value: 'fitness', label: 'Fitness', color: '#f97316' },
  { value: 'learning', label: 'Learning', color: '#3b82f6' },
  { value: 'interview', label: 'Interview Prep', color: '#8b5cf6' },
  { value: 'sleep', label: 'Sleep', color: '#6366f1' },
  { value: 'water', label: 'Water', color: '#06b6d4' },
  { value: 'protein', label: 'Protein', color: '#ef4444' },
  { value: 'expense', label: 'Expense', color: '#f59e0b' },
  { value: 'other', label: 'Other', color: '#64748b' },
];

interface Goal {
  id: string;
  title: string;
  description?: string;
  type: string;
  category: string;
  targetValue?: number;
  unit?: string;
  startDate: string;
  endDate?: string;
  isCompleted: boolean;
  createdAt: string;
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'daily',
    category: 'other',
    targetValue: '',
    unit: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: '',
  });

  const fetchGoals = async () => {
    try {
      setIsLoading(true);
      const response = await api.goals.getAll();
      // Handle both array and object responses
      setGoals(Array.isArray(response) ? response : (response?.goals || response?.entries || []));
    } catch (error) {
      toast.error('Failed to load goals');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  // Filter goals by type
  const dailyGoals = goals.filter(g => g.type === 'daily');
  const weeklyGoals = goals.filter(g => g.type === 'weekly');
  const monthlyGoals = goals.filter(g => g.type === 'monthly');

  // Stats
  const totalGoals = goals.length;
  const completedGoals = goals.filter(g => g.isCompleted).length;
  const activeGoals = totalGoals - completedGoals;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Please enter a goal title');
      return;
    }

    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description || undefined,
        type: formData.type,
        category: formData.category,
        targetValue: formData.targetValue ? parseInt(formData.targetValue) : undefined,
        unit: formData.unit || undefined,
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
      };

      if (editingGoal) {
        await api.goals.update(editingGoal.id, payload);
        toast.success('Goal updated! 🎯');
      } else {
        await api.goals.create(payload);
        toast.success('Goal created! 🎯');
      }

      resetForm();
      setDialogOpen(false);
      fetchGoals();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save goal');
    }
  };

  const toggleComplete = async (goal: Goal) => {
    try {
      await api.goals.update(goal.id, { isCompleted: !goal.isCompleted });
      toast.success(goal.isCompleted ? 'Goal reopened' : 'Goal completed! 🎉');
      fetchGoals();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update goal');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      await api.goals.delete(deleteId);
      toast.error('Goal deleted');
      setDeleteId(null);
      fetchGoals();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'daily',
      category: 'other',
      targetValue: '',
      unit: '',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: '',
    });
    setEditingGoal(null);
  };

  const openEditDialog = (goal: Goal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description || '',
      type: goal.type,
      category: goal.category,
      targetValue: goal.targetValue?.toString() || '',
      unit: goal.unit || '',
      startDate: goal.startDate,
      endDate: goal.endDate || '',
    });
    setDialogOpen(true);
  };

  const getDaysRemaining = (endDate?: string) => {
    if (!endDate) return null;
    const days = differenceInDays(parseISO(endDate), new Date());
    return days >= 0 ? days : 0;
  };

  const renderGoalCard = (goal: Goal) => {
    const category = GOAL_CATEGORIES.find(c => c.value === goal.category);
    const typeInfo = GOAL_TYPES.find(t => t.value === goal.type);
    const daysRemaining = getDaysRemaining(goal.endDate);

    return (
      <div
        key={goal.id}
        className={`p-4 rounded-xl border transition-all ${
          goal.isCompleted 
            ? 'bg-emerald-50 border-emerald-200' 
            : 'bg-white border-gray-200 hover:border-gray-300'
        }`}
      >
        <div className="flex items-start gap-3">
          {/* Complete Button */}
          <button
            onClick={() => toggleComplete(goal)}
            className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
              goal.isCompleted
                ? 'bg-emerald-500 border-emerald-500 text-white'
                : 'border-gray-300 hover:border-emerald-400'
            }`}
          >
            {goal.isCompleted && (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className={`font-semibold ${goal.isCompleted ? 'text-emerald-800 line-through' : 'text-gray-900'}`}>
                  {goal.title}
                </h3>
                {goal.description && (
                  <p className="text-sm text-gray-500 mt-0.5">{goal.description}</p>
                )}
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => openEditDialog(goal)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg"
                >
                  <Edit2 className="w-4 h-4 text-gray-400" />
                </button>
                <button
                  onClick={() => setDeleteId(goal.id)}
                  className="p-1.5 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span 
                className="px-2 py-0.5 text-xs rounded-full font-medium capitalize"
                style={{ backgroundColor: `${category?.color}15`, color: category?.color }}
              >
                {category?.label}
              </span>
              
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                {typeInfo?.icon} {typeInfo?.label}
              </span>

              {goal.targetValue && (
                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full">
                  Target: {goal.targetValue} {goal.unit}
                </span>
              )}

              {daysRemaining !== null && !goal.isCompleted && (
                <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                  daysRemaining <= 3 ? 'bg-red-100 text-red-700' :
                  daysRemaining <= 7 ? 'bg-amber-100 text-amber-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  📅 {daysRemaining} days left
                </span>
              )}

              {goal.isCompleted && (
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium">
                  ✓ Completed!
                </span>
              )}
            </div>

            {/* Progress bar for goals with targets */}
            {goal.targetValue && (
              <div className="mt-3">
                <ProgressBar 
                  value={Math.floor(Math.random() * goal.targetValue)} 
                  max={goal.targetValue}
                  size="sm"
                  color={category?.color}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return <ListSkeleton rows={5} />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Target className="w-7 h-7 text-purple-500" />
            Goals
          </h1>
          <p className="text-gray-500 mt-1">Set and track your personal goals</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 rounded-xl">
              <Plus className="w-4 h-4 mr-2" />
              New Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingGoal ? 'Edit Goal' : 'Create New Goal'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Goal Title *</Label>
                <Input
                  placeholder="What do you want to achieve?"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Add more details about your goal..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(v) => setFormData({ ...formData, type: v })}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GOAL_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.icon} {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(v) => setFormData({ ...formData, category: v })}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GOAL_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label>Target Value</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 100"
                    value={formData.targetValue}
                    onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Input
                    placeholder="e.g., pushups"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date (optional)</Label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-xl">
                {editingGoal ? 'Update Goal' : 'Create Goal'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-0 shadow-sm bg-white p-4">
          <div className="flex items-center gap-3">
            <Target className="w-8 h-8 text-purple-500" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalGoals}</p>
              <p className="text-xs text-gray-500">Total Goals</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm bg-white p-4">
          <div className="flex items-center gap-3">
            <Zap className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{activeGoals}</p>
              <p className="text-xs text-gray-500">Active</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm bg-white p-4">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-amber-500" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{completedGoals}</p>
              <p className="text-xs text-gray-500">Completed</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm bg-white p-4">
          <div className="flex items-center gap-3">
            <Star className="w-8 h-8 text-emerald-500" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0}%
              </p>
              <p className="text-xs text-gray-500">Success Rate</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Goals by Type - Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="bg-gray-100 rounded-xl p-1">
          <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            All ({goals.length})
          </TabsTrigger>
          <TabsTrigger value="daily" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Daily ({dailyGoals.length})
          </TabsTrigger>
          <TabsTrigger value="weekly" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Weekly ({weeklyGoals.length})
          </TabsTrigger>
          <TabsTrigger value="monthly" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Monthly ({monthlyGoals.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4 space-y-3">
          {goals.length === 0 ? (
            <EmptyState
              icon={<Target className="w-8 h-8" />}
              title="No goals yet"
              description="Create your first goal to start achieving!"
              actionLabel="Create First Goal"
              onAction={() => setDialogOpen(true)}
            />
          ) : (
            goals.map(renderGoalCard)
          )}
        </TabsContent>

        <TabsContent value="daily" className="mt-4 space-y-3">
          {dailyGoals.length === 0 ? (
            <EmptyState
              icon={<Calendar className="w-8 h-8" />}
              title="No daily goals"
              description="Set daily goals to stay on track!"
              actionLabel="Add Daily Goal"
              onAction={() => { setFormData(prev => ({ ...prev, type: 'daily' })); setDialogOpen(true); }}
            />
          ) : (
            dailyGoals.map(renderGoalCard)
          )}
        </TabsContent>

        <TabsContent value="weekly" className="mt-4 space-y-3">
          {weeklyGoals.length === 0 ? (
            <EmptyState
              icon={<Flag className="w-8 h-8" />}
              title="No weekly goals"
              description="Set weekly goals for bigger achievements!"
              actionLabel="Add Weekly Goal"
              onAction={() => { setFormData(prev => ({ ...prev, type: 'weekly' })); setDialogOpen(true); }}
            />
          ) : (
            weeklyGoals.map(renderGoalCard)
          )}
        </TabsContent>

        <TabsContent value="monthly" className="mt-4 space-y-3">
          {monthlyGoals.length === 0 ? (
            <EmptyState
              icon={<Star className="w-8 h-8" />}
              title="No monthly goals"
              description="Set monthly goals for long-term success!"
              actionLabel="Add Monthly Goal"
              onAction={() => { setFormData(prev => ({ ...prev, type: 'monthly' })); setDialogOpen(true); }}
            />
          ) : (
            monthlyGoals.map(renderGoalCard)
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete Goal?"
        description="This will permanently delete this goal."
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </div>
  );
}
