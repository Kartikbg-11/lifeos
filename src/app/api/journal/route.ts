import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, getTodayInTimezone } from '@/lib/auth';

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
    const limitParam = searchParams.get('limit');

    // Build where clause
    let whereClause: any = { userId: user.id };

    if (startDateParam && endDateParam) {
      whereClause.date = { gte: startDateParam, lte: endDateParam };
    } else if (startDateParam) {
      whereClause.date = { gte: startDateParam };
    }

    // Fetch journal entries
    const entries = await db.journalEntry.findMany({
      where: whereClause,
      orderBy: { date: 'desc' },
      take: limitParam ? parseInt(limitParam, 10) : undefined,
    });

    // Calculate stats
    const totalEntries = entries.length;
    const entriesWithAccomplishments = entries.filter((e) => e.accomplishments).length;
    const entriesWithLearnings = entries.filter((e) => e.whatLearned).length;

    return NextResponse.json({
      success: true,
      data: {
        entries,
        stats: {
          totalEntries,
          entriesWithAccomplishments,
          entriesWithLearnings,
        },
      },
    });
  } catch (error) {
    console.error('Journal GET error:', error);
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
      accomplishments,
      whatLearned,
      wentWell,
      wentWrong,
      improvementTomorrow,
      generalNotes,
    } = body;

    const targetDate = date || getTodayInTimezone();

    // Upsert journal entry (create or update)
    const entry = await db.journalEntry.upsert({
      where: {
        userId_date: {
          userId: user.id,
          date: targetDate,
        },
      },
      update: {
        ...(accomplishments !== undefined && { accomplishments }),
        ...(whatLearned !== undefined && { whatLearned }),
        ...(wentWell !== undefined && { wentWell }),
        ...(wentWrong !== undefined && { wentWrong }),
        ...(improvementTomorrow !== undefined && { improvementTomorrow }),
        ...(generalNotes !== undefined && { generalNotes }),
      },
      create: {
        userId: user.id,
        date: targetDate,
        accomplishments: accomplishments || null,
        whatLearned: whatLearned || null,
        wentWell: wentWell || null,
        wentWrong: wentWrong || null,
        improvementTomorrow: improvementTomorrow || null,
        generalNotes: generalNotes || null,
      },
    });

    return NextResponse.json({ 
      success: true, 
      data: entry,
      message: entry.createdAt === entry.updatedAt && !entry.accomplishments && !entry.whatLearned
        ? 'Journal entry created'
        : 'Journal entry updated',
    });
  } catch (error) {
    console.error('Journal POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
