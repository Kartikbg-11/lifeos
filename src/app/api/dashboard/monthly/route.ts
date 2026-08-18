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

    const today = getTodayInTimezone();
    const searchParams = request.nextUrl.searchParams;
    const monthParam = searchParams.get('month'); // YYYY-MM format

    // Use provided month or current month
    const targetMonth = monthParam || today.substring(0, 7); // YYYY-MM
    const year = parseInt(targetMonth.split('-')[0], 10);
    const month = parseInt(targetMonth.split('-')[1], 10);

    // Calculate month start and end dates
    const monthStart = `${targetMonth}-01`;
    const lastDayOfMonth = new Date(year, month, 0).getDate();
    const monthEnd = `${targetMonth}-${lastDayOfMonth.toString().padStart(2, '0')}`;

    // Get user settings
    const userData = await db.user.findUnique({
      where: { id: user.id },
      select: {
        workoutGoal: true,
        learningGoal: true,
        interviewGoal: true,
        sleepGoal: true,
        waterGoal: true,
        proteinGoal: true,
        currency: true,
      },
    });

    // Fetch monthly data
    const [
      fitnessEntries,
      learningSessions,
      interviewSessions,
      sleepEntries,
      waterEntries,
      foodEntries,
      expenseEntries,
      dailyEntries,
      habitCompletions,
    ] = await Promise.all([
      db.fitnessEntry.findMany({
        where: {
          userId: user.id,
          date: { gte: monthStart, lte: monthEnd },
        },
        orderBy: { date: 'asc' },
      }),
      db.learningSession.findMany({
        where: {
          userId: user.id,
          date: { gte: monthStart, lte: monthEnd },
        },
        orderBy: { date: 'asc' },
      }),
      db.interviewSession.findMany({
        where: {
          userId: user.id,
          date: { gte: monthStart, lte: monthEnd },
        },
        orderBy: { date: 'asc' },
      }),
      db.sleepEntry.findMany({
        where: {
          userId: user.id,
          date: { gte: monthStart, lte: monthEnd },
        },
        orderBy: { date: 'asc' },
      }),
      db.waterEntry.findMany({
        where: {
          userId: user.id,
          date: { gte: monthStart, lte: monthEnd },
        },
        orderBy: { date: 'asc' },
      }),
      db.foodEntry.findMany({
        where: {
          userId: user.id,
          date: { gte: monthStart, lte: monthEnd },
        },
        orderBy: { date: 'asc' },
      }),
      db.expenseEntry.findMany({
        where: {
          userId: user.id,
          date: { gte: monthStart, lte: monthEnd },
        },
        orderBy: { date: 'asc' },
      }),
      db.dailyEntry.findMany({
        where: {
          userId: user.id,
          date: { gte: monthStart, lte: monthEnd },
        },
      }),
      db.habitCompletion.findMany({
        where: {
          userId: user.id,
          date: { gte: monthStart, lte: monthEnd },
        },
      }),
    ]);

    // Group by date for calendar view
    const dailyDataMap = new Map<string, object>();

    for (let day = 1; day <= lastDayOfMonth; day++) {
      const dateStr = `${targetMonth}-${day.toString().padStart(2, '0')}`;
      const dayFitness = fitnessEntries.filter((e) => e.date === dateStr);
      const dayLearning = learningSessions.filter((s) => s.date === dateStr);
      const dayInterview = interviewSessions.filter((s) => s.date === dateStr);
      const daySleep = sleepEntries.find((e) => e.date === dateStr);
      const dayWater = waterEntries.filter((e) => e.date === dateStr);
      const dayFood = foodEntries.filter((e) => e.date === dateStr);
      const dayExpenses = expenseEntries.filter((e) => e.date === dateStr);
      const dayDaily = dailyEntries.find((e) => e.date === dateStr);
      const dayHabitsCompleted = habitCompletions.filter((c) => c.date === dateStr).length;

      const hasActivity =
        dayFitness.length > 0 ||
        dayLearning.length > 0 ||
        dayInterview.length > 0 ||
        daySleep !== undefined ||
        dayWater.length > 0 ||
        dayFood.length > 0 ||
        dayExpenses.length > 0;

      dailyDataMap.set(dateStr, {
        hasActivity,
        fitness: {
          workoutDuration: dayFitness.reduce((s, e) => s + (e.workoutDuration || 0), 0),
          pushups: dayFitness.reduce((s, e) => s + e.pushups, 0),
        },
        learning: {
          duration: dayLearning.reduce((s, e) => s + (e.duration || 0), 0),
          sessions: dayLearning.length,
        },
        interview: {
          duration: dayInterview.reduce((s, e) => s + (e.duration || 0), 0),
          sessions: dayInterview.length,
        },
        sleep: {
          minutes: daySleep?.totalMinutes || 0,
          quality: daySleep?.quality,
        },
        hydration: {
          ml: dayWater.reduce((s, e) => s + e.amount, 0),
        },
        nutrition: {
          protein: dayFood.reduce((s, e) => s + (e.protein || 0), 0),
          calories: dayFood.reduce((s, e) => s + (e.calories || 0), 0),
        },
        expenses: {
          total: dayExpenses.reduce((s, e) => s + e.amount, 0),
          count: dayExpenses.length,
        },
        mood: dayDaily?.mood,
        score: dayDaily?.dailyScore,
        habitsCompleted: dayHabitsCompleted,
      });
    }

    // Calculate monthly totals and averages
    const daysWithData = dailyEntries.length || 1;
    const monthlySummary = {
      period: { start: monthStart, end: monthEnd },
      fitness: {
        totalWorkoutDuration: fitnessEntries.reduce((s, e) => s + (e.workoutDuration || 0), 0),
        totalPushups: fitnessEntries.reduce((s, e) => s + e.pushups, 0),
        activeDays: new Set(fitnessEntries.map((e) => e.date)).size,
        avgPerDay: Math.round(fitnessEntries.reduce((s, e) => s + (e.workoutDuration || 0), 0) / Math.max(daysWithData, 1)),
        monthlyGoal: (userData?.workoutGoal || 60) * lastDayOfMonth,
      },
      learning: {
        totalDuration: learningSessions.reduce((s, e) => s + (e.duration || 0), 0),
        sessionCount: learningSessions.length,
        activeDays: new Set(learningSessions.map((e) => e.date)).size,
        avgPerDay: Math.round(learningSessions.reduce((s, e) => s + (e.duration || 0), 0) / Math.max(daysWithData, 1)),
        monthlyGoal: (userData?.learningGoal || 180) * lastDayOfMonth,
      },
      interview: {
        totalDuration: interviewSessions.reduce((s, e) => s + (e.duration || 0), 0),
        sessionCount: interviewSessions.length,
        activeDays: new Set(interviewSessions.map((e) => e.date)).size,
        avgPerDay: Math.round(interviewSessions.reduce((s, e) => s + (e.duration || 0), 0) / Math.max(daysWithData, 1)),
        monthlyGoal: (userData?.interviewGoal || 180) * lastDayOfMonth,
      },
      sleep: {
        totalMinutes: sleepEntries.reduce((s, e) => s + (e.totalMinutes || 0), 0),
        avgMinutes: Math.round(sleepEntries.reduce((s, e) => s + (e.totalMinutes || 0), 0) / Math.max(sleepEntries.length, 1)),
        nightsLogged: sleepEntries.length,
        goalPerNight: userData?.sleepGoal || 480,
      },
      hydration: {
        totalMl: waterEntries.reduce((s, e) => s + e.amount, 0),
        avgMl: Math.round(waterEntries.reduce((s, e) => s + e.amount, 0) / Math.max(daysWithData, 1)),
        monthlyGoal: (userData?.waterGoal || 3000) * lastDayOfMonth,
      },
      nutrition: {
        totalProtein: foodEntries.reduce((s, e) => s + (e.protein || 0), 0),
        totalCalories: foodEntries.reduce((s, e) => s + (e.calories || 0), 0),
        avgProtein: Math.round(foodEntries.reduce((s, e) => s + (e.protein || 0), 0) / Math.max(daysWithData, 1)),
        monthlyGoal: (userData?.proteinGoal || 100) * lastDayOfMonth,
      },
      expenses: {
        total: expenseEntries.reduce((s, e) => s + e.amount, 0),
        count: expenseEntries.length,
        avgPerDay: expenseEntries.reduce((s, e) => s + e.amount, 0) / Math.max(daysWithData, 1),
        currency: userData?.currency || '₹',
        byCategory: expenseEntries.reduce((acc, e) => {
          acc[e.category] = (acc[e.category] || 0) + e.amount;
          return acc;
        }, {} as Record<string, number>),
      },
      habits: {
        totalCompletions: habitCompletions.length,
        uniqueDates: new Set(habitCompletions.map((c) => c.date)).size,
      },
      streaks: {
        currentStreak: calculateCurrentStreak(dailyDataMap, today, lastDayOfMonth),
      },
    };

    return NextResponse.json({
      success: true,
      data: {
        month: targetMonth,
        dailyData: Object.fromEntries(dailyDataMap),
        summary: monthlySummary,
      },
    });
  } catch (error) {
    console.error('Dashboard monthly error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateCurrentStreak(
  dailyDataMap: Map<string, object>,
  today: string,
  lastDayOfMonth: number
): number {
  let streak = 0;
  const currentDate = new Date(today + 'T00:00:00');
  
  // Check backwards from today
  for (let i = 0; i < lastDayOfMonth; i++) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const dayData = dailyDataMap.get(dateStr) as any;
    
    if (dayData && dayData.hasActivity) {
      streak++;
    } else if (i > 0) {
      // Don't count today if no activity yet
      break;
    }
    
    currentDate.setDate(currentDate.getDate() - 1);
  }
  
  return streak;
}
