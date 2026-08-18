import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, validateRequired } from '@/lib/auth';

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
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const dateParam = searchParams.get('date'); // For completion status

    // Build where clause
    let whereClause: any = { userId: user.id };
    
    if (!includeInactive) {
      whereClause.isActive = true;
    }

    // Fetch habits
    const habits = await db.habit.findMany({
      where: whereClause,
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
    });

    // If date provided, fetch completion status
    let habitsWithCompletion = habits;
    if (dateParam) {
      const completions = await db.habitCompletion.findMany({
        where: {
          userId: user.id,
          date: dateParam,
        },
      });

      const completedHabitIds = new Set(completions.map((c) => c.habitId));

      habitsWithCompletion = habits.map((habit) => ({
        ...habit,
        completedToday: completedHabitIds.has(habit.id),
        completionId: completions.find((c) => c.habitId === habit.id)?.id || null,
      }));
    }

    // Calculate stats
    const activeCount = habits.filter((h) => h.isActive).length;
    const inactiveCount = habits.filter((h) => !h.isActive).length;

    return NextResponse.json({
      success: true,
      data: {
        habits: habitsWithCompletion,
        stats: {
          total: habits.length,
          active: activeCount,
          inactive: inactiveCount,
        },
      },
    });
  } catch (error) {
    console.error('Habits GET error:', error);
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
    const { name, description, icon, color, isActive } = body;

    // Validate required fields
    const errors: string[] = [];

    if (!name || name.trim() === '') {
      errors.push('Name is required');
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    // Create habit
    const habit = await db.habit.create({
      data: {
        userId: user.id,
        name: name.trim(),
        description: description || null,
        icon: icon || null,
        color: color || null,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json({ success: true, data: habit }, { status: 201 });
  } catch (error) {
    console.error('Habits POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
