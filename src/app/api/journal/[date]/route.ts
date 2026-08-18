import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, isValidDateFormat } from '@/lib/auth';

// GET /api/journal/[date] - Get specific date's journal entry
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { date } = await params;

    // Validate date format
    if (!isValidDateFormat(date)) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Fetch journal entry for the specific date
    const entry = await db.journalEntry.findUnique({
      where: {
        userId_date: {
          userId: user.id,
          date,
        },
      },
    });

    if (!entry) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No journal entry found for this date',
      });
    }

    return NextResponse.json({
      success: true,
      data: entry,
    });
  } catch (error) {
    console.error('Journal [date] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/journal/[date] - Update or create specific date's journal entry
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { date } = await params;

    // Validate date format
    if (!isValidDateFormat(date)) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      accomplishments,
      whatLearned,
      wentWell,
      wentWrong,
      improvementTomorrow,
      generalNotes,
    } = body;

    // Upsert journal entry
    const entry = await db.journalEntry.upsert({
      where: {
        userId_date: {
          userId: user.id,
          date,
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
        date,
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
    });
  } catch (error) {
    console.error('Journal [date] PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/journal/[date] - Delete specific date's journal entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { date } = await params;

    // Validate date format
    if (!isValidDateFormat(date)) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Check if entry exists
    const existing = await db.journalEntry.findUnique({
      where: {
        userId_date: {
          userId: user.id,
          date,
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Journal entry not found for this date' },
        { status: 404 }
      );
    }

    // Delete entry
    await db.journalEntry.delete({
      where: {
        userId_date: {
          userId: user.id,
          date,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Journal entry deleted successfully',
    });
  } catch (error) {
    console.error('Journal [date] DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
