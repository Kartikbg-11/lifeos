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
import { EmptyState } from '@/components/shared/empty-state';
import { ListSkeleton } from '@/components/shared/loading-skeleton';
import api from '@/services/api';
import { useAuthStore } from '@/store/use-auth-store';
import {
  Receipt,
  Plus,
  Trash2,
  Edit2,
  TrendingUp,
  Calendar,
  Wallet,
  CreditCard,
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

const EXPENSE_CATEGORIES = [
  { value: 'food', label: 'Food & Dining', emoji: '🍔', color: '#ef4444' },
  { value: 'travel', label: 'Travel', emoji: '🚗', color: '#f59e0b' },
  { value: 'shopping', label: 'Shopping', emoji: '🛍️', color: '#8b5cf6' },
  { value: 'gym', label: 'Gym & Fitness', emoji: '💪', color: '#10b981' },
  { value: 'education', label: 'Education', emoji: '📚', color: '#3b82f6' },
  { value: 'entertainment', label: 'Entertainment', emoji: '🎬', color: '#ec4899' },
  { value: 'bills', label: 'Bills & Utilities', emoji: '📄', color: '#6366f1' },
  { value: 'health', label: 'Health', emoji: '💊', color: '#14b8a6' },
  { value: 'other', label: 'Other', emoji: '📦', color: '#64748b' },
];

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash', icon: '💵' },
  { value: 'upi', label: 'UPI', icon: '📱' },
  { value: 'card', label: 'Card', icon: '💳' },
  { value: 'bank-transfer', label: 'Bank Transfer', icon: '🏦' },
  { value: 'other', label: 'Other', icon: '❓' },
];

interface ExpenseEntry {
  id: string;
  date: string;
  amount: number;
  category: string;
  reason?: string;
  paymentMethod?: string;
  notes?: string;
  createdAt: string;
}

