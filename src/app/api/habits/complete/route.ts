import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, getTodayInTimezone, validateRequired } from '@/lib/auth';

// POST /api/habits/complete - Toggle or set habit completion for a specific date
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { habitId, date, completed } = body;

    // Validate required fields
    const errors: string[] = [];

    if (!habitId) {
      errors.push('Habit ID is required');
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    // Check habit exists and belongs to user
    const habit = await db.habit.findFirst({
      where: { id: habitId, userId: user.id },
    });

    if (!habit) {
      return NextResponse.json(
        { success: false, error: 'Habit not found' },
        { status: 404 }
      );
    }

    const targetDate = date || getTodayInTimezone();

    // Check if completion already exists
    const existingCompletion = await db.habitCompletion.findUnique({
      where: {
        habitId_userId_date: {
          habitId,
          userId: user.id,
          date: targetDate,
        },
      },
    });

    let result;

    if (existingCompletion) {
      // If completed parameter provided, use it; otherwise toggle
      const newCompleted = completed !== undefined ? completed : !existingCompletion.completed;

      if (newCompleted) {
        // Reactivate the completion
        result = await db.habitCompletion.update({
          where: { id: existingCompletion.id },
          data: { completed: true },
        });
      } else {
        // Delete the completion (uncomplete)
        await db.habitCompletion.delete({
          where: { id: existingCompletion.id },
        });
        result = { ...existingCompletion, completed: false };
      }
    } else {
      // Create new completion (only if we want to complete)
      if (completed === false) {
        // Trying to uncomplete a habit that wasn't completed - just return current state
        return NextResponse.json({
          success: true,
          data: {
            habitId,
            date: targetDate,
            completed: false,
            action: 'no_change',
          },
        });
      }

      result = await db.habitCompletion.create({
        data: {
          habitId,
          userId: user.id,
          date: targetDate,
          completed: true,
        },
      });
    }

    // Get updated stats for the day
    const dayCompletions = await db.habitCompletion.findMany({
      where: {
        userId: user.id,
        date: targetDate,
        completed: true,
      },
    });

    const totalActiveHabits = await db.habit.count({
      where: { userId: user.id, isActive: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        completion: result,
        habitId,
        date: targetDate,
        completed: result.completed ?? true,
        dayStats: {
          completed: dayCompletions.length,
          total: totalActiveHabits,
          percentage: totalActiveHabits > 0 
            ? Math.round((dayCompletions.length / totalActiveHabits) * 100) 
            : 0,
        },
      },
    });
  } catch (error) {
    console.error('Habits complete POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/habits/complete - Get completions for a date range
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
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const habitIdParam = searchParams.get('habitId');

    if (!startDateParam || !endDateParam) {
      return NextResponse.json(
        { success: false, error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    // Build where clause
    let whereClause: any = {
      userId: user.id,
      date: { gte: startDateParam, lte: endDateParam },
    };

    if (habitIdParam) {
      whereClause.habitId = habitIdParam;
    }

    // Fetch completions
    const completions = await db.habitCompletion.findMany({
      where: whereClause,
      orderBy: { date: 'asc' },
    });

    // Group by date
    const byDate = completions.reduce((acc, completion) => {
      if (!acc[completion.date]) {
        acc[completion.date] = [];
      }
      acc[completion.date].push(completion);
      return acc;
    }, {} as Record<string, typeof completions>);

    // Calculate streaks if habitId provided
    let streakInfo;
    if (habitIdParam) {
      streakInfo = await calculateHabitStreak(user.id, habitIdParam, startDateParam);
    }

    return NextResponse.json({
      success: true,
      data: {
        completions,
        byDate,
        totalCount: completions.length,
        ...(streakInfo && { streakInfo }),
      },
    });
  } catch (error) {
    console.error('Habits complete GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function calculateHabitStreak(userId: string, habitId: string, fromDate: string) {
  // Get all completions for this habit up to today
  const today = getTodayInTimezone();
  
  const completions = await db.habitCompletion.findMany({
    where: {
      userId,
      habitId,
      date: { lte: today },
      completed: true,
    },
    orderBy: { date: 'desc' },
  });

  if (completions.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Calculate current streak (consecutive days including today)
  let currentStreak = 0;
  const checkDate = new Date(today + 'T00:00:00');
  
  const completionDates = new Set(completions.map((c) => c.date));
  
  // Check backwards from today
  for (let i = 0; i < 365; i++) {
    const dateStr = checkDate.toISOString().split('T')[0];
    if (completionDates.has(dateStr)) {
      currentStreak++;
    } else if (i > 0) {
      break; // Allow missing today but not gaps in between
    }
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 0;
  const sortedDates = [...completionDates].sort();

  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const prev = new Date(sortedDates[i - 1] + 'T00:00:00');
      const curr = new Date(sortedDates[i] + 'T00:00:00');
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  return { currentStreak, longestStreak };
}
