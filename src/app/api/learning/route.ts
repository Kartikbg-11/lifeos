import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, getTodayInTimezone, validateRequired, validateEnum, LEARNING_CATEGORIES, calculateDurationMinutes } from '@/lib/auth';

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
    const categoryParam = searchParams.get('category');
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

    if (categoryParam) {
      whereClause.category = categoryParam;
    }

    // Fetch sessions
    const sessions = await db.learningSession.findMany({
      where: whereClause,
      orderBy: { date: 'desc' },
      take: limitParam ? parseInt(limitParam, 10) : undefined,
    });

    // Calculate totals
    const totals = sessions.reduce(
      (acc, session) => ({
        totalDuration: acc.totalDuration + (session.duration || 0),
        completedCount: acc.completedCount + (session.completed ? 1 : 0),
      }),
      { totalDuration: 0, completedCount: 0 }
    );

    // Group by category
    const byCategory = sessions.reduce((acc, session) => {
      const cat = session.category || 'other';
      if (!acc[cat]) {
        acc[cat] = { count: 0, totalDuration: 0 };
      }
      acc[cat].count++;
      acc[cat].totalDuration += session.duration || 0;
      return acc;
    }, {} as Record<string, { count: number; totalDuration: number }>);

    return NextResponse.json({
      success: true,
      data: {
        sessions,
        totals,
        byCategory,
        count: sessions.length,
      },
    });
  } catch (error) {
    console.error('Learning GET error:', error);
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
      topic,
      category,
      startTime,
      endTime,
      whatLearned,
      notes,
      completed,
    } = body;

    // Validate required fields
    const errors: string[] = [];

    if (!topic || topic.trim() === '') {
      errors.push('Topic is required');
    }

    if (category && validateEnum(category, LEARNING_CATEGORIES, 'category')) {
      errors.push(validateEnum(category, LEARNING_CATEGORIES, 'category')!);
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    // Calculate duration if start and end times provided
    let duration: number | null | undefined = body.duration;
    if (startTime && endTime && !duration) {
      duration = calculateDurationMinutes(startTime, endTime);
    }

    const targetDate = date || getTodayInTimezone();

    // Create learning session
    const session = await db.learningSession.create({
      data: {
        userId: user.id,
        date: targetDate,
        topic: topic.trim(),
        category: category || null,
        startTime: startTime || null,
        endTime: endTime || null,
        duration: duration ?? null,
        whatLearned: whatLearned || null,
        notes: notes || null,
        completed: completed || false,
      },
    });

    return NextResponse.json({ success: true, data: session }, { status: 201 });
  } catch (error) {
    console.error('Learning POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
