'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartSkeleton } from '@/components/shared/loading-skeleton';
import api from '@/services/api';
import { useAuthStore } from '@/store/use-auth-store';
import {
  BarChart3,
  TrendingUp,
  Trophy,
  Flame,
  Calendar,
  Dumbbell,
  BookOpen,
  GraduationCap,
  Moon,
  Droplets,
  UtensilsCrossed,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from 'recharts';

interface AnalyticsData {
  fitness: any[];
  learning: any[];
  interview: any[];
  sleep: any[];
  food: any[];
  water: any[];
  expenses: any[];
}

export default function AnalyticsPage() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('week');
  
  // Mock data for demonstration - in production this would come from API
  const [data, setData] = useState<AnalyticsData>({
    fitness: [],
    learning: [],
    interview: [],
    sleep: [],
    food: [],
    water: [],
    expenses: [],
  });

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch data from all APIs
        const [fitnessRes, learningRes, interviewRes, sleepRes, foodRes, waterRes, expenseRes] = 
          await Promise.all([
            api.fitness.getAll(),
            api.learning.getAll(),
            api.interview.getAll(),
            api.sleep.getAll(),
            api.food.getAll(),
            api.water.getAll(),
            api.expenses.getAll(),
          ]);

        // Helper to extract array from response
        const toArray = (res: any) => Array.isArray(res) ? res : (res?.entries || res?.sessions || res?.expenses || res?.foodEntries || res?.waterEntries || res?.sleepEntries || []);
        
        setData({
          fitness: toArray(fitnessRes),
          learning: toArray(learningRes),
          interview: toArray(interviewRes),
          sleep: toArray(sleepRes),
          food: toArray(foodRes),
          water: toArray(waterRes),
          expenses: toArray(expenseRes),
        });
      } catch (error) {
        console.error('Failed to load analytics data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, []);

  // Generate chart data based on time range
  const getChartData = () => {
    const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90;
    const startDate = subDays(new Date(), days - 1);
    
    return Array.from({ length: days }, (_, i) => {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      const dayFitness = data.fitness.filter(e => e.date === dateStr);
      const dayLearning = data.learning.filter(e => e.date === dateStr);
      const dayInterview = data.interview.filter(e => e.date === dateStr);
      const daySleep = data.sleep.find(e => e.date === dateStr);
      const dayFood = data.food.filter(e => e.date === dateStr);
      const dayWater = data.water.filter(e => e.date === dateStr);
      const dayExpenses = data.expenses.filter(e => e.date === dateStr);

      return {
        date: days <= 14 ? format(date, 'EEE d') : format(date, 'd MMM'),
        fullDate: dateStr,
        fitness: dayFitness.reduce((sum, e) => sum + (e.workoutDuration || 0), 0),
        pushups: dayFitness.reduce((sum, e) => sum + e.pushups, 0),
        learning: Math.round(dayLearning.reduce((sum, e) => sum + (e.duration || 0), 0) / 60 * 10) / 10,
        interview: Math.round(dayInterview.reduce((sum, e) => sum + (e.duration || 0), 0) / 60 * 10) / 10,
        sleep: daySleep ? Math.round(daySleep.totalMinutes / 60 * 10) / 10 : 0,
        protein: dayFood.reduce((sum, e) => sum + (e.protein || 0), 0),
        water: Math.round(dayWater.reduce((sum, e) => sum + e.amount, 0)) / 1000,
        expenses: dayExpenses.reduce((sum, e) => sum + e.amount, 0),
      };
    });
  };

  const chartData = getChartData();

  // Calculate summary stats
  const stats = {
    totalWorkoutMins: chartData.reduce((sum, d) => sum + d.fitness, 0),
    totalPushups: chartData.reduce((sum, d) => sum + d.pushups, 0),
    totalLearningHrs: chartData.reduce((sum, d) => sum + d.learning, 0).toFixed(1),
    totalInterviewHrs: chartData.reduce((sum, d) => sum + d.interview, 0).toFixed(1),
    avgSleepHrs: (chartData.filter(d => d.sleep > 0).reduce((sum, d) => sum + d.sleep, 0) / chartData.filter(d => d.sleep > 0).length || 1).toFixed(1),
    avgProtein: Math.round(chartData.reduce((sum, d) => sum + d.protein, 0) / chartData.length),
    totalWaterL: chartData.reduce((sum, d) => sum + d.water, 0).toFixed(1),
    totalExpenses: chartData.reduce((sum, d) => sum + d.expenses, 0).toFixed(2),
  };

  // Best and worst days
  const getBestDay = (key: keyof typeof chartData[0]) => {
    const sorted = [...chartData].sort((a, b) => (b[key] as number) - (a[key] as number));
    return sorted[0]?.date || '--';
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <ChartSkeleton />
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-blue-500" />
            Analytics
          </h1>
          <p className="text-gray-500 mt-1">Insights into your progress</p>
        </div>

        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[140px] rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Last 7 Days</SelectItem>
            <SelectItem value="month">Last 30 Days</SelectItem>
            <SelectItem value="quarter">Last 90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-orange-50 to-white p-4">
          <div className="flex items-center gap-3">
            <Dumbbell className="w-8 h-8 text-orange-500" />
            <div>
              <p className="text-xs text-gray-500">Total Workout</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalWorkoutMins} min</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-blue-50 to-white p-4">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-xs text-gray-500">Learning</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalLearningHrs} hrs</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-purple-50 to-white p-4">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-purple-500" />
            <div>
              <p className="text-xs text-gray-500">Interview Prep</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalInterviewHrs} hrs</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-indigo-50 to-white p-4">
          <div className="flex items-center gap-3">
            <Moon className="w-8 h-8 text-indigo-500" />
            <div>
              <p className="text-xs text-gray-500">Avg Sleep</p>
              <p className="text-xl font-bold text-gray-900">{stats.avgSleepHrs} hrs</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-0 shadow-sm bg-white p-4">
          <div className="flex items-center gap-3">
            <Flame className="w-8 h-8 text-red-500" />
            <div>
              <p className="text-xs text-gray-500">Push-ups</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalPushups}</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm bg-white p-4">
          <div className="flex items-center gap-3">
            <UtensilsCrossed className="w-8 h-8 text-red-500" />
            <div>
              <p className="text-xs text-gray-500">Avg Protein</p>
              <p className="text-xl font-bold text-gray-900">{stats.avgProtein}g</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm bg-white p-4">
          <div className="flex items-center gap-3">
            <Droplets className="w-8 h-8 text-cyan-500" />
            <div>
              <p className="text-xs text-gray-500">Total Water</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalWaterL}L</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm bg-white p-4">
          <div className="flex items-center gap-3">
            <Receipt className="w-8 h-8 text-amber-500" />
            <div>
              <p className="text-xs text-gray-500">Expenses</p>
              <p className="text-xl font-bold text-gray-900">₹{stats.totalExpenses}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-gray-100 rounded-xl p-1 w-full overflow-x-auto">
          <TabsTrigger value="overview" className="rounded-lg whitespace-nowrap">Overview</TabsTrigger>
          <TabsTrigger value="fitness" className="rounded-lg whitespace-nowrap">Fitness</TabsTrigger>
          <TabsTrigger value="learning" className="rounded-lg whitespace-nowrap">Learning & Interview</TabsTrigger>
          <TabsTrigger value="health" className="rounded-lg whitespace-nowrap">Health</TabsTrigger>
          <TabsTrigger value="finance" className="rounded-lg whitespace-nowrap">Finance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <Card className="rounded-2xl border-0 shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Daily Activity Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="fitness" fill="#f97316" name="Workout (min)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="learning" fill="#3b82f6" name="Learning (hrs)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="interview" fill="#8b5cf6" name="Interview (hrs)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Best/Worst Day Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="rounded-2xl border-0 shadow-sm bg-white p-4">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <span className="text-sm font-medium text-gray-700">Best Workout Day</span>
              </div>
              <p className="text-lg font-bold text-gray-900">{getBestDay('fitness')}</p>
            </Card>

            <Card className="rounded-2xl border-0 shadow-sm bg-white p-4">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium text-gray-700">Most Learning</span>
              </div>
              <p className="text-lg font-bold text-gray-900">{getBestDay('learning')}</p>
            </Card>

            <Card className="rounded-2xl border-0 shadow-sm bg-white p-4">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-emerald-500" />
                <span className="text-sm font-medium text-gray-700">Best Sleep</span>
              </div>
              <p className="text-lg font-bold text-gray-900">{getBestDay('sleep')}</p>
            </Card>

            <Card className="rounded-2xl border-0 shadow-sm bg-white p-4">
              <div className="flex items-center gap-2 mb-2">
                <Droplets className="w-5 h-5 text-cyan-500" />
                <span className="text-sm font-medium text-gray-700">Most Hydrated</span>
              </div>
              <p className="text-lg font-bold text-gray-900">{getBestDay('water')}</p>
            </Card>
          </div>
        </TabsContent>

        {/* Fitness Tab */}
        <TabsContent value="fitness" className="mt-4 space-y-4">
          <Card className="rounded-2xl border-0 shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-orange-500" />
                Workout Duration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} unit=" min" />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                    <Area type="monotone" dataKey="fitness" stroke="#f97316" fill="#fed7aa" name="Minutes" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-0 shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Flame className="w-5 h-5 text-red-500" />
                Push-ups Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                    <Bar dataKey="pushups" fill="#ef4444" radius={[4, 4, 0, 0]} name="Push-ups" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Learning Tab */}
        <TabsContent value="learning" className="mt-4 space-y-4">
          <Card className="rounded-2xl border-0 shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-500" />
                Learning Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} unit=" hrs" />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                    <Area type="monotone" dataKey="learning" stroke="#3b82f6" fill="#bfdbfe" name="Hours" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-0 shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-purple-500" />
                Interview Prep Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} unit=" hrs" />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                    <Area type="monotone" dataKey="interview" stroke="#8b5cf6" fill="#ddd6fe" name="Hours" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Health Tab */}
        <TabsContent value="health" className="mt-4 space-y-4">
          <Card className="rounded-2xl border-0 shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Moon className="w-5 h-5 text-indigo-500" />
                Sleep Pattern
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} unit=" hrs" domain={[0, 12]} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                    <Line type="monotone" dataKey="sleep" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1' }} name="Hours" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="rounded-2xl border-0 shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <UtensilsCrossed className="w-5 h-5 text-red-500" />
                  Protein Intake
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                      <YAxis fontSize={12} tickLine={false} axisLine={false} unit=" g" />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                      <Bar dataKey="protein" fill="#ef4444" radius={[4, 4, 0, 0]} name="Protein (g)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-0 shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-cyan-500" />
                  Water Intake
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                      <YAxis fontSize={12} tickLine={false} axisLine={false} unit=" L" />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                      <Bar dataKey="water" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Liters" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Finance Tab */}
        <TabsContent value="finance" className="mt-4 space-y-4">
          <Card className="rounded-2xl border-0 shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-500" />
                Daily Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      formatter={(value: number) => [`₹${value.toFixed(2)}`, 'Expense']}
                      contentStyle={{ borderRadius: '12px', border: 'none' }} 
                    />
                    <Bar dataKey="expenses" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Amount (₹)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-white p-6">
            <div className="text-center">
              <Trophy className="w-12 h-12 text-amber-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Keep Tracking!</h3>
              <p className="text-gray-500 text-sm max-w-md mx-auto">
                Consistent tracking leads to better insights. Continue logging your daily activities to see meaningful analytics.
              </p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
