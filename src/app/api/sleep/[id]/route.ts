import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, validateEnum, SLEEP_QUALITY, calculateSleepDuration } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    // Check ownership
    const existing = await db.sleepEntry.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Entry not found' },
        { status: 404 }
      );
    }

    // Validate
    const errors: string[] = [];
    const { sleepStart, sleepEnd, quality, notes } = body;

    if (quality !== undefined && validateEnum(quality, SLEEP_QUALITY, 'quality')) {
      errors.push(validateEnum(quality, SLEEP_QUALITY, 'quality')!);
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    // Auto-calculate duration if times changed
    let totalMinutes = existing.totalMinutes;
    if (sleepStart && sleepEnd) {
      totalMinutes = calculateSleepDuration(sleepStart, sleepEnd);
    } else if (sleepStart || sleepEnd) {
      totalMinutes = calculateSleepDuration(
        sleepStart || existing.sleepStart,
        sleepEnd || existing.sleepEnd
      );
    }

    // Update entry
    const entry = await db.sleepEntry.update({
      where: { id },
      data: {
        ...(sleepStart !== undefined && { sleepStart }),
        ...(sleepEnd !== undefined && { sleepEnd }),
        ...(totalMinutes !== undefined && { totalMinutes }),
        ...(quality !== undefined && { quality }),
        ...(notes !== undefined && { notes }),
      },
    });

    return NextResponse.json({ success: true, data: entry });
  } catch (error) {
    console.error('Sleep PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check ownership
    const existing = await db.sleepEntry.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Entry not found' },
        { status: 404 }
      );
    }

    // Delete entry
    await db.sleepEntry.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Sleep entry deleted successfully',
    });
  } catch (error) {
    console.error('Sleep DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
