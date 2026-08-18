import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth';

export async function GET() {
  try {
    const userId = await getAuthUserId();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get full user data including settings
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        workoutGoal: true,
        pushupGoal: true,
        learningGoal: true,
        interviewGoal: true,
        sleepGoal: true,
        waterGoal: true,
        proteinGoal: true,
        currency: true,
        timezone: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        settings: {
          workoutGoal: user.workoutGoal,
          pushupGoal: user.pushupGoal,
          learningGoal: user.learningGoal,
          interviewGoal: user.interviewGoal,
          sleepGoal: user.sleepGoal,
          waterGoal: user.waterGoal,
          proteinGoal: user.proteinGoal,
          currency: user.currency,
          timezone: user.timezone,
        },
      },
    });
  } catch (error) {
    console.error('Get me error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
