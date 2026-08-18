import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, getTodayInTimezone } from '@/lib/auth';

export async function GET() {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const today = getTodayInTimezone();

    // Get user settings for goals
    const userData = await db.user.findUnique({
      where: { id: user.id },
      select: {
        workoutGoal: true,
        pushupGoal: true,
        learningGoal: true,
        interviewGoal: true,
        sleepGoal: true,
        waterGoal: true,
        proteinGoal: true,
        currency: true,
      },
    });

    // Fetch all today's data in parallel
    const [
      fitnessEntries,
      learningSessions,
      interviewSessions,
      sleepEntry,
      foodEntries,
      waterEntries,
      expenseEntries,
      habits,
      habitCompletions,
      dailyEntry,
      journalEntry,
      activeGoals,
    ] = await Promise.all([
      // Fitness entries
      db.fitnessEntry.findMany({
        where: { userId: user.id, date: today },
      }),
      
      // Learning sessions
      db.learningSession.findMany({
        where: { userId: user.id, date: today },
      }),
      
      // Interview sessions
      db.interviewSession.findMany({
        where: { userId: user.id, date: today },
      }),
      
      // Sleep entry (latest)
      db.sleepEntry.findFirst({
        where: { userId: user.id, date: today },
        orderBy: { createdAt: 'desc' },
      }),
      
      // Food entries
      db.foodEntry.findMany({
        where: { userId: user.id, date: today },
      }),
      
      // Water entries
      db.waterEntry.findMany({
        where: { userId: user.id, date: today },
      }),
      
      // Expense entries
      db.expenseEntry.findMany({
        where: { userId: user.id, date: today },
      }),
      
      // Active habits
      db.habit.findMany({
        where: { userId: user.id, isActive: true },
        orderBy: { createdAt: 'asc' },
      }),
      
      // Today's habit completions
      db.habitCompletion.findMany({
        where: { userId: user.id, date: today },
      }),
      
      // Daily entry (mood, notes)
      db.dailyEntry.findUnique({
        where: { userId_date: { userId: user.id, date: today } },
      }),
      
      // Journal entry
      db.journalEntry.findUnique({
        where: { userId_date: { userId: user.id, date: today } },
      }),
      
      // Active goals
      db.goal.findMany({
        where: {
          userId: user.id,
          isCompleted: false,
          OR: [
            { endDate: null },
            { endDate: { gte: today } },
          ],
        },
        orderBy: { startDate: 'desc' },
      }),
    ]);

    // Calculate aggregates
    const totalWorkoutDuration = fitnessEntries.reduce(
      (sum, entry) => sum + (entry.workoutDuration || 0),
      0
    );
    const totalPushups = fitnessEntries.reduce(
      (sum, entry) => sum + entry.pushups,
      0
    );
    const totalSquats = fitnessEntries.reduce(
      (sum, entry) => sum + entry.squats,
      0
    );
    const totalPullups = fitnessEntries.reduce(
      (sum, entry) => sum + entry.pullups,
      0
    );

    const totalLearningDuration = learningSessions.reduce(
      (sum, session) => sum + (session.duration || 0),
      0
    );
    const totalInterviewDuration = interviewSessions.reduce(
      (sum, session) => sum + (session.duration || 0),
      0
    );

    const totalSleepMinutes = sleepEntry?.totalMinutes || 0;
    const totalWaterMl = waterEntries.reduce(
      (sum, entry) => sum + entry.amount,
      0
    );
    const totalProtein = foodEntries.reduce(
      (sum, entry) => sum + (entry.protein || 0),
      0
    );
    const totalCalories = foodEntries.reduce(
      (sum, entry) => sum + (entry.calories || 0),
      0
    );
    const totalExpenses = expenseEntries.reduce(
      (sum, entry) => sum + entry.amount,
      0
    );

    // Process habits with completion status
    const completedHabitIds = new Set(habitCompletions.map((c) => c.habitId));
    const habitsWithStatus = habits.map((habit) => ({
      ...habit,
      completedToday: completedHabitIds.has(habit.id),
    }));

    return NextResponse.json({
      success: true,
      data: {
        date: today,
        fitness: {
          entries: fitnessEntries,
          totals: {
            workoutDuration: totalWorkoutDuration,
            pushups: totalPushups,
            squats: totalSquats,
            pullups: totalPullups,
          },
          goal: userData?.workoutGoal || 60,
          pushupGoal: userData?.pushupGoal || 60,
          completed: totalWorkoutDuration >= (userData?.workoutGoal || 60),
        },
        learning: {
          sessions: learningSessions,
          totalDuration: totalLearningDuration,
          goal: userData?.learningGoal || 180,
          completed: totalLearningDuration >= (userData?.learningGoal || 180),
        },
        interview: {
          sessions: interviewSessions,
          totalDuration: totalInterviewDuration,
          goal: userData?.interviewGoal || 180,
          completed: totalInterviewDuration >= (userData?.interviewGoal || 180),
        },
        sleep: {
          entry: sleepEntry,
          totalMinutes: totalSleepMinutes,
          goal: userData?.sleepGoal || 480,
          quality: sleepEntry?.quality,
        },
        nutrition: {
          foodEntries,
          totals: {
            protein: totalProtein,
            calories: totalCalories,
          },
          proteinGoal: userData?.proteinGoal || 100,
        },
        hydration: {
          entries: waterEntries,
          totalMl: totalWaterMl,
          goal: userData?.waterGoal || 3000,
          completed: totalWaterMl >= (userData?.waterGoal || 3000),
        },
        expenses: {
          entries: expenseEntries,
          total: totalExpenses,
          currency: userData?.currency || '₹',
        },
        habits: {
          items: habitsWithStatus,
          completedCount: completedHabitIds.size,
          totalCount: habits.length,
          allCompleted: habits.length > 0 && completedHabitIds.size === habits.length,
        },
        dailyEntry,
        journal: journalEntry,
        goals: activeGoals,
      },
    });
  } catch (error) {
    console.error('Dashboard today error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
