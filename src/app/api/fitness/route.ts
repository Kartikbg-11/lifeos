import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, getTodayInTimezone, validateRequired, validateEnum, WORKOUT_TYPES } from '@/lib/auth';

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
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const limitParam = searchParams.get('limit');

    // Build where clause
    let whereClause: any = { userId: user.id };

    if (dateParam) {
      whereClause.date = dateParam;
    } else if (startDateParam && endDateParam) {
      whereClause.date = { gte: startDateParam, lte: endDateParam };
    } else if (startDateParam) {
      whereClause.date = { gte: startDateParam };
    }

    // Fetch entries
    const entries = await db.fitnessEntry.findMany({
      where: whereClause,
      orderBy: { date: 'desc' },
      take: limitParam ? parseInt(limitParam, 10) : undefined,
    });

    // Calculate totals
    const totals = entries.reduce(
      (acc, entry) => ({
        workoutDuration: acc.workoutDuration + (entry.workoutDuration || 0),
        pushups: acc.pushups + entry.pushups,
        squats: acc.squats + entry.squats,
        pullups: acc.pullups + entry.pullups,
        caloriesBurned: acc.caloriesBurned + (entry.caloriesBurned || 0),
        completedCount: acc.completedCount + (entry.completed ? 1 : 0),
      }),
      { workoutDuration: 0, pushups: 0, squats: 0, pullups: 0, caloriesBurned: 0, completedCount: 0 }
    );

    return NextResponse.json({
      success: true,
      data: {
        entries,
        totals,
        count: entries.length,
      },
    });
  } catch (error) {
    console.error('Fitness GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    const {
      date,
      workoutDuration,
      workoutType,
      pushups,
      squats,
      pullups,
      otherExercises,
      caloriesBurned,
      completed,
      notes,
    } = body;

    // Validate
    const targetDate = date || getTodayInTimezone();
    const errors: string[] = [];

    if (workoutType && validateEnum(workoutType, WORKOUT_TYPES, 'workoutType')) {
      errors.push(validateEnum(workoutType, WORKOUT_TYPES, 'workoutType')!);
    }

    if (workoutDuration !== undefined && workoutDuration < 0) {
      errors.push('workoutDuration must be non-negative');
    }

    if (pushups !== undefined && pushups < 0) {
      errors.push('pushups must be non-negative');
    }

    if (squats !== undefined && squats < 0) {
      errors.push('squats must be non-negative');
    }

    if (pullups !== undefined && pullups < 0) {
      errors.push('pullups must be non-negative');
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    // Create fitness entry
    const entry = await db.fitnessEntry.create({
      data: {
        userId: user.id,
        date: targetDate,
        workoutDuration: workoutDuration ?? null,
        workoutType: workoutType || null,
        pushups: pushups || 0,
        squats: squats || 0,
        pullups: pullups || 0,
        otherExercises: otherExercises || null,
        caloriesBurned: caloriesBurned ?? null,
        completed: completed || false,
        notes: notes || null,
      },
    });

    return NextResponse.json({ success: true, data: entry }, { status: 201 });
  } catch (error) {
    console.error('Fitness POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
