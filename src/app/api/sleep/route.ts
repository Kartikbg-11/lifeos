import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, getTodayInTimezone, validateRequired, validateEnum, SLEEP_QUALITY, calculateSleepDuration } from '@/lib/auth';

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
    const entries = await db.sleepEntry.findMany({
      where: whereClause,
      orderBy: { date: 'desc' },
      take: limitParam ? parseInt(limitParam, 10) : undefined,
    });

    // Calculate averages
    const totalMinutes = entries.reduce((sum, e) => sum + (e.totalMinutes || 0), 0);
    const avgMinutes = entries.length > 0 ? Math.round(totalMinutes / entries.length) : 0;

    // Group by quality
    const byQuality = entries.reduce((acc, entry) => {
      const quality = entry.quality || 'unknown';
      acc[quality] = (acc[quality] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      data: {
        entries,
        stats: {
          totalEntries: entries.length,
          totalMinutes,
          avgMinutes,
          avgHours: parseFloat((avgMinutes / 60).toFixed(1)),
          byQuality,
        },
      },
    });
  } catch (error) {
    console.error('Sleep GET error:', error);
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
      sleepStart,
      sleepEnd,
      quality,
      notes,
    } = body;

    // Validate required fields
    const errors: string[] = [];

    if (!sleepStart) {
      errors.push('Sleep start time is required');
    }

    if (!sleepEnd) {
      errors.push('Sleep end time is required');
    }

    if (quality && validateEnum(quality, SLEEP_QUALITY, 'quality')) {
      errors.push(validateEnum(quality, SLEEP_QUALITY, 'quality')!);
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    // Auto-calculate duration
    const totalMinutes = calculateSleepDuration(sleepStart, sleepEnd);

    // Determine the date for this sleep entry (use provided or today)
    const targetDate = date || getTodayInTimezone();

    // Create sleep entry
    const entry = await db.sleepEntry.create({
      data: {
        userId: user.id,
        date: targetDate,
        sleepStart,
        sleepEnd,
        totalMinutes,
        quality: quality || null,
        notes: notes || null,
      },
    });

    return NextResponse.json({ success: true, data: entry }, { status: 201 });
  } catch (error) {
    console.error('Sleep POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