export default function ExpensesPage() {
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<ExpenseEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ExpenseEntry | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    reason: '',
    paymentMethod: '',
    notes: '',
  });

  const currency = user?.settings?.currency || '₹';

  const fetchEntries = async () => {
    try {
      setIsLoading(true);
      const response = await api.expenses.getAll();
      // Handle both array and object responses
      setEntries(Array.isArray(response) ? response : (response?.entries || response?.expenses || []));
    } catch (error) {
      toast.error('Failed to load expense data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  // Calculate today's total
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayEntries = entries.filter((e) => e.date === today);
  const todayTotal = todayEntries.reduce((sum, e) => sum + e.amount, 0);

  // Calculate this month total
  const currentMonth = format(new Date(), 'yyyy-MM');
  const monthEntries = entries.filter((e) => e.date.startsWith(currentMonth));
  const monthTotal = monthEntries.reduce((sum, e) => sum + e.amount, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (!formData.category) {
      toast.error('Please select a category');
      return;
    }

    try {
      const payload = {
        amount: parseFloat(formData.amount),
        category: formData.category,
        reason: formData.reason || undefined,
        paymentMethod: formData.paymentMethod || undefined,
        notes: formData.notes || undefined,
      };

      if (editingEntry) {
        await api.expenses.update(editingEntry.id, payload);
        toast.success('Expense updated! 💰');
      } else {
        await api.expenses.create(payload);
        toast.success('Expense added! 💰');
      }

      resetForm();
      setDialogOpen(false);
      fetchEntries();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save expense');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      await api.expenses.delete(deleteId);
      toast.error('Expense deleted');
      setDeleteId(null);
      fetchEntries();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete');
    }
  };

  const resetForm = () => {
    setFormData({
      amount: '',
      category: '',
      reason: '',
      paymentMethod: '',
      notes: '',
    });
    setEditingEntry(null);
  };

  const openEditDialog = (entry: ExpenseEntry) => {
    setEditingEntry(entry);
    setFormData({
      amount: entry.amount.toString(),
      category: entry.category,
      reason: entry.reason || '',
      paymentMethod: entry.paymentMethod || '',
      notes: entry.notes || '',
    });
    setDialogOpen(true);
  };

  // Category distribution for pie chart
  const categoryData = EXPENSE_CATEGORIES.map((cat) => ({
    name: cat.label,
    value: monthEntries.filter((e) => e.category === cat.value).reduce((sum, e) => sum + e.amount, 0),
    color: cat.color,
  })).filter((d) => d.value > 0);

  // Daily spending for bar chart
  const dailyData = Array.from({ length: 14 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (13 - i));
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayEntries = entries.filter((e) => e.date === dateStr);
    return {
      date: format(date, 'd MMM'),
      amount: dayEntries.reduce((sum, e) => sum + e.amount, 0),
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
            <Receipt className="w-7 h-7 text-amber-500" />
            Expense Tracker
          </h1>
          <p className="text-gray-500 mt-1">Track your daily expenses</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 rounded-xl">
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingEntry ? 'Edit Expense' : 'Add Expense'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Amount ({currency}) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(v) => setFormData({ ...formData, category: v })}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.emoji} {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select
                    value={formData.paymentMethod}
                    onValueChange={(v) => setFormData({ ...formData, paymentMethod: v })}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((method) => (
                        <SelectItem key={method.value} value={method.value}>
                          {method.icon} {method.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Reason / Description</Label>
                <Input
                  placeholder="What was it for?"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
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
                {editingEntry ? 'Update Expense' : 'Save Expense'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-amber-50 to-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Today&apos;s Spending</p>
              <p className="text-2xl font-bold text-gray-900">{currency}{todayTotal.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">This Month</p>
              <p className="text-2xl font-bold text-gray-900">{currency}{monthTotal.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Receipt className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Entries</p>
              <p className="text-2xl font-bold text-gray-900">{entries.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Category Distribution */}
        <Card className="rounded-2xl border-0 shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Receipt className="w-5 h-5 text-gray-400" />
              By Category (This Month)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-400">
                No data yet
              </div>
            ) : (
              <>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => `${currency}${value.toFixed(2)}`}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Legend */}
                <div className="flex flex-wrap gap-3 mt-4 justify-center">
                  {categoryData.map((item) => (
                    <div key={item.name} className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs text-gray-600">{item.name}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Daily Trend */}
        <Card className="rounded-2xl border-0 shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-gray-400" />
              Last 14 Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(value: number) => `${currency}${value.toFixed(2)}`}
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Bar dataKey="amount" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Amount" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Expenses */}
      <Card className="rounded-2xl border-0 shadow-sm bg-white">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            Recent Expenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <EmptyState
              icon={<Receipt className="w-8 h-8" />}
              title="No expenses logged yet"
              description="Start tracking your spending!"
              actionLabel="Add First Expense"
              onAction={() => setDialogOpen(true)}
            />
          ) : (
            <div className="space-y-3">
              {[...entries].reverse().slice(0, 15).map((entry) => {
                const category = EXPENSE_CATEGORIES.find(c => c.value === entry.category);
                const payment = PAYMENT_METHODS.find(m => m.value === entry.paymentMethod);
                
                return (
                  <div
                    key={entry.id}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl group hover:bg-gray-100 transition-colors"
                  >
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
                      style={{ backgroundColor: `${category?.color || '#9ca3af'}15` }}
                    >
                      {category?.emoji || '📦'}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 truncate">
                          {entry.reason || category?.label || 'Expense'}
                        </span>
                        <span 
                          className="px-2 py-0.5 text-xs rounded-full font-medium capitalize"
                          style={{ backgroundColor: `${category?.color || '#9ca3af'}15`, color: category?.color || '#9ca3af' }}
                        >
                          {entry.category.replace('-', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                        {payment && <span>{payment.icon}</span>}
                        {entry.notes && <span className="truncate max-w-[150px]">{entry.notes}</span>}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-lg text-gray-900">
                        {currency}{entry.amount.toFixed(2)}
                      </p>
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

                    <span className="text-xs text-gray-400 hidden lg:block w-16 text-right">
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
        title="Delete Expense?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </div>
  );
}
