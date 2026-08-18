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
  UtensilsCrossed,
  Plus,
  Trash2,
  Edit2,
  TrendingUp,
  Calendar,
  Beef,
  Flame,
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

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Breakfast', emoji: '🌅' },
  { value: 'lunch', label: 'Lunch', emoji: '☀️' },
  { value: 'dinner', label: 'Dinner', emoji: '🌙' },
  { value: 'snack', label: 'Snack', emoji: '🍎' },
  { value: 'pre-workout', label: 'Pre-workout', emoji: '💪' },
  { value: 'post-workout', label: 'Post-workout', emoji: '🏋️' },
];

interface FoodEntry {
  id: string;
  date: string;
  mealType: string;
  foodName: string;
  quantity?: string;
  calories?: number;
  protein?: number;
  carbohydrates?: number;
  fat?: number;
  notes?: string;
  createdAt: string;
}

export default function FoodPage() {
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FoodEntry | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    mealType: '',
    foodName: '',
    quantity: '',
    protein: '',
    calories: '',
    carbohydrates: '',
    fat: '',
    notes: '',
  });

  const goal = user?.settings?.proteinGoal || 100; // grams

  const fetchEntries = async () => {
    try {
      setIsLoading(true);
      const response = await api.food.getAll();
      // Handle both array and object responses
      setEntries(Array.isArray(response) ? response : (response?.entries || response?.foodEntries || []));
    } catch (error) {
      toast.error('Failed to load food data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  // Calculate today's totals
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayEntries = entries.filter((e) => e.date === today);
  const todayProtein = todayEntries.reduce((sum, e) => sum + (e.protein || 0), 0);
  const todayCalories = todayEntries.reduce((sum, e) => sum + (e.calories || 0), 0);
  const todayCarbs = todayEntries.reduce((sum, e) => sum + (e.carbohydrates || 0), 0);
  const todayFat = todayEntries.reduce((sum, e) => sum + (e.fat || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.foodName.trim()) {
      toast.error('Please enter a food name');
      return;
    }
    if (!formData.mealType) {
      toast.error('Please select a meal type');
      return;
    }

    try {
      const payload = {
        mealType: formData.mealType,
        foodName: formData.foodName.trim(),
        quantity: formData.quantity || undefined,
        protein: formData.protein ? parseInt(formData.protein) : undefined,
        calories: formData.calories ? parseInt(formData.calories) : undefined,
        carbohydrates: formData.carbohydrates ? parseInt(formData.carbohydrates) : undefined,
        fat: formData.fat ? parseInt(formData.fat) : undefined,
        notes: formData.notes || undefined,
      };

      if (editingEntry) {
        await api.food.update(editingEntry.id, payload);
        toast.success('Meal updated! 🍽️');
      } else {
        await api.food.create(payload);
        toast.success('Meal added! 🍽️');
      }

      resetForm();
      setDialogOpen(false);
      fetchEntries();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save meal');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      await api.food.delete(deleteId);
      toast.error('Meal deleted');
      setDeleteId(null);
      fetchEntries();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete');
    }
  };

  const resetForm = () => {
    setFormData({
      mealType: '',
      foodName: '',
      quantity: '',
      protein: '',
      calories: '',
      carbohydrates: '',
      fat: '',
      notes: '',
    });
    setEditingEntry(null);
  };

  const openEditDialog = (entry: FoodEntry) => {
    setEditingEntry(entry);
    setFormData({
      mealType: entry.mealType,
      foodName: entry.foodName,
      quantity: entry.quantity || '',
      protein: entry.protein?.toString() || '',
      calories: entry.calories?.toString() || '',
      carbohydrates: entry.carbohydrates?.toString() || '',
      fat: entry.fat?.toString() || '',
      notes: entry.notes || '',
    });
    setDialogOpen(true);
  };

  // Weekly data
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayEntries = entries.filter((e) => e.date === dateStr);
    return {
      date: format(date, 'EEE'),
      protein: dayEntries.reduce((sum, e) => sum + (e.protein || 0), 0),
      calories: Math.round(dayEntries.reduce((sum, e) => sum + (e.calories || 0), 0)),
    };
  });

  if (isLoading) {
    return <ListSkeleton rows={5} />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UtensilsCrossed className="w-7 h-7 text-red-500" />
            Food & Nutrition Tracker
          </h1>
          <p className="text-gray-500 mt-1">Track your meals and macros</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 rounded-xl">
              <Plus className="w-4 h-4 mr-2" />
              Add Meal
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingEntry ? 'Edit Meal' : 'Add Meal'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label>Food Name *</Label>
                  <Input
                    placeholder="e.g., Grilled Chicken Breast"
                    value={formData.foodName}
                    onChange={(e) => setFormData({ ...formData, foodName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Meal Type *</Label>
                  <Select
                    value={formData.mealType}
                    onValueChange={(v) => setFormData({ ...formData, mealType: v })}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {MEAL_TYPES.map((meal) => (
                        <SelectItem key={meal.value} value={meal.value}>
                          {meal.emoji} {meal.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input
                    placeholder="e.g., 200g, 1 cup"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Protein (g)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.protein}
                    onChange={(e) => setFormData({ ...formData, protein: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Calories</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.calories}
                    onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Carbs (g)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.carbohydrates}
                    onChange={(e) => setFormData({ ...formData, carbohydrates: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fat (g)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.fat}
                    onChange={(e) => setFormData({ ...formData, fat: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Any additional notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                />
              </div>

              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-xl">
                {editingEntry ? 'Update Meal' : 'Save Meal'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Today's Summary */}
      <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-red-50 to-white overflow-hidden">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <ProgressRing
              progress={Math.min(100, (todayProtein / goal) * 100)}
              size={140}
              strokeWidth={10}
              color="#ef4444"
            >
              <div className="text-center">
                <span className="text-3xl font-bold text-gray-900">{todayProtein}</span>
                <p className="text-xs text-gray-500">/ {goal}g</p>
                <p className="text-xs font-medium mt-1 text-red-500">Protein</p>
              </div>
            </ProgressRing>
            
            <div className="flex-1 w-full">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Today&apos;s Nutrition</h2>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span className="text-xs text-gray-500">Calories</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900">{todayCalories}</p>
                </div>
                
                <div className="bg-white p-4 rounded-xl shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Beef className="w-4 h-4 text-red-500" />
                    <span className="text-xs text-gray-500">Carbs</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900">{todayCarbs}g</p>
                </div>
                
                <div className="bg-white p-4 rounded-xl shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-500">🧈</span>
                    <span className="text-xs text-gray-500">Fat</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900">{todayFat}g</p>
                </div>
              </div>

              {todayProtein >= goal && (
                <div className="mt-4 p-3 bg-emerald-50 rounded-xl text-center">
                  <span className="text-sm font-medium text-emerald-700">
                    🎉 Protein goal reached!
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Today's Meals by Type */}
      {todayEntries.length > 0 && (
        <Card className="rounded-2xl border-0 shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Today&apos;s Meals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {MEAL_TYPES.map((meal) => {
                const mealItems = todayEntries.filter(e => e.mealType === meal.value);
                const mealProtein = mealItems.reduce((sum, e) => sum + (e.protein || 0), 0);
                
                return (
                  <div 
                    key={meal.value}
                    className={`p-3 rounded-xl border ${
                      mealItems.length > 0 ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-100'
                    }`}
                  >
                    <div className="text-lg mb-1">{meal.emoji}</div>
                    <p className="text-xs font-medium text-gray-700 truncate">{meal.label}</p>
                    {mealItems.length > 0 ? (
                      <>
                        <p className="text-xs text-gray-500">{mealItems.length} item(s)</p>
                        <p className="text-xs font-semibold text-red-600">{mealProtein}g protein</p>
                      </>
                    ) : (
                      <p className="text-xs text-gray-400">No entries</p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weekly Chart */}
      <Card className="rounded-2xl border-0 shadow-sm bg-white">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gray-400" />
            Weekly Protein Intake
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} unit="g" />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  }}
                />
                {/* Goal line reference */}
                <Bar dataKey="protein" fill="#ef4444" radius={[6, 6, 0, 0]} name="Protein (g)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 p-3 bg-gray-50 rounded-xl flex items-center justify-between">
            <span className="text-sm text-gray-500">Daily Protein Goal</span>
            <span className="font-semibold text-red-600">{goal}g</span>
          </div>
        </CardContent>
      </Card>

      {/* Recent Entries */}
      <Card className="rounded-2xl border-0 shadow-sm bg-white">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            Recent Meals
          </CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <EmptyState
              icon={<UtensilsCrossed className="w-8 h-8" />}
              title="No meals logged yet"
              description="Start tracking your nutrition!"
              actionLabel="Add First Meal"
              onAction={() => setDialogOpen(true)}
            />
          ) : (
            <div className="space-y-3">
              {[...entries].reverse().slice(0, 15).map((entry) => {
                const mealType = MEAL_TYPES.find(m => m.value === entry.mealType);
                
                return (
                  <div
                    key={entry.id}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl group hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0 text-xl">
                      {mealType?.emoji || '🍽️'}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 truncate">
                          {entry.foodName}
                        </span>
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full capitalize">
                          {entry.mealType.replace('-', ' ')}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-3 mt-1 text-sm text-gray-500">
                        {entry.quantity && <span>{entry.quantity}</span>}
                        {entry.protein && <span>{entry.protein}g protein</span>}
                        {entry.calories && <span>{entry.calories} cal</span>}
                        {entry.notes && <span className="truncate max-w-[150px]">{entry.notes}</span>}
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
        title="Delete Meal?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </div>
  );
}
