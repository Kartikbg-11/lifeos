'use client';

// API Response types
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string[];
}

interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class ApiError extends Error {
  status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  // Handle no content response
  if (response.status === 204) {
    return undefined as T;
  }
  
  const data = await response.json().catch(() => {
    throw new ApiError('Invalid server response', response.status);
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      // Clear auth state and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('lifeos-auth');
        // Don't redirect here, let the auth provider handle it
      }
      throw new ApiError(data.error || 'Session expired. Please log in again.', 401);
    }
    
    throw new ApiError(
      data.error || data.message || `Request failed with status ${response.status}`,
      response.status
    );
  }
  
  // Handle both { success: true, data: ... } and direct data responses
  if (data && typeof data === 'object' && 'success' in data) {
    if (!data.success) {
      throw new ApiError(data.error || 'Request failed', 400);
    }
    return data.data !== undefined ? data.data : data;
  }
  
  return data as T;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `/api${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    return await handleResponse<T>(response);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Network error. Please check your connection.', 0);
  }
}

// ==================== AUTH API ====================

export const authApi = {
  login: async (email: string, password: string) => {
    return apiRequest<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  register: async (name: string, email: string, password: string) => {
    return apiRequest<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  },

  logout: async () => {
    return apiRequest<void>('/auth/logout', { method: 'POST' });
  },

  getMe: async () => {
    return apiRequest<any>('/auth/me');
  },
};

// ==================== DASHBOARD API ====================

export const dashboardApi = {
  getToday: async () => {
    return apiRequest<any>('/dashboard/today');
  },

  getScore: async (date?: string) => {
    const query = date ? `?date=${date}` : '';
    return apiRequest<any>(`/dashboard/score${query}`);
  },

  getWeekly: async () => {
    return apiRequest<any>('/dashboard/weekly');
  },

  getMonthly: async () => {
    return apiRequest<any>('/dashboard/monthly');
  },
};

// ==================== FITNESS API ====================

export interface FitnessInput {
  date?: string;
  workoutDuration?: number;
  workoutType?: string;
  pushups?: number;
  squats?: number;
  pullups?: number;
  otherExercises?: string;
  caloriesBurned?: number;
  completed?: boolean;
  notes?: string;
}

export const fitnessApi = {
  getAll: async (params?: { startDate?: string; endDate?: string }) => {
    const query = params
      ? `?${new URLSearchParams(params as any).toString()}`
      : '';
    return apiRequest<any[]>(`/fitness${query}`);
  },

  getById: async (id: string) => {
    return apiRequest<any>(`/fitness/${id}`);
  },

  create: async (data: FitnessInput) => {
    return apiRequest<any>('/fitness', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: Partial<FitnessInput>) => {
    return apiRequest<any>(`/fitness/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return apiRequest<void>(`/fitness/${id}`, { method: 'DELETE' });
  },
};

// ==================== LEARNING API ====================

export interface LearningInput {
  date?: string;
  topic: string;
  category?: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  whatLearned?: string;
  notes?: string;
  completed?: boolean;
}

