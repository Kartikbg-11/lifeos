import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, getTodayInTimezone } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const typeParam = searchParams.get('type'); // daily, weekly, monthly, category
    const dateParam = searchParams.get('date');
    const monthParam = searchParams.get('month'); // YYYY-MM

    const today = getTodayInTimezone();
    const targetDate = dateParam || today;
    const targetMonth = monthParam || today.substring(0, 7);

    // Get user's currency preference
    const userData = await db.user.findUnique({
      where: { id: user.id },
      select: { currency: true },
    });

    const currency = userData?.currency || '₹';

    switch (typeParam) {
      case 'daily':
        return getDailySummary(user.id, targetDate, currency);
      case 'weekly':
        return getWeeklySummary(user.id, targetDate, currency);
      case 'monthly':
        return getMonthlySummary(user.id, targetMonth, currency);
      case 'category':
        return getCategorySummary(user.id, targetMonth, currency);
      default:
        return getAllSummaries(user.id, targetDate, targetMonth, currency);
    }
  } catch (error) {
    console.error('Expenses summary error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getDailySummary(userId: string, date: string, currency: string) {
  const entries = await db.expenseEntry.findMany({
    where: { userId, date },
  });

  const total = entries.reduce((sum, e) => sum + e.amount, 0);

  return NextResponse.json({
    success: true,
    data: {
      type: 'daily',
      date,
      total: parseFloat(total.toFixed(2)),
      count: entries.length,
      entries,
      byCategory: groupByCategory(entries),
    },
  });
}

async function getWeeklySummary(userId: string, date: string, currency: string) {
  // Calculate week start (Monday) and end (Sunday)
  const currentDate = new Date(date + 'T00:00:00');
  const dayOfWeek = currentDate.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const weekStart = new Date(currentDate);
  weekStart.setDate(currentDate.getDate() + mondayOffset);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const formatDate = (d: Date) => d.toISOString().split('T')[0];
  const weekStartStr = formatDate(weekStart);
  const weekEndStr = formatDate(weekEnd);

  const entries = await db.expenseEntry.findMany({
    where: {
      userId,
      date: { gte: weekStartStr, lte: weekEndStr },
    },
  });

  const total = entries.reduce((sum, e) => sum + e.amount, 0);

  // Daily breakdown
  const dailyBreakdown: Record<string, { total: number; count: number }> = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const dateStr = formatDate(d);
    const dayEntries = entries.filter((e) => e.date === dateStr);
    dailyBreakdown[dateStr] = {
      total: parseFloat(dayEntries.reduce((s, e) => s + e.amount, 0).toFixed(2)),
      count: dayEntries.length,
    };
  }

  return NextResponse.json({
    success: true,
    data: {
      type: 'weekly',
      period: { start: weekStartStr, end: weekEndStr },
      total: parseFloat(total.toFixed(2)),
      count: entries.length,
      dailyAverage: parseFloat((total / 7).toFixed(2)),
      dailyBreakdown,
      byCategory: groupByCategory(entries),
    },
  });
}

async function getMonthlySummary(userId: string, month: string, currency: string) {
  const monthStart = `${month}-01`;
  const year = parseInt(month.split('-')[0], 10);
  const monthNum = parseInt(month.split('-')[1], 10);
  const lastDay = new Date(year, monthNum, 0).getDate();
  const monthEnd = `${month}-${lastDay.toString().padStart(2, '0')}`;

  const entries = await db.expenseEntry.findMany({
    where: {
      userId,
      date: { gte: monthStart, lte: monthEnd },
    },
  });

  const total = entries.reduce((sum, e) => sum + e.amount, 0);

  // Daily breakdown for the month
  const dailyBreakdown: Record<string, { total: number; count: number }> = {};
  for (let day = 1; day <= lastDay; day++) {
    const dateStr = `${month}-${day.toString().padStart(2, '0')}`;
    const dayEntries = entries.filter((e) => e.date === dateStr);
    dailyBreakdown[dateStr] = {
      total: parseFloat(dayEntries.reduce((s, e) => s + e.amount, 0).toFixed(2)),
      count: dayEntries.length,
    };
  }

  // Find highest spending day
  const highestSpendingDay = Object.entries(dailyBreakdown)
    .filter(([_, data]) => data.total > 0)
    .sort((a, b) => b[1].total - a[1].total)[0];

  return NextResponse.json({
    success: true,
    data: {
      type: 'monthly',
      period: { start: monthStart, end: monthEnd },
      total: parseFloat(total.toFixed(2)),
      count: entries.length,
      dailyAverage: parseFloat((total / lastDay).toFixed(2)),
      highestSpendingDay: highestSpendingDay
        ? { date: highestSpendingDay[0], ...highestSpendingDay[1] }
        : null,
      dailyBreakdown,
      byCategory: groupByCategory(entries),
    },
  });
}

