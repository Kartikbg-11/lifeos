'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import api from '@/services/api';

interface DayData {
  date: string;
  fitness: number;
  learning: number;
  interview: number;
  sleep: number;
  water: number;
  protein: number;
  expenses: number;
  habitsCompleted: number;
  habitsTotal: number;
}

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dayData, setDayData] = useState<Record<string, DayData>>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all data for calendar
      const [fitnessRes, learningRes, interviewRes, sleepRes, foodRes, waterRes, expenseRes, dashboardData] = 
        await Promise.all([
          api.fitness.getAll(),
          api.learning.getAll(),
          api.interview.getAll(),
          api.sleep.getAll(),
          api.food.getAll(),
          api.water.getAll(),
          api.expenses.getAll(),
          api.dashboard.getToday().catch(() => null),
        ]);

      // Helper to extract array from response
      const toArray = (res: any) => Array.isArray(res) ? res : (res?.entries || res?.sessions || res?.expenses || res?.foodEntries || res?.waterEntries || res?.sleepEntries || []);
      
      const fitnessData = toArray(fitnessRes);
      const learningData = toArray(learningRes);
      const interviewData = toArray(interviewRes);
      const sleepData = toArray(sleepRes);
      const foodData = toArray(foodRes);
      const waterData = toArray(waterRes);
      const expenseData = toArray(expenseRes);

      // Process data into day-by-day format
      const processed: Record<string, DayData> = {};

      // Process fitness
      fitnessData.forEach((entry: any) => {
        if (!processed[entry.date]) processed[entry.date] = getEmptyDayData(entry.date);
        processed[entry.date].fitness += entry.workoutDuration || 0;
      });

      // Process learning
      learningData.forEach((session: any) => {
        if (!processed[session.date]) processed[session.date] = getEmptyDayData(session.date);
        processed[session.date].learning += session.duration || 0;
      });

      // Process interview
      interviewData.forEach((session: any) => {
        if (!processed[session.date]) processed[session.date] = getEmptyDayData(session.date);
        processed[session.date].interview += session.duration || 0;
      });

      // Process sleep
      sleepData.forEach((entry: any) => {
        if (!processed[entry.date]) processed[entry.date] = getEmptyDayData(entry.date);
        processed[entry.date].sleep = entry.totalMinutes || 0;
      });

      // Process food (protein)
      foodData.forEach((entry: any) => {
        if (!processed[entry.date]) processed[entry.date] = getEmptyDayData(entry.date);
        processed[entry.date].protein += entry.protein || 0;
      });

      // Process water
      waterData.forEach((entry: any) => {
        if (!processed[entry.date]) processed[entry.date] = getEmptyDayData(entry.date);
        processed[entry.date].water += entry.amount;
      });

      // Process expenses
      expenseData.forEach((entry: any) => {
        if (!processed[entry.date]) processed[entry.date] = getEmptyDayData(entry.date);
        processed[entry.date].expenses += entry.amount;
      });

      // Add habits if available from dashboard
      if (dashboardData?.data?.habits) {
        const today = new Date().toISOString().split('T')[0];
        if (!processed[today]) processed[today] = getEmptyDayData(today);
        processed[today].habitsCompleted = dashboardData.data.habits.completedCount;
        processed[today].habitsTotal = dashboardData.data.habits.totalCount;
      }

      setDayData(processed);
    } catch (error) {
      console.error('Failed to load calendar data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getEmptyDayData = (date: string): DayData => ({
    date,
    fitness: 0,
    learning: 0,
    interview: 0,
    sleep: 0,
    water: 0,
    protein: 0,
    expenses: 0,
    habitsCompleted: 0,
    habitsTotal: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate score for a day (0-100)
  const calculateDayScore = (data: DayData): number => {
    let score = 0;
    let count = 0;

    // Fitness (20 points max) - goal 60 min
    score += Math.min(20, (data.fitness / 60) * 20);
    count++;

    // Learning (15 points max) - goal 180 min (3 hrs)
    score += Math.min(15, (data.learning / 180) * 15);
    count++;

    // Interview (20 points max) - goal 180 min
    score += Math.min(20, (data.interview / 180) * 20);
    count++;

    // Sleep (15 points max) - goal 480 min (8 hrs)
    score += Math.min(15, (data.sleep / 480) * 15);
    count++;

    // Water (10 points max) - goal 3000 ml
    score += Math.min(10, (data.water / 3000) * 10);
    count++;

    // Protein (10 points max) - goal 100g
    score += Math.min(10, (data.protein / 100) * 10);
    count++;

    return Math.round(score);
  };

  // Get color based on score
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'bg-emerald-500 text-white';
    if (score >= 60) return 'bg-emerald-400 text-white';
    if (score >= 40) return 'bg-amber-400 text-white';
    if (score >= 20) return 'bg-orange-400 text-white';
    if (score > 0) return 'bg-red-400 text-white';
    return 'bg-gray-100 text-gray-400';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Average';
    if (score >= 20) return 'Below Avg';
    if (score > 0) return 'Poor';
    return '';
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days: Date[] = [];
    let day = calendarStart;

    while (day <= calendarEnd) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
  };

  const calendarDays = generateCalendarDays();
  const selectedDateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;
  const selectedDayData = selectedDateStr ? dayData[selectedDateStr] : null;
  const selectedScore = selectedDayData ? calculateDayScore(selectedDayData) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          📅 Calendar View
        </h1>
        <p className="text-gray-500 mt-1">Visual overview of your daily progress</p>
      </div>

      {/* Legend */}
      <Card className="rounded-2xl border-0 shadow-sm bg-white p-4">
        <div className="flex flex-wrap items-center gap-4 justify-center text-sm">
          <span className="font-medium text-gray-600">Daily Score:</span>
          {[
            { label: 'Excellent (80+)', class: 'bg-emerald-500' },
            { label: 'Good (60-79)', class: 'bg-emerald-400' },
            { label: 'Average (40-59)', class: 'bg-amber-400' },
            { label: 'Below Avg (20-39)', class: 'bg-orange-400' },
            { label: 'Poor (<20)', class: 'bg-red-400' },
            { label: 'No Data', class: 'bg-gray-100' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div className={`w-4 h-4 rounded ${item.class}`} />
              <span className="text-gray-500">{item.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Calendar Grid */}
      <Card className="rounded-2xl border-0 shadow-sm bg-white overflow-hidden">
        {/* Month Navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="rounded-xl"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          
          <h2 className="text-lg font-semibold text-gray-900">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="rounded-xl"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Week Headers */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} className="py-3 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayInfo = dayData[dateStr];
            const score = dayInfo ? calculateDayScore(dayInfo) : 0;
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());

            return (
              <button
                key={index}
                onClick={() => setSelectedDate(day)}
                className={`
                  relative aspect-square p-2 flex flex-col items-center justify-center
                  transition-all duration-200 hover:bg-gray-50
                  ${!isCurrentMonth ? 'opacity-30' : ''}
                  ${isSelected ? 'ring-2 ring-offset-2 ring-emerald-500' : ''}
                `}
              >
                <span className={`text-sm ${
                  isToday ? 'font-bold text-emerald-600' : 
                  isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                }`}>
                  {format(day, 'd')}
                </span>
                
                {score > 0 && (
                  <div className={`w-2 h-2 rounded-full mt-1 ${getScoreColor(score).split(' ')[0]}`} />
                )}
                
                {isToday && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-500" />
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Selected Day Details */}
      {selectedDate && (
        <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-gray-50 to-white overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Score Circle */}
              <div className="flex-shrink-0">
                <div className={`w-24 h-24 rounded-full ${getScoreColor(selectedScore)} flex items-center justify-center`}>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{selectedScore}</p>
                    <p className="text-xs opacity-80">pts</p>
                  </div>
                </div>
                <p className="text-center mt-2 text-sm font-medium text-gray-700">
                  {format(selectedDate, 'EEEE, MMM d, yyyy')}
                </p>
                <p className="text-center text-xs text-gray-500">
                  {getScoreLabel(selectedScore)}
                </p>
              </div>

              {/* Details */}
              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                <DetailCard
                  title="Fitness"
                  value={`${selectedDayData?.fitness || 0} min`}
                  icon="💪"
                  color="#f97316"
                  goal={60}
                  actual={selectedDayData?.fitness || 0}
                />
                <DetailCard
                  title="Learning"
                  value={`${Math.round((selectedDayData?.learning || 0) / 60 * 10) / 10} hrs`}
                  icon="📚"
                  color="#3b82f6"
                  goal={180}
                  actual={selectedDayData?.learning || 0}
                />
                <DetailCard
                  title="Interview"
                  value={`${Math.round((selectedDayData?.interview || 0) / 60 * 10) / 10} hrs`}
                  icon="🎯"
                  color="#8b5cf6"
                  goal={180}
                  actual={selectedDayData?.interview || 0}
                />
                <DetailCard
                  title="Sleep"
                  value={`${Math.round((selectedDayData?.sleep || 0) / 60)} hrs`}
                  icon="😴"
                  color="#6366f1"
                  goal={480}
                  actual={selectedDayData?.sleep || 0}
                />
                <DetailCard
                  title="Protein"
                  value={`${selectedDayData?.protein || 0}g`}
                  icon="🥩"
                  color="#ef4444"
                  goal={100}
                  actual={selectedDayData?.protein || 0}
                />
                <DetailCard
                  title="Water"
                  value={`${((selectedDayData?.water || 0) / 1000).toFixed(1)}L`}
                  icon="💧"
                  color="#06b6d4"
                  goal={3000}
                  actual={selectedDayData?.water || 0}
                />
                <DetailCard
                  title="Expenses"
                  value={`₹${(selectedDayData?.expenses || 0).toFixed(0)}`}
                  icon="💰"
                  color="#f59e0b"
                />
                <DetailCard
                  title="Habits"
                  value={`${selectedDayData?.habitsCompleted || 0}/${selectedDayData?.habitsTotal || 0}`}
                  icon="✅"
                  color="#10b981"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Summary */}
      <Card className="rounded-2xl border-0 shadow-sm bg-white">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Monthly Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(() => {
              const monthDays = Object.entries(dayData).filter(([d]) => 
                d.startsWith(format(currentMonth, 'yyyy-MM'))
              );
              
              const totalDaysWithData = monthDays.length;
              const avgScore = totalDaysWithData > 0 
                ? Math.round(monthDays.reduce((sum, [, d]) => sum + calculateDayScore(d), 0) / totalDaysWithData)
                : 0;
              
              const excellentDays = monthDays.filter(([, d]) => calculateDayScore(d) >= 80).length;
              const goodDays = monthDays.filter(([, d]) => calculateDayScore(d) >= 60).length;

              return [
                { label: 'Days Tracked', value: totalDaysWithData, icon: '📊' },
                { label: 'Avg Score', value: `${avgScore}/100`, icon: '⭐' },
                { label: 'Excellent Days', value: excellentDays, icon: '🎉' },
                { label: 'Good Days (60+)', value: goodDays, icon: '👍' },
              ];
            })().map((stat) => (
              <div key={stat.label} className="p-4 bg-gray-50 rounded-xl text-center">
                <span className="text-2xl">{stat.icon}</span>
                <p className="text-xl font-bold text-gray-900 mt-1">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Detail card component for selected day
function DetailCard({ 
  title, 
  value, 
  icon, 
  color,
  goal,
  actual 
}: { 
  title: string; 
  value: string; 
  icon: string; 
  color: string;
  goal?: number;
  actual?: number;
}) {
  const percentage = goal && actual ? Math.min(100, (actual / goal) * 100) : null;

  return (
    <div className="p-3 bg-white rounded-xl border border-gray-100">
      <div className="flex items-center gap-2 mb-1">
        <span>{icon}</span>
        <span className="text-xs text-gray-500">{title}</span>
      </div>
      <p className="font-semibold text-gray-900">{value}</p>
      {percentage !== null && (
        <div className="mt-1.5 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all" 
            style={{ width: `${percentage}%`, backgroundColor: color }}
          />
        </div>
      )}
    </div>
  );
}
