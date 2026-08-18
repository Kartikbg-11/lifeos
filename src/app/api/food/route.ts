import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, getTodayInTimezone, validateRequired, validateEnum, MEAL_TYPES } from '@/lib/auth';

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
    const mealTypeParam = searchParams.get('mealType');
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

    if (mealTypeParam) {
      whereClause.mealType = mealTypeParam;
    }

    // Fetch entries
    const entries = await db.foodEntry.findMany({
      where: whereClause,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      take: limitParam ? parseInt(limitParam, 10) : undefined,
    });

    // Calculate totals
    const totals = entries.reduce(
      (acc, entry) => ({
        calories: acc.calories + (entry.calories || 0),
        protein: acc.protein + (entry.protein || 0),
        carbohydrates: acc.carbohydrates + (entry.carbohydrates || 0),
        fat: acc.fat + (entry.fat || 0),
      }),
      { calories: 0, protein: 0, carbohydrates: 0, fat: 0 }
    );

    // Group by meal type
    const byMealType = entries.reduce((acc, entry) => {
      if (!acc[entry.mealType]) {
        acc[entry.mealType] = { count: 0, calories: 0, protein: 0 };
      }
      acc[entry.mealType].count++;
      acc[entry.mealType].calories += entry.calories || 0;
      acc[entry.mealType].protein += entry.protein || 0;
      return acc;
    }, {} as Record<string, { count: number; calories: number; protein: number }>);

    return NextResponse.json({
      success: true,
      data: {
        entries,
        totals,
        byMealType,
        count: entries.length,
      },
    });
  } catch (error) {
    console.error('Food GET error:', error);
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
      mealType,
      foodName,
      quantity,
      calories,
      protein,
      carbohydrates,
      fat,
      notes,
    } = body;

    // Validate required fields
    const errors: string[] = [];

    if (!mealType) {
      errors.push('Meal type is required');
    } else if (validateEnum(mealType, MEAL_TYPES, 'mealType')) {
      errors.push(validateEnum(mealType, MEAL_TYPES, 'mealType')!);
    }

    if (!foodName || foodName.trim() === '') {
      errors.push('Food name is required');
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    const targetDate = date || getTodayInTimezone();

    // Create food entry
    const entry = await db.foodEntry.create({
      data: {
        userId: user.id,
        date: targetDate,
        mealType,
        foodName: foodName.trim(),
        quantity: quantity || null,
        calories: calories ?? null,
        protein: protein ?? null,
        carbohydrates: carbohydrates ?? null,
        fat: fat ?? null,
        notes: notes || null,
      },
    });

    return NextResponse.json({ success: true, data: entry }, { status: 201 });
  } catch (error) {
    console.error('Food POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
