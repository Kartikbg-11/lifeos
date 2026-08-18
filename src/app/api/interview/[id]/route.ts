import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, validateEnum, INTERVIEW_CATEGORIES, calculateDurationMinutes } from '@/lib/auth';

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
    const existing = await db.interviewSession.findFirst({
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
    const {
      topic,
      category,
      startTime,
      endTime,
      duration,
      questionsPracticed,
      questionsAnswered,
      correctAnswers,
      incorrectAnswers,
      mockInterview,
      codingPractice,
      notes,
      confidenceLevel,
      difficulty,
    } = body;

    if (category !== undefined && validateEnum(category, INTERVIEW_CATEGORIES, 'category')) {
      errors.push(validateEnum(category, INTERVIEW_CATEGORIES, 'category')!);
    }

    if (confidenceLevel !== undefined && (confidenceLevel < 1 || confidenceLevel > 5)) {
      errors.push('Confidence level must be between 1 and 5');
    }

    if (difficulty !== undefined && !['easy', 'medium', 'hard'].includes(difficulty)) {
      errors.push('Difficulty must be easy, medium, or hard');
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
    const session = await db.interviewSession.update({
      where: { id },
      data: {
        ...(topic !== undefined && { topic }),
        ...(category !== undefined && { category }),
        ...(startTime !== undefined && { startTime }),
        ...(endTime !== undefined && { endTime }),
        ...(finalDuration !== undefined && { duration: finalDuration }),
        ...(questionsPracticed !== undefined && { questionsPracticed }),
        ...(questionsAnswered !== undefined && { questionsAnswered }),
        ...(correctAnswers !== undefined && { correctAnswers }),
        ...(incorrectAnswers !== undefined && { incorrectAnswers }),
        ...(mockInterview !== undefined && { mockInterview }),
        ...(codingPractice !== undefined && { codingPractice }),
        ...(notes !== undefined && { notes }),
        ...(confidenceLevel !== undefined && { confidenceLevel }),
        ...(difficulty !== undefined && { difficulty }),
      },
    });

    return NextResponse.json({ success: true, data: session });
  } catch (error) {
    console.error('Interview PUT error:', error);
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
    const existing = await db.interviewSession.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    // Delete session
    await db.interviewSession.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Interview session deleted successfully',
    });
  } catch (error) {
    console.error('Interview DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
