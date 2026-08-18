'use client';

import { create } from 'zustand';

// Types for dashboard data
export interface FitnessData {
  entries: any[];
  totals: {
    workoutDuration: number;
    pushups: number;
    squats: number;
    pullups: number;
  };
  goal: number;
  pushupGoal: number;
  completed: boolean;
}

export interface LearningData {
  sessions: any[];
  totalDuration: number;
  goal: number;
  completed: boolean;
}

export interface InterviewData {
  sessions: any[];
  totalDuration: number;
  goal: number;
  completed: boolean;
}

export interface SleepData {
  entry: any | null;
  totalMinutes: number;
  goal: number;
  quality?: string;
}

export interface NutritionData {
  foodEntries: any[];
  totals: {
    protein: number;
    calories: number;
  };
  proteinGoal: number;
}

export interface HydrationData {
  entries: any[];
  totalMl: number;
  goal: number;
  completed: boolean;
}

export interface ExpenseData {
  entries: any[];
  total: number;
  currency: string;
}

export interface HabitData {
  items: any[];
  completedCount: number;
  totalCount: number;
  allCompleted: boolean;
}

export interface DashboardData {
  date: string;
  fitness: FitnessData;
  learning: LearningData;
  interview: InterviewData;
  sleep: SleepData;
  nutrition: NutritionData;
  hydration: HydrationData;
  expenses: ExpenseData;
  habits: HabitData;
  dailyEntry: any | null;
  journal: any | null;
  goals: any[];
}

interface DashboardState {
  data: DashboardData | null;
  isLoading: boolean;
  error: string | null;
  lastFetched: string | null;
  setData: (data: DashboardData) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearData: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  data: null,
  isLoading: false,
  error: null,
  lastFetched: null,

  setData: (data) =>
    set({
      data,
      error: null,
      lastFetched: new Date().toISOString(),
    }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error, isLoading: false }),

  clearData: () =>
    set({
      data: null,
      error: null,
      lastFetched: null,
    }),
}));
