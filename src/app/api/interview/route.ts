import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, getTodayInTimezone, validateRequired, validateEnum, INTERVIEW_CATEGORIES, calculateDurationMinutes } from '@/lib/auth';

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
    const sessions = await db.interviewSession.findMany({
      where: whereClause,
      orderBy: { date: 'desc' },
      take: limitParam ? parseInt(limitParam, 10) : undefined,
    });

    // Calculate totals
    const totals = sessions.reduce(
      (acc, session) => ({
        totalDuration: acc.totalDuration + (session.duration || 0),
        questionsPracticed: acc.questionsPracticed + session.questionsPracticed,
        questionsAnswered: acc.questionsAnswered + session.questionsAnswered,
        correctAnswers: acc.correctAnswers + session.correctAnswers,
        incorrectAnswers: acc.incorrectAnswers + session.incorrectAnswers,
        mockInterviews: acc.mockInterviews + (session.mockInterview ? 1 : 0),
        codingPractices: acc.codingPractices + (session.codingPractice ? 1 : 0),
      }),
      {
        totalDuration: 0,
        questionsPracticed: 0,
        questionsAnswered: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        mockInterviews: 0,
        codingPractices: 0,
      }
    );

    // Calculate accuracy
    const accuracy = totals.questionsAnswered > 0 
      ? Math.round((totals.correctAnswers / totals.questionsAnswered) * 100) 
      : 0;

    // Group by category
    const byCategory = sessions.reduce((acc, session) => {
      const cat = session.category || 'other';
      if (!acc[cat]) {
        acc[cat] = { count: 0, totalDuration: 0, questionsPracticed: 0 };
      }
      acc[cat].count++;
      acc[cat].totalDuration += session.duration || 0;
      acc[cat].questionsPracticed += session.questionsPracticed;
      return acc;
    }, {} as Record<string, { count: number; totalDuration: number; questionsPracticed: number }>);

    return NextResponse.json({
      success: true,
      data: {
        sessions,
        totals: { ...totals, accuracy },
        byCategory,
        count: sessions.length,
      },
    });
  } catch (error) {
    console.error('Interview GET error:', error);
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

    // Validate required fields
    const errors: string[] = [];

    if (!topic || topic.trim() === '') {
      errors.push('Topic is required');
    }

    if (category && validateEnum(category, INTERVIEW_CATEGORIES, 'category')) {
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

    // Calculate duration if start and end times provided
    let duration: number | null | undefined = body.duration;
    if (startTime && endTime && !duration) {
      duration = calculateDurationMinutes(startTime, endTime);
    }

    const targetDate = date || getTodayInTimezone();

    // Create interview session
    const session = await db.interviewSession.create({
      data: {
        userId: user.id,
        date: targetDate,
        topic: topic.trim(),
        category: category || null,
        startTime: startTime || null,
        endTime: endTime || null,
        duration: duration ?? null,
        questionsPracticed: questionsPracticed || 0,
        questionsAnswered: questionsAnswered || 0,
        correctAnswers: correctAnswers || 0,
        incorrectAnswers: incorrectAnswers || 0,
        mockInterview: mockInterview || false,
        codingPractice: codingPractice || false,
        notes: notes || null,
        confidenceLevel: confidenceLevel ?? null,
        difficulty: difficulty || null,
      },
    });

    return NextResponse.json({ success: true, data: session }, { status: 201 });
  } catch (error) {
    console.error('Interview POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
