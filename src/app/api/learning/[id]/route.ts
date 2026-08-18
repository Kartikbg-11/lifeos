import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, validateEnum, LEARNING_CATEGORIES, calculateDurationMinutes } from '@/lib/auth';

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
    const existing = await db.learningSession.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    // Validate
    const errors: string[] = [];
    const { topic, category, startTime, endTime, duration, whatLearned, notes, completed } = body;

    if (category !== undefined && validateEnum(category, LEARNING_CATEGORIES, 'category')) {
      errors.push(validateEnum(category, LEARNING_CATEGORIES, 'category')!);
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    // Auto-calculate duration if times provided but no explicit duration
    let finalDuration = duration;
    if ((startTime || existing.startTime) && (endTime || existing.endTime) && duration === undefined) {
      finalDuration = calculateDurationMinutes(
        startTime || existing.startTime!,
        endTime || existing.endTime!
      );
    }

    // Update session
    const session = await db.learningSession.update({
      where: { id },
      data: {
        ...(topic !== undefined && { topic }),
        ...(category !== undefined && { category }),
        ...(startTime !== undefined && { startTime }),
        ...(endTime !== undefined && { endTime }),
        ...(finalDuration !== undefined && { duration: finalDuration }),
        ...(whatLearned !== undefined && { whatLearned }),
        ...(notes !== undefined && { notes }),
        ...(completed !== undefined && { completed }),
      },
    });

    return NextResponse.json({ success: true, data: session });
  } catch (error) {
    console.error('Learning PUT error:', error);
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
    const existing = await db.learningSession.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    // Delete session
    await db.learningSession.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Learning session deleted successfully',
    });
  } catch (error) {
    console.error('Learning DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
