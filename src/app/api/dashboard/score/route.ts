import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, getTodayInTimezone, calculateDailyScore } from '@/lib/auth';

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
    const dateParam = searchParams.get('date');
    const targetDate = dateParam || getTodayInTimezone();

    // Get user settings for goals
    const userData = await db.user.findUnique({
      where: { id: user.id },
      select: {
        workoutGoal: true,
        learningGoal: true,
        interviewGoal: true,
        sleepGoal: true,
        waterGoal: true,
        proteinGoal: true,
      },
    });

    if (!userData) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Fetch all data for the target date
    const [
      fitnessEntries,
      learningSessions,
      interviewSessions,
      sleepEntry,
      waterEntries,
      foodEntries,
      expenseEntries,
    ] = await Promise.all([
      db.fitnessEntry.findMany({
        where: { userId: user.id, date: targetDate },
      }),
      db.learningSession.findMany({
        where: { userId: user.id, date: targetDate },
      }),
      db.interviewSession.findMany({
        where: { userId: user.id, date: targetDate },
      }),
      db.sleepEntry.findFirst({
        where: { userId: user.id, date: targetDate },
        orderBy: { createdAt: 'desc' },
      }),
      db.waterEntry.findMany({
        where: { userId: user.id, date: targetDate },
      }),
      db.foodEntry.findMany({
        where: { userId: user.id, date: targetDate },
      }),
      db.expenseEntry.findMany({
        where: { userId: user.id, date: targetDate },
      }),
    ]);

    // Calculate values for score
    const workoutDuration = fitnessEntries.reduce((s, e) => s + (e.workoutDuration || 0), 0);
    const learningDuration = learningSessions.reduce((s, e) => s + (e.duration || 0), 0);
    const interviewDuration = interviewSessions.reduce((s, e) => s + (e.duration || 0), 0);
    const sleepMinutes = sleepEntry?.totalMinutes || 0;
    const waterMl = waterEntries.reduce((s, e) => s + e.amount, 0);
    const proteinGrams = foodEntries.reduce((s, e) => s + (e.protein || 0), 0);
    const expenseAmount = expenseEntries.reduce((s, e) => s + e.amount, 0);

    // Default budget of ₹1000 per day (can be made configurable)
    const dailyBudget = 1000;

    // Calculate score
    const scoreResult = calculateDailyScore(
      {
        workoutDuration,
        workoutGoal: userData.workoutGoal,
        learningDuration,
        learningGoal: userData.learningGoal,
        interviewDuration,
        interviewGoal: userData.interviewGoal,
        sleepMinutes,
        sleepGoal: userData.sleepGoal,
        waterMl,
        waterGoal: userData.waterGoal,
        proteinGrams,
        proteinGoal: userData.proteinGoal,
        expenseAmount,
        expenseBudget: dailyBudget,
      }
    );

    // Update or create daily entry with score
    await db.dailyEntry.upsert({
      where: {
        userId_date: {
          userId: user.id,
          date: targetDate,
        },
      },
      update: {
        dailyScore: scoreResult.totalScore,
      },
      create: {
        userId: user.id,
        date: targetDate,
        dailyScore: scoreResult.totalScore,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...scoreResult,
        rawValues: {
          workoutDuration,
          learningDuration,
          interviewDuration,
          sleepMinutes,
          waterMl,
          proteinGrams,
          expenseAmount,
        },
        goals: {
          workout: userData.workoutGoal,
          learning: userData.learningGoal,
          interview: userData.interviewGoal,
          sleep: userData.sleepGoal,
          water: userData.waterGoal,
          protein: userData.proteinGoal,
          budget: dailyBudget,
        },
      },
    });
  } catch (error) {
    console.error('Dashboard score error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
