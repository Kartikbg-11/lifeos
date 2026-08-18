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
import { useAuthStore } from '@/store/use-auth-store';
import {
  Droplets,
  Plus,
  Trash2,
  TrendingUp,
  Calendar,
  GlassWater,
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

interface WaterEntry {
  id: string;
  date: string;
  amount: number; // ml
  notes?: string;
  createdAt: string;
}

const QUICK_AMOUNTS = [
  { label: '250ml', value: 250, icon: '🥛' },
  { label: '500ml', value: 500, icon: '🍶' },
  { label: '750ml', value: 750, icon: '🍾' },
  { label: '1L', value: 1000, icon: '🫗' },
];

export default function WaterPage() {
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<WaterEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [customDialogOpen, setCustomDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [customNotes, setCustomNotes] = useState('');

  const goal = user?.settings?.waterGoal || 3000; // ml (3 liters)

  const fetchEntries = async () => {
    try {
      setIsLoading(true);
      const response = await api.water.getAll();
      // Handle both array and object responses
      setEntries(Array.isArray(response) ? response : (response?.entries || response?.waterEntries || []));
    } catch (error) {
      toast.error('Failed to load water data');
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
  const todayTotalMl = todayEntries.reduce((sum, e) => sum + e.amount, 0);

  const quickAdd = async (amount: number) => {
    try {
      await api.water.create({ amount });
      toast.success(`Added ${amount >= 1000 ? `${amount / 1000}L` : `${amount}ml`} 💧`);
      fetchEntries();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add water entry');
    }
  };

  const handleCustomAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customAmount || parseInt(customAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      await api.water.create({
        amount: parseInt(customAmount),
        notes: customNotes || undefined,
      });
      
      const amt = parseInt(customAmount);
      toast.success(`Added ${amt >= 1000 ? `${amt / 1000}L` : `${amt}ml`} 💧`);
      
      setCustomAmount('');
      setCustomNotes('');
      setCustomDialogOpen(false);
      fetchEntries();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add water entry');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      await api.water.delete(deleteId);
      toast.error('Entry deleted');
      setDeleteId(null);
      fetchEntries();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete');
    }
  };

  // Calculate water level percentage
  const waterPercentage = Math.min(100, (todayTotalMl / goal) * 100);

  // Weekly data
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayEntries = entries.filter((e) => e.date === dateStr);
    return {
      date: format(date, 'EEE'),
      liters: Math.round(dayEntries.reduce((sum, e) => sum + e.amount, 0)) / 1000,
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
            <Droplets className="w-7 h-7 text-cyan-500" />
            Water Tracker
          </h1>
          <p className="text-gray-500 mt-1">Stay hydrated throughout the day</p>
        </div>
        
        <Dialog open={customDialogOpen} onOpenChange={setCustomDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="rounded-xl border-cyan-200 text-cyan-600 hover:bg-cyan-50">
              Custom Amount
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl max-w-sm">
            <DialogHeader>
              <DialogTitle>Add Custom Amount</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCustomAdd} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Amount (ml)</Label>
                <Input
                  type="number"
                  placeholder="e.g., 350"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Input
                  placeholder="e.g., Morning glass"
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 rounded-xl">
                Add Entry
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Main Water Display */}
      <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-cyan-50 via-blue-50 to-white overflow-hidden">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            {/* Water Visual */}
            <div className="relative">
              <svg width="180" height="220" viewBox="0 0 180 220" className="drop-shadow-lg">
                {/* Glass outline */}
                <path
                  d="M30 20 L30 180 Q30 210 60 210 L120 210 Q150 210 150 180 L150 20"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                
                {/* Water fill */}
                <clipPath id="glassClip">
                  <path d="M32 22 L32 178 Q32 208 60 208 L120 208 Q148 208 148 178 L148 22 Z" />
                </clipPath>
                <rect
                  x="25"
                  y={220 - (waterPercentage / 100) * 195}
                  width="130"
                  height={(waterPercentage / 100) * 195}
                  fill="url(#waterGradient)"
                  clipPath="url(#glassClip)"
                />
                
                {/* Gradient definition */}
                <defs>
                  <linearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="50%" stopColor="#0891b2" />
                    <stop offset="100%" stopColor="#0e7490" />
                  </linearGradient>
                  
                  {/* Wave animation */}
                  <style>{`
                    @keyframes wave {
                      0%, 100% { transform: translateX(0); }
                      50% { transform: translateX(-10px); }
                    }
                    .wave {
                      animation: wave 3s ease-in-out infinite;
                    }
                  `}</style>
                </defs>
                
                {/* Wave effect on top */}
                {waterPercentage > 0 && (
                  <ellipse
                    cx="90"
                    cy={220 - (waterPercentage / 100) * 195 + 10}
                    rx="55"
                    ry="8"
                    fill="#67e8f9"
                    opacity="0.6"
                    className="wave"
                  />
                )}
              </svg>
              
              {/* Overlay text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pt-12">
                <span className="text-4xl font-bold text-gray-800">
                  {(todayTotalMl / 1000).toFixed(2)}L
                </span>
                <span className="text-lg text-gray-500">/ {(goal / 1000).toFixed(1)}L</span>
              </div>
            </div>

            {/* Quick Add Buttons */}
            <div className="flex-1 w-full">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center lg:text-left">
                Quick Add
              </h2>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {QUICK_AMOUNTS.map((item) => (
                  <button
                    key={item.value}
                    onClick={() => quickAdd(item.value)}
                    className="p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 group border border-gray-100 hover:border-cyan-200"
                  >
                    <span className="text-2xl block mb-1 group-hover:scale-110 transition-transform">
                      {item.icon}
                    </span>
                    <span className="font-semibold text-gray-900">{item.label}</span>
                  </button>
                ))}
              </div>

              {todayTotalMl >= goal && (
                <div className="p-4 bg-emerald-50 rounded-xl text-center">
                  <span className="text-emerald-700 font-medium">
                    🎉 Hydration goal reached! Great job!
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-0 shadow-sm bg-white">
          <CardContent className="p-5 flex flex-col items-center justify-center">
            <GlassWater className="w-8 h-8 text-cyan-500 mb-2" />
            <p className="text-3xl font-bold text-gray-900">{todayEntries.length}</p>
            <p className="text-xs text-gray-500">Today&apos;s Entries</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm bg-white">
          <CardContent className="p-5 flex flex-col items-center justify-center">
            <TrendingUp className="w-8 h-8 text-blue-500 mb-2" />
            <p className="text-3xl font-bold text-gray-900">
              {(weeklyData.reduce((sum, d) => sum + d.liters, 0) / 7).toFixed(1)}L
            </p>
            <p className="text-xs text-gray-500">Daily Average (Week)</p>
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
            Weekly Intake
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} unit="L" />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  }}
                />
                <Bar dataKey="liters" fill="#06b6d4" radius={[6, 6, 0, 0]} name="Liters" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 p-3 bg-gray-50 rounded-xl flex items-center justify-between">
            <span className="text-sm text-gray-500">Daily Goal</span>
            <span className="font-semibold text-cyan-600">{(goal / 1000).toFixed(1)}L</span>
          </div>
        </CardContent>
      </Card>

      {/* Today's History */}
      <Card className="rounded-2xl border-0 shadow-sm bg-white">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Droplets className="w-5 h-5 text-gray-400" />
            Today&apos;s Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayEntries.length === 0 ? (
            <EmptyState
              icon={<GlassWater className="w-8 h-8" />}
              title="No water logged yet"
              description="Start tracking your hydration!"
              actionLabel="Add First Glass"
              onAction={() => quickAdd(250)}
            />
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {[...todayEntries].reverse().map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl group hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
                      <Droplets className="w-5 h-5 text-cyan-500" />
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">
                        {entry.amount >= 1000 ? `${entry.amount / 1000}L` : `${entry.amount}ml`}
                      </span>
                      {entry.notes && (
                        <span className="text-sm text-gray-500 ml-2">{entry.notes}</span>
                      )}
                      <p className="text-xs text-gray-400">
                        {format(new Date(entry.createdAt), 'hh:mm a')}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setDeleteId(entry.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
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
        title="Delete Entry?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </div>
  );
}
