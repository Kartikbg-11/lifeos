import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

// ==================== CONSTANTS ====================

const COOKIE_NAME = 'lifeos-user-id';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

// ==================== PASSWORD UTILITIES ====================

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// ==================== TOKEN GENERATION ====================

export function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

// ==================== COOKIE HELPERS ====================

export async function setAuthCookie(userId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
}

export async function getAuthUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const userId = cookieStore.get(COOKIE_NAME)?.value;
  
  if (!userId) {
    return null;
  }
  
  // Verify user exists in database
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  
  return user?.id ?? null;
}

export async function removeAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// ==================== AUTH MIDDLEWARE ====================

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
}

export async function authenticateRequest(request?: NextRequest): Promise<AuthUser | null> {
  const userId = await getAuthUserId();
  
  if (!userId) {
    return null;
  }
  
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });
  
  return user;
}

// ==================== DATE UTILITIES ====================

export function getTodayInTimezone(timezone = 'Asia/Kolkata'): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(now); // Returns YYYY-MM-DD
}

export function getDateRangeInTimezone(
  startDate: string,
  endDate: string,
  timezone = 'Asia/Kolkata'
): { start: string; end: string } {
  // Ensure dates are in YYYY-MM-DD format
  return { start: startDate, end: endDate };
}

export function isValidDateFormat(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  
  const date = new Date(dateString + 'T00:00:00');
  return !isNaN(date.getTime());
}

// ==================== VALIDATION HELPERS ====================

export function validateRequired(value: unknown, fieldName: string): string | null {
  if (value === undefined || value === null || value === '') {
    return `${fieldName} is required`;
  }
  return null;
}

export function validatePositiveNumber(value: number, fieldName: string): string | null {
  if (typeof value !== 'number' || isNaN(value)) {
    return `${fieldName} must be a number`;
  }
  if (value < 0) {
    return `${fieldName} must be positive`;
  }
  return null;
}

export function validateEnum<T extends string>(
  value: string,
  allowedValues: readonly T[],
  fieldName: string
): string | null {
  if (!allowedValues.includes(value as T)) {
    return `${fieldName} must be one of: ${allowedValues.join(', ')}`;
  }
  return null;
}

// ==================== VALID ENUMS ====================

export const WORKOUT_TYPES = ['cardio', 'strength', 'hiit', 'yoga', 'sports', 'other'] as const;
export type WorkoutType = typeof WORKOUT_TYPES[number];

export const LEARNING_CATEGORIES = ['api-testing', 'python', 'ai-testing', 'sql', 'automation', 'other'] as const;
export type LearningCategory = typeof LEARNING_CATEGORIES[number];

export const INTERVIEW_CATEGORIES = [
  'manual-testing', 'automation', 'api-testing', 'sql', 'java', 'python',
  'ai-testing', 'llm-testing', 'rag-testing', 'selenium', 'testng', 'postman',
  'performance', 'security', 'hr', 'behavioral', 'coding', 'aptitude', 'other'
] as const;
export type InterviewCategory = typeof INTERVIEW_CATEGORIES[number];

export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack', 'pre-workout', 'post-workout'] as const;
export type MealType = typeof MEAL_TYPES[number];

export const EXPENSE_CATEGORIES = [
  'food', 'travel', 'shopping', 'gym', 'education', 'entertainment', 'bills', 'health', 'other'
] as const;
export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];

export const PAYMENT_METHODS = ['cash', 'upi', 'card', 'bank-transfer', 'other'] as const;
export type PaymentMethod = typeof PAYMENT_METHODS[number];

export const SLEEP_QUALITY = ['excellent', 'good', 'fair', 'poor'] as const;
export type SleepQuality = typeof SLEEP_QUALITY[number];

export const MOOD_TYPES = ['excellent', 'good', 'average', 'poor'] as const;
export type MoodType = typeof MOOD_TYPES[number];

export const GOAL_TYPES = ['daily', 'weekly', 'monthly'] as const;
export type GoalType = typeof GOAL_TYPES[number];

export const GOAL_CATEGORIES = [
  'fitness', 'learning', 'interview', 'sleep', 'water', 'protein', 'expense', 'other'
] as const;
export type GoalCategory = typeof GOAL_CATEGORIES[number];

export const REMINDER_TYPES = ['gym', 'learning', 'interview', 'water', 'sleep', 'custom'] as const;
export type ReminderType = typeof REMINDER_TYPES[number];

// ==================== DURATION CALCULATIONS ====================

export function calculateDurationMinutes(startTime: string, endTime: string): number {
  const start = new Date(startTime);
  let end = new Date(endTime);
  
  // Handle midnight crossing - if end is before start, assume next day
  if (end <= start) {
    end.setDate(end.getDate() + 1);
  }
  
  const diffMs = end.getTime() - start.getTime();
  return Math.round(diffMs / (1000 * 60));
}

