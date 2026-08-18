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
    
    // Calculate week start (Monday) and end (Sunday)
    const currentDate = new Date(today + 'T00:00:00');
    const dayOfWeek = currentDate.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() + mondayOffset);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const formatDate = (d: Date) => d.toISOString().split('T')[0];
    const weekStartStr = formatDate(weekStart);
    const weekEndStr = formatDate(weekEnd);

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

    // Fetch weekly data
    const [
      fitnessEntries,
      learningSessions,
      interviewSessions,
      sleepEntries,
      waterEntries,
      foodEntries,
      expenseEntries,
      dailyEntries,
    ] = await Promise.all([
      db.fitnessEntry.findMany({
        where: {
          userId: user.id,
          date: { gte: weekStartStr, lte: weekEndStr },
        },
        orderBy: { date: 'asc' },
      }),
      db.learningSession.findMany({
        where: {
          userId: user.id,
          date: { gte: weekStartStr, lte: weekEndStr },
        },
        orderBy: { date: 'asc' },
      }),
      db.interviewSession.findMany({
        where: {
          userId: user.id,
          date: { gte: weekStartStr, lte: weekEndStr },
        },
        orderBy: { date: 'asc' },
      }),
      db.sleepEntry.findMany({
        where: {
          userId: user.id,
          date: { gte: weekStartStr, lte: weekEndStr },
        },
        orderBy: { date: 'asc' },
      }),
      db.waterEntry.findMany({
        where: {
          userId: user.id,
          date: { gte: weekStartStr, lte: weekEndStr },
        },
        orderBy: { date: 'asc' },
      }),
      db.foodEntry.findMany({
        where: {
          userId: user.id,
          date: { gte: weekStartStr, lte: weekEndStr },
        },
        orderBy: { date: 'asc' },
      }),
      db.expenseEntry.findMany({
        where: {
          userId: user.id,
          date: { gte: weekStartStr, lte: weekEndStr },
        },
        orderBy: { date: 'asc' },
      }),
      db.dailyEntry.findMany({
        where: {
          userId: user.id,
          date: { gte: weekStartStr, lte: weekEndStr },
        },
      }),
    ]);

    // Group data by date and calculate daily summaries
    const dailySummaries = [];
    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dateStr = formatDate(date);
      const dayName = daysOfWeek[i];

      const dayFitness = fitnessEntries.filter((e) => e.date === dateStr);
      const dayLearning = learningSessions.filter((s) => s.date === dateStr);
      const dayInterview = interviewSessions.filter((s) => s.date === dateStr);
      const daySleep = sleepEntries.find((e) => e.date === dateStr);
      const dayWater = waterEntries.filter((e) => e.date === dateStr);
      const dayFood = foodEntries.filter((e) => e.date === dateStr);
      const dayExpenses = expenseEntries.filter((e) => e.date === dateStr);
      const dayDaily = dailyEntries.find((e) => e.date === dateStr);

      dailySummaries.push({
        date: dateStr,
        dayName,
        fitness: {
          workoutDuration: dayFitness.reduce((s, e) => s + (e.workoutDuration || 0), 0),
          pushups: dayFitness.reduce((s, e) => s + e.pushups, 0),
        },
        learning: {
          duration: dayLearning.reduce((s, e) => s + (e.duration || 0), 0),
          sessionCount: dayLearning.length,
        },
        interview: {
          duration: dayInterview.reduce((s, e) => s + (e.duration || 0), 0),
          sessionCount: dayInterview.length,
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
      });
    }

    // Calculate weekly totals
    const weeklyTotals = {
      fitness: {
        totalWorkoutDuration: fitnessEntries.reduce((s, e) => s + (e.workoutDuration || 0), 0),
        totalPushups: fitnessEntries.reduce((s, e) => s + e.pushups, 0),
        avgPerDay: Math.round(fitnessEntries.reduce((s, e) => s + (e.workoutDuration || 0), 0) / 7),
        goalPerDay: userData?.workoutGoal || 60,
        weeklyGoal: (userData?.workoutGoal || 60) * 7,
      },
      learning: {
        totalDuration: learningSessions.reduce((s, e) => s + (e.duration || 0), 0),
        sessionCount: learningSessions.length,
        avgPerDay: Math.round(learningSessions.reduce((s, e) => s + (e.duration || 0), 0) / 7),
        goalPerDay: userData?.learningGoal || 180,
        weeklyGoal: (userData?.learningGoal || 180) * 7,
      },
      interview: {
        totalDuration: interviewSessions.reduce((s, e) => s + (e.duration || 0), 0),
        sessionCount: interviewSessions.length,
        avgPerDay: Math.round(interviewSessions.reduce((s, e) => s + (e.duration || 0), 0) / 7),
        goalPerDay: userData?.interviewGoal || 180,
        weeklyGoal: (userData?.interviewGoal || 180) * 7,
      },
      sleep: {
        totalMinutes: sleepEntries.reduce((s, e) => s + (e.totalMinutes || 0), 0),
        avgMinutes: Math.round(sleepEntries.reduce((s, e) => s + (e.totalMinutes || 0), 0) / Math.max(sleepEntries.length, 1)),
        nightsLogged: sleepEntries.length,
        goalPerNight: userData?.sleepGoal || 480,
      },
      hydration: {
        totalMl: waterEntries.reduce((s, e) => s + e.amount, 0),
        avgMl: Math.round(waterEntries.reduce((s, e) => s + e.amount, 0) / 7),
        goalPerDay: userData?.waterGoal || 3000,
      },
      nutrition: {
        totalProtein: foodEntries.reduce((s, e) => s + (e.protein || 0), 0),
        totalCalories: foodEntries.reduce((s, e) => s + (e.calories || 0), 0),
        avgProtein: Math.round(foodEntries.reduce((s, e) => s + (e.protein || 0), 0) / 7),
        goalPerDay: userData?.proteinGoal || 100,
      },
      expenses: {
        total: expenseEntries.reduce((s, e) => s + e.amount, 0),
        count: expenseEntries.length,
        currency: userData?.currency || '₹',
      },
    };

    return NextResponse.json({
      success: true,
      data: {
        weekStart: weekStartStr,
        weekEnd: weekEndStr,
        dailySummaries,
        weeklyTotals,
      },
    });
  } catch (error) {
    console.error('Dashboard weekly error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
