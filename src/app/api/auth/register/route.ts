import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, setAuthCookie, validateRequired } from '@/lib/auth';
import { verifyOrigin } from '@/lib/admin/server';

export async function POST(request: NextRequest) {
  try {
    verifyOrigin(request);
    const settings = await db.adminSettings.findUnique({ where: { id: 'app' } });
    if (settings && !settings.registrationEnabled) return NextResponse.json({ success: false, error: 'Registration is currently closed.' }, { status: 403 });
    const body = await request.json();
    const { email, name, password } = body;
    if (typeof email !== 'string' || email.length > 254 || typeof password !== 'string' || password.length > 256 || (name !== undefined && (typeof name !== 'string' || name.length > 100))) return NextResponse.json({ success: false, error: 'Enter valid account details.' }, { status: 400 });

    // Validate required fields
    const errors: string[] = [];
    
    const emailError = validateRequired(email, 'Email');
    if (emailError) errors.push(emailError);
    
    const passwordError = validateRequired(password, 'Password');
    if (passwordError) errors.push(passwordError);

    // Validate email format
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('Invalid email format');
    }

    // Validate password length
    if (password && password.length < (settings?.passwordMinLength || 8)) {
      errors.push(`Password must be at least ${settings?.passwordMinLength || 8} characters`);
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await db.user.create({
      data: {
        email: email.trim().toLowerCase(),
        name: name || null,
        passwordHash,
        timezone: settings?.timezone || 'Asia/Kolkata',
      },
    });

    // Set auth cookie
    await db.activityEvent.create({ data: { userId: user.id, action: 'registered', feature: 'account' } });
    await setAuthCookie(user.id);

    // Return user data (excluding password)
    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