async function getCategorySummary(userId: string, month: string, currency: string) {
  const monthStart = `${month}-01`;
  const year = parseInt(month.split('-')[0], 10);
  const monthNum = parseInt(month.split('-')[1], 10);
  const lastDay = new Date(year, monthNum, 0).getDate();
  const monthEnd = `${month}-${lastDay.toString().padStart(2, '0')}`;

  const entries = await db.expenseEntry.findMany({
    where: {
      userId,
      date: { gte: monthStart, lte: monthEnd },
    },
  });

  const total = entries.reduce((sum, e) => sum + e.amount, 0);
  const categories = groupByCategory(entries);

  // Calculate percentages and sort by amount
  const categoryArray = Object.entries(categories)
    .map(([category, data]) => ({
      category,
      ...data,
      percentage: total > 0 ? parseFloat(((data.total / total) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.total - a.total);

  return NextResponse.json({
    success: true,
    data: {
      type: 'category',
      period: { start: monthStart, end: monthEnd },
      total: parseFloat(total.toFixed(2)),
      categories: categoryArray,
    },
  });
}

async function getAllSummaries(
  userId: string,
  date: string,
  month: string,
  currency: string
) {
  // Get all summaries at once
  const [dailyResult, weeklyResult, monthlyResult, categoryResult] = await Promise.all([
    getDailyData(userId, date),
    getWeeklyData(userId, date),
    getMonthlyData(userId, month),
    getCategoryData(userId, month),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      daily: dailyResult,
      weekly: weeklyResult,
      monthly: monthlyResult,
      category: categoryResult,
      currency,
    },
  });
}

// Helper functions to get raw data without response wrapping
async function getDailyData(userId: string, date: string) {
  const entries = await db.expenseEntry.findMany({ where: { userId, date } });
  const total = entries.reduce((sum, e) => sum + e.amount, 0);
  return {
    date,
    total: parseFloat(total.toFixed(2)),
    count: entries.length,
    byCategory: groupByCategory(entries),
  };
}

async function getWeeklyData(userId: string, date: string) {
  const currentDate = new Date(date + 'T00:00:00');
  const dayOfWeek = currentDate.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const weekStart = new Date(currentDate);
  weekStart.setDate(currentDate.getDate() + mondayOffset);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  const entries = await db.expenseEntry.findMany({
    where: {
      userId,
      date: { gte: formatDate(weekStart), lte: formatDate(weekEnd) },
    },
  });

  const total = entries.reduce((sum, e) => sum + e.amount, 0);
  return {
    period: { start: formatDate(weekStart), end: formatDate(weekEnd) },
    total: parseFloat(total.toFixed(2)),
    count: entries.length,
    byCategory: groupByCategory(entries),
  };
}

async function getMonthlyData(userId: string, month: string) {
  const monthStart = `${month}-01`;
  const year = parseInt(month.split('-')[0], 10);
  const monthNum = parseInt(month.split('-')[1], 10);
  const lastDay = new Date(year, monthNum, 0).getDate();
  const monthEnd = `${month}-${lastDay.toString().padStart(2, '0')}`;

  const entries = await db.expenseEntry.findMany({
    where: { userId, date: { gte: monthStart, lte: monthEnd } },
  });

  const total = entries.reduce((sum, e) => sum + e.amount, 0);
  return {
    period: { start: monthStart, end: monthEnd },
    total: parseFloat(total.toFixed(2)),
    count: entries.length,
    dailyAverage: parseFloat((total / lastDay).toFixed(2)),
    byCategory: groupByCategory(entries),
  };
}

async function getCategoryData(userId: string, month: string) {
  const monthStart = `${month}-01`;
  const year = parseInt(month.split('-')[0], 10);
  const monthNum = parseInt(month.split('-')[1], 10);
  const lastDay = new Date(year, monthNum, 0).getDate();
  const monthEnd = `${month}-${lastDay.toString().padStart(2, '0')}`;

  const entries = await db.expenseEntry.findMany({
    where: { userId, date: { gte: monthStart, lte: monthEnd } },
  });

  const total = entries.reduce((sum, e) => sum + e.amount, 0);
  const categories = groupByCategory(entries);

  return Object.entries(categories)
    .map(([category, data]) => ({
      category,
      ...data,
      percentage: total > 0 ? parseFloat(((data.total / total) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

function groupByCategory(entries: { amount: number; category: string }[]) {
  return entries.reduce(
    (acc, entry) => {
      if (!acc[entry.category]) {
        acc[entry.category] = { total: 0, count: 0 };
      }
      acc[entry.category].total += entry.amount;
      acc[entry.category].count++;
      return acc;
    },
    {} as Record<string, { total: number; count: number }>
  );
}
