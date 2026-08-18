import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, getTodayInTimezone, validateRequired } from '@/lib/auth';

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

    // Build where clause
    let whereClause: any = { userId: user.id };

    if (dateParam) {
      whereClause.date = dateParam;
    } else if (startDateParam && endDateParam) {
      whereClause.date = { gte: startDateParam, lte: endDateParam };
    } else if (startDateParam) {
      whereClause.date = { gte: startDateParam };
    } else {
      // Default to today
      whereClause.date = getTodayInTimezone();
    }

    // Fetch entries
    const entries = await db.waterEntry.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    // Calculate total
    const totalMl = entries.reduce((sum, entry) => sum + entry.amount, 0);
    const glassCount = Math.floor(totalMl / 250); // Standard glass ~250ml

    return NextResponse.json({
      success: true,
      data: {
        entries,
        totalMl,
        glassCount,
        count: entries.length,
        date: dateParam || getTodayInTimezone(),
      },
    });
  } catch (error) {
    console.error('Water GET error:', error);
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
    const { date, amount, notes } = body;

    // Validate required fields
    const errors: string[] = [];

    if (amount === undefined || amount === null || amount <= 0) {
      errors.push('Amount must be a positive number');
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    const targetDate = date || getTodayInTimezone();

    // Create water entry
    const entry = await db.waterEntry.create({
      data: {
        userId: user.id,
        date: targetDate,
        amount: Math.round(amount),
        notes: notes || null,
      },
    });

    // Get updated total for the day
    const allDayEntries = await db.waterEntry.findMany({
      where: { userId: user.id, date: targetDate },
    });
    
    const totalMl = allDayEntries.reduce((sum, e) => sum + e.amount, 0);

    return NextResponse.json(
      { 
        success: true, 
        data: {
          entry,
          dayTotal: {
            totalMl,
            glassCount: Math.floor(totalMl / 250),
          },
        }
      }, 
      { status: 201 }
    );
  } catch (error) {
    console.error('Water POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