export const learningApi = {
  getAll: async (params?: { startDate?: string; endDate?: string }) => {
    const query = params
      ? `?${new URLSearchParams(params as any).toString()}`
      : '';
    return apiRequest<any[]>(`/learning${query}`);
  },

  create: async (data: LearningInput) => {
    return apiRequest<any>('/learning', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: Partial<LearningInput>) => {
    return apiRequest<any>(`/learning/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return apiRequest<void>(`/learning/${id}`, { method: 'DELETE' });
  },
};

// ==================== INTERVIEW API ====================

export interface InterviewInput {
  date?: string;
  topic: string;
  category?: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  questionsPracticed?: number;
  questionsAnswered?: number;
  correctAnswers?: number;
  incorrectAnswers?: number;
  mockInterview?: boolean;
  codingPractice?: boolean;
  notes?: string;
  confidenceLevel?: number;
  difficulty?: string;
}

export const interviewApi = {
  getAll: async (params?: { startDate?: string; endDate?: string }) => {
    const query = params
      ? `?${new URLSearchParams(params as any).toString()}`
      : '';
    return apiRequest<any[]>(`/interview${query}`);
  },

  create: async (data: InterviewInput) => {
    return apiRequest<any>('/interview', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: Partial<InterviewInput>) => {
    return apiRequest<any>(`/interview/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return apiRequest<void>(`/interview/${id}`, { method: 'DELETE' });
  },
};

// ==================== SLEEP API ====================

export interface SleepInput {
  date?: string;
  sleepStart: string;
  sleepEnd: string;
  quality?: string;
  notes?: string;
}

export const sleepApi = {
  getAll: async (params?: { startDate?: string; endDate?: string }) => {
    const query = params
      ? `?${new URLSearchParams(params as any).toString()}`
      : '';
    return apiRequest<any[]>(`/sleep${query}`);
  },

  create: async (data: SleepInput) => {
    return apiRequest<any>('/sleep', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: Partial<SleepInput>) => {
    return apiRequest<any>(`/sleep/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return apiRequest<void>(`/sleep/${id}`, { method: 'DELETE' });
  },
};

// ==================== FOOD API ====================

export interface FoodInput {
  date?: string;
  mealType: string;
  foodName: string;
  quantity?: string;
  calories?: number;
  protein?: number;
  carbohydrates?: number;
  fat?: number;
  notes?: string;
}

export const foodApi = {
  getAll: async (params?: { startDate?: string; endDate?: string }) => {
    const query = params
      ? `?${new URLSearchParams(params as any).toString()}`
      : '';
    return apiRequest<any[]>(`/food${query}`);
  },

  create: async (data: FoodInput) => {
    return apiRequest<any>('/food', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: Partial<FoodInput>) => {
    return apiRequest<any>(`/food/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return apiRequest<void>(`/food/${id}`, { method: 'DELETE' });
  },
};

// ==================== WATER API ====================

export interface WaterInput {
  date?: string;
  amount: number;
  notes?: string;
}

export const waterApi = {
  getAll: async (params?: { startDate?: string; endDate?: string }) => {
    const query = params
      ? `?${new URLSearchParams(params as any).toString()}`
      : '';
    return apiRequest<any[]>(`/water${query}`);
  },

  create: async (data: WaterInput) => {
    return apiRequest<any>('/water', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return apiRequest<void>(`/water/${id}`, { method: 'DELETE' });
  },
};

// ==================== EXPENSES API ====================

export interface ExpenseInput {
  date?: string;
  amount: number;
  category: string;
  reason?: string;
  paymentMethod?: string;
  notes?: string;
}

export const expensesApi = {
  getAll: async (params?: { startDate?: string; endDate?: string; category?: string }) => {
    const query = params
      ? `?${new URLSearchParams(params as any).toString()}`
      : '';
    return apiRequest<any[]>(`/expenses${query}`);
  },

  getSummary: async (params?: { month?: string; year?: string }) => {
    const query = params
      ? `?${new URLSearchParams(params as any).toString()}`
      : '';
    return apiRequest<any>(`/expenses/summary${query}`);
  },

  create: async (data: ExpenseInput) => {
    return apiRequest<any>('/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: Partial<ExpenseInput>) => {
    return apiRequest<any>(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return apiRequest<void>(`/expenses/${id}`, { method: 'DELETE' });
  },
};

// ==================== HABITS API ====================

export interface HabitInput {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}

export const habitsApi = {
  getAll: async () => {
    return apiRequest<any[]>('/habits');
  },

  create: async (data: HabitInput) => {
    return apiRequest<any>('/habits', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: Partial<HabitInput & { isActive?: boolean }>) => {
    return apiRequest<any>(`/habits/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return apiRequest<void>(`/habits/${id}`, { method: 'DELETE' });
  },

  toggleComplete: async (habitId: string, date: string, completed: boolean) => {
    return apiRequest<any>('/habits/complete', {
      method: 'POST',
      body: JSON.stringify({ habitId, date, completed }),
    });
  },
};

// ==================== GOALS API ====================

export interface GoalInput {
  title: string;
  description?: string;
  type: string;
  category: string;
  targetValue?: number;
  unit?: string;
  startDate: string;
  endDate?: string;
}

export const goalsApi = {
  getAll: async () => {
    return apiRequest<any[]>('/goals');
  },

  create: async (data: GoalInput) => {
    return apiRequest<any>('/goals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: Partial<GoalInput & { isCompleted?: boolean }>) => {
    return apiRequest<any>(`/goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return apiRequest<void>(`/goals/${id}`, { method: 'DELETE' });
  },
};

// ==================== JOURNAL API ====================

export interface JournalInput {
  date?: string;
  accomplishments?: string;
  whatLearned?: string;
  wentWell?: string;
  wentWrong?: string;
  improvementTomorrow?: string;
  generalNotes?: string;
}

export const journalApi = {
  getByDate: async (date: string) => {
    return apiRequest<any>(`/journal/${date}`);
  },

  getAll: async (params?: { startDate?: string; endDate?: string }) => {
    const query = params
      ? `?${new URLSearchParams(params as any).toString()}`
      : '';
    return apiRequest<any[]>(`/journal${query}`);
  },

  save: async (data: JournalInput) => {
    return apiRequest<any>('/journal', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (date: string, data: Partial<JournalInput>) => {
    return apiRequest<any>(`/journal/${date}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

// ==================== SETTINGS API ====================

export interface SettingsInput {
  name?: string;
  workoutGoal?: number;
  pushupGoal?: number;
  learningGoal?: number;
  interviewGoal?: number;
  sleepGoal?: number;
  waterGoal?: number;
  proteinGoal?: number;
  currency?: string;
  timezone?: string;
}

export const settingsApi = {
  get: async () => {
    return apiRequest<any>('/settings');
  },

  update: async (data: SettingsInput) => {
    return apiRequest<any>('/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

// ==================== EXPORT API ====================

export const exportApi = {
  exportData: async (format: string = 'json') => {
    const response = await fetch(`/api/export?format=${format}`);
    if (!response.ok) {
      throw new Error('Failed to export data');
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lifeos-export-${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },
};

// Export all APIs
const api = {
  auth: authApi,
  dashboard: dashboardApi,
  fitness: fitnessApi,
  learning: learningApi,
  interview: interviewApi,
  sleep: sleepApi,
  food: foodApi,
  water: waterApi,
  expenses: expensesApi,
  habits: habitsApi,
  goals: goalsApi,
  journal: journalApi,
  settings: settingsApi,
  export: exportApi,
};

export default api;