export function calculateSleepDuration(sleepStart: string, sleepEnd: string): number {
  return calculateDurationMinutes(sleepStart, sleepEnd);
}

// ==================== DAILY SCORE CALCULATION ====================

interface ScoreWeights {
  fitness: number;
  learning: number;
  interview: number;
  sleep: number;
  water: number;
  protein: number;
  expenses: number;
}

const DEFAULT_WEIGHTS: ScoreWeights = {
  fitness: 20,
  learning: 15,
  interview: 20,
  sleep: 15,
  water: 10,
  protein: 10,
  expenses: 10,
};

export interface DailyScoreBreakdown {
  category: string;
  achieved: number;
  goal: number;
  percentage: number;
  weightedScore: number;
  weight: number;
}

export interface DailyScoreResult {
  totalScore: number;
  breakdown: DailyScoreBreakdown[];
  date: string;
}

export function calculateDailyScore(
  data: {
    workoutDuration?: number;
    workoutGoal: number;
    learningDuration?: number;
    learningGoal: number;
    interviewDuration?: number;
    interviewGoal: number;
    sleepMinutes?: number;
    sleepGoal: number;
    waterMl?: number;
    waterGoal: number;
    proteinGrams?: number;
    proteinGoal: number;
    expenseAmount?: number;
    expenseBudget?: number;
  },
  weights: ScoreWeights = DEFAULT_WEIGHTS
): DailyScoreResult {
  const breakdown: DailyScoreBreakdown[] = [];
  
  // Fitness score
  const fitnessPercentage = Math.min(100, (data.workoutDuration || 0) / data.workoutGoal * 100);
  breakdown.push({
    category: 'fitness',
    achieved: data.workoutDuration || 0,
    goal: data.workoutGoal,
    percentage: Math.round(fitnessPercentage),
    weightedScore: Math.round(fitnessPercentage * weights.fitness / 100),
    weight: weights.fitness,
  });
  
  // Learning score
  const learningPercentage = Math.min(100, (data.learningDuration || 0) / data.learningGoal * 100);
  breakdown.push({
    category: 'learning',
    achieved: data.learningDuration || 0,
    goal: data.learningGoal,
    percentage: Math.round(learningPercentage),
    weightedScore: Math.round(learningPercentage * weights.learning / 100),
    weight: weights.learning,
  });
  
  // Interview score
  const interviewPercentage = Math.min(100, (data.interviewDuration || 0) / data.interviewGoal * 100);
  breakdown.push({
    category: 'interview',
    achieved: data.interviewDuration || 0,
    goal: data.interviewGoal,
    percentage: Math.round(interviewPercentage),
    weightedScore: Math.round(interviewPercentage * weights.interview / 100),
    weight: weights.interview,
  });
  
  // Sleep score
  const sleepPercentage = Math.min(100, (data.sleepMinutes || 0) / data.sleepGoal * 100);
  breakdown.push({
    category: 'sleep',
    achieved: data.sleepMinutes || 0,
    goal: data.sleepGoal,
    percentage: Math.round(sleepPercentage),
    weightedScore: Math.round(sleepPercentage * weights.sleep / 100),
    weight: weights.sleep,
  });
  
  // Water score
  const waterPercentage = Math.min(100, (data.waterMl || 0) / data.waterGoal * 100);
  breakdown.push({
    category: 'water',
    achieved: data.waterMl || 0,
    goal: data.waterGoal,
    percentage: Math.round(waterPercentage),
    weightedScore: Math.round(waterPercentage * weights.water / 100),
    weight: weights.water,
  });
  
  // Protein score
  const proteinPercentage = Math.min(100, (data.proteinGrams || 0) / data.proteinGoal * 100);
  breakdown.push({
    category: 'protein',
    achieved: data.proteinGrams || 0,
    goal: data.proteinGoal,
    percentage: Math.round(proteinPercentage),
    weightedScore: Math.round(proteinPercentage * weights.protein / 100),
    weight: weights.protein,
  });
  
  // Expense score (discipline - under budget is good)
  let expensePercentage = 100;
  if (data.expenseBudget && data.expenseBudget > 0) {
    expensePercentage = Math.max(0, Math.min(100, 100 - ((data.expenseAmount || 0) / data.expenseBudget) * 100));
  }
  breakdown.push({
    category: 'expenses',
    achieved: data.expenseAmount || 0,
    goal: data.expenseBudget || 0,
    percentage: Math.round(expensePercentage),
    weightedScore: Math.round(expensePercentage * weights.expenses / 100),
    weight: weights.expenses,
  });
  
  const totalScore = breakdown.reduce((sum, item) => sum + item.weightedScore, 0);
  
  return {
    totalScore: Math.min(100, Math.max(0, totalScore)),
    breakdown,
    date: getTodayInTimezone(),
  };
}
