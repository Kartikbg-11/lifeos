import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, getTodayInTimezone, validateRequired, validateEnum, GOAL_TYPES, GOAL_CATEGORIES } from '@/lib/auth';

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
    const typeParam = searchParams.get('type'); // daily, weekly, monthly
    const categoryParam = searchParams.get('category');
    const includeCompleted = searchParams.get('includeCompleted') !== 'false';
    const activeOnly = searchParams.get('activeOnly') === 'true';

    // Build where clause
    let whereClause: any = { userId: user.id };

    if (typeParam) {
      whereClause.type = typeParam;
    }

    if (categoryParam) {
      whereClause.category = categoryParam;
    }

    if (!includeCompleted) {
      whereClause.isCompleted = false;
    }

    if (activeOnly) {
      const today = getTodayInTimezone();
      whereClause.OR = [
        { endDate: null },
        { endDate: { gte: today } },
        { isCompleted: false },
      ];
    }

    // Fetch goals
    const goals = await db.goal.findMany({
      where: whereClause,
      orderBy: [
        { isCompleted: 'asc' },
        { startDate: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // Calculate stats
    const totalGoals = goals.length;
    const completedGoals = goals.filter((g) => g.isCompleted).length;
    const inProgressGoals = totalGoals - completedGoals;

    // Group by type
    const byType = goals.reduce((acc, goal) => {
      if (!acc[goal.type]) acc[goal.type] = { total: 0, completed: 0 };
      acc[goal.type].total++;
      if (goal.isCompleted) acc[goal.type].completed++;
      return acc;
    }, {} as Record<string, { total: number; completed: number }>);

    // Group by category
    const byCategory = goals.reduce((acc, goal) => {
      if (!acc[goal.category]) acc[goal.category] = { total: 0, completed: 0 };
      acc[goal.category].total++;
      if (goal.isCompleted) acc[goal.category].completed++;
      return acc;
    }, {} as Record<string, { total: number; completed: number }>);

    return NextResponse.json({
      success: true,
      data: {
        goals,
        stats: {
          total: totalGoals,
          completed: completedGoals,
          inProgress: inProgressGoals,
          completionRate: totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0,
          byType,
          byCategory,
        },
      },
    });
  } catch (error) {
    console.error('Goals GET error:', error);
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
      title,
      description,
      type,
      category,
      targetValue,
      unit,
      startDate,
      endDate,
      isCompleted,
    } = body;

    // Validate required fields
    const errors: string[] = [];

    if (!title || title.trim() === '') {
      errors.push('Title is required');
    }

    if (!type) {
      errors.push('Type is required');
    } else if (validateEnum(type, GOAL_TYPES, 'type')) {
      errors.push(validateEnum(type, GOAL_TYPES, 'type')!);
    }

    if (!category) {
      errors.push('Category is required');
    } else if (validateEnum(category, GOAL_CATEGORIES, 'category')) {
      errors.push(validateEnum(category, GOAL_CATEGORIES, 'category')!);
    }

    if (!startDate) {
      errors.push('Start date is required');
    }

    if (targetValue !== undefined && targetValue < 0) {
      errors.push('Target value must be non-negative');
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    // Create goal
    const goal = await db.goal.create({
      data: {
        userId: user.id,
        title: title.trim(),
        description: description || null,
        type,
        category,
        targetValue: targetValue ?? null,
        unit: unit || null,
        startDate,
        endDate: endDate || null,
        isCompleted: isCompleted || false,
      },
    });

    return NextResponse.json({ success: true, data: goal }, { status: 201 });
  } catch (error) {
    console.error('Goals POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
