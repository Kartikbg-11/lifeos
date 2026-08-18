import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, setAuthCookie, validateRequired } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate required fields
    const errors: string[] = [];
    
    const emailError = validateRequired(email, 'Email');
    if (emailError) errors.push(emailError);
    
    const passwordError = validateRequired(password, 'Password');
    if (passwordError) errors.push(passwordError);

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Set auth cookie
    await setAuthCookie(user.id);

    // Return user data (excluding password)
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
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
