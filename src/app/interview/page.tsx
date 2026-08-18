'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { ProgressRing } from '@/components/shared/progress-ring';
import { EmptyState } from '@/components/shared/empty-state';
import { ListSkeleton } from '@/components/shared/loading-skeleton';
import api from '@/services/api';
import { useAuthStore } from '@/store/use-auth-store';
import {
  GraduationCap,
  Plus,
  Trash2,
  Edit2,
  Clock,
  TrendingUp,
  Calendar,
  Target,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { toast } from 'sonner';

const INTERVIEW_CATEGORIES = [
  { value: 'manual-testing', label: 'Manual Testing' },
  { value: 'automation', label: 'Automation' },
  { value: 'api-testing', label: 'API Testing' },
  { value: 'sql', label: 'SQL' },
  { value: 'java', label: 'Java' },
  { value: 'python', label: 'Python' },
  { value: 'ai-testing', label: 'AI Testing' },
  { value: 'llm-testing', label: 'LLM Testing' },
  { value: 'selenium', label: 'Selenium' },
  { value: 'testng', label: 'TestNG' },
  { value: 'postman', label: 'Postman' },
  { value: 'performance', label: 'Performance' },
  { value: 'security', label: 'Security' },
  { value: 'hr', label: 'HR Questions' },
  { value: 'behavioral', label: 'Behavioral' },
  { value: 'coding', label: 'Coding' },
  { value: 'aptitude', label: 'Aptitude' },
  { value: 'other', label: 'Other' },
];

interface InterviewSession {
  id: string;
  date: string;
  topic: string;
  category?: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  questionsPracticed: number;
  questionsAnswered: number;
  correctAnswers: number;
  incorrectAnswers: number;
  mockInterview: boolean;
  codingPractice: boolean;
  notes?: string;
  confidenceLevel?: number;
  difficulty?: string;
  createdAt: string;
}

export default function InterviewPage() {
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<InterviewSession | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    topic: '',
    category: '',
    startTime: '',
    endTime: '',
    duration: '',
    questionsPracticed: '',
    questionsAnswered: '',
    correctAnswers: '',
    incorrectAnswers: '',
    mockInterview: false,
    codingPractice: false,
    confidenceLevel: '',
    difficulty: '',
    notes: '',
  });

  const goal = user?.settings?.interviewGoal || 180; // minutes (3 hours)

  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      const response = await api.interview.getAll();
      // Handle both array and object responses
      setSessions(Array.isArray(response) ? response : (response?.sessions || response?.entries || []));
    } catch (error) {
      toast.error('Failed to load interview sessions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // Calculate today's total
  const today = format(new Date(), 'yyyy-MM-dd');
  const todaySessions = sessions.filter((s) => s.date === today);
  const todayTotalMins = todaySessions.reduce((sum, s) => sum + (s.duration || 0), 0);

  // Calculate overall accuracy
  const totalCorrect = sessions.reduce((sum, s) => sum + s.correctAnswers, 0);
  const totalAnswered = sessions.reduce((sum, s) => sum + s.questionsAnswered, 0);
  const overallAccuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  // Auto-calculate duration
  useEffect(() => {
    if (formData.startTime && formData.endTime) {
      const start = new Date(formData.startTime);
      let end = new Date(formData.endTime);
      
      if (end <= start) {
        end.setDate(end.getDate() + 1);
      }
      
      const diffMs = end.getTime() - start.getTime();
      const diffMins = Math.round(diffMs / (1000 * 60));
      setFormData(prev => ({ ...prev, duration: diffMins.toString() }));
    }
  }, [formData.startTime, formData.endTime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.topic.trim()) {
      toast.error('Please enter a topic');
      return;
    }

    try {
      const payload = {
        topic: formData.topic.trim(),
        category: formData.category || undefined,
        startTime: formData.startTime || undefined,
        endTime: formData.endTime || undefined,
        duration: formData.duration ? parseInt(formData.duration) : undefined,
        questionsPracticed: formData.questionsPracticed ? parseInt(formData.questionsPracticed) : 0,
        questionsAnswered: formData.questionsAnswered ? parseInt(formData.questionsAnswered) : 0,
        correctAnswers: formData.correctAnswers ? parseInt(formData.correctAnswers) : 0,
        incorrectAnswers: formData.incorrectAnswers ? parseInt(formData.incorrectAnswers) : 0,
        mockInterview: formData.mockInterview,
        codingPractice: formData.codingPractice,
        confidenceLevel: formData.confidenceLevel ? parseInt(formData.confidenceLevel) : undefined,
        difficulty: formData.difficulty || undefined,
        notes: formData.notes || undefined,
      };

      if (editingSession) {
        await api.interview.update(editingSession.id, payload);
        toast.success('Session updated! 🎯');
      } else {
        await api.interview.create(payload);
        toast.success('Session added! 🎯');
      }

      resetForm();
      setDialogOpen(false);
      fetchSessions();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save session');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      await api.interview.delete(deleteId);
      toast.error('Session deleted');
      setDeleteId(null);
      fetchSessions();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete');
    }
  };

  const resetForm = () => {
    setFormData({
      topic: '',
      category: '',
      startTime: '',
      endTime: '',
      duration: '',
      questionsPracticed: '',
      questionsAnswered: '',
      correctAnswers: '',
      incorrectAnswers: '',
      mockInterview: false,
      codingPractice: false,
      confidenceLevel: '',
      difficulty: '',
      notes: '',
    });
    setEditingSession(null);
  };

  const openEditDialog = (session: InterviewSession) => {
    setEditingSession(session);
    setFormData({
      topic: session.topic,
      category: session.category || '',
      startTime: session.startTime ? format(new Date(session.startTime), "yyyy-MM-dd'T'HH:mm") : '',
      endTime: session.endTime ? format(new Date(session.endTime), "yyyy-MM-dd'T'HH:mm") : '',
      duration: session.duration?.toString() || '',
      questionsPracticed: session.questionsPracticed.toString(),
      questionsAnswered: session.questionsAnswered.toString(),
      correctAnswers: session.correctAnswers.toString(),
      incorrectAnswers: session.incorrectAnswers.toString(),
      mockInterview: session.mockInterview,
      codingPractice: session.codingPractice,
      confidenceLevel: session.confidenceLevel?.toString() || '',
      difficulty: session.difficulty || '',
      notes: session.notes || '',
    });
    setDialogOpen(true);
  };

  // Weekly data
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = format(date, 'yyyy-MM-dd');
    const daySessions = sessions.filter((s) => s.date === dateStr);
    return {
      date: format(date, 'EEE'),
      hours: Math.round((daySessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 60) * 10) / 10,
      accuracy: daySessions.length > 0 
        ? Math.round(
            daySessions.reduce((sum, s) => {
              if (s.questionsAnswered > 0) return sum + (s.correctAnswers / s.questionsAnswered) * 100;
              return sum;
            }, 0) / daySessions.length
          )
        : 0,
    };
  });

  // Readiness score based on categories practiced
  const categoryCount = [...new Set(sessions.map(s => s.category))].length;
  const readinessScore = Math.min(100, Math.round((categoryCount / INTERVIEW_CATEGORIES.length) * 50 + overallAccuracy * 0.5));

  if (isLoading) {
    return <ListSkeleton rows={5} />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-purple-500" />
            Interview Prep Tracker
          </h1>
          <p className="text-gray-500 mt-1">Track your interview preparation progress</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 rounded-xl">
              <Plus className="w-4 h-4 mr-2" />
              Add Session
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingSession ? 'Edit Session' : 'Add Interview Session'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label>Topic *</Label>
                  <Input
                    placeholder="e.g., Selenium WebDriver"
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(v) => setFormData({ ...formData, category: v })}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {INTERVIEW_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Duration (mins)</Label>
                  <Input
                    type="number"
                    placeholder="Auto-calculated"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Questions Practiced</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.questionsPracticed}
                    onChange={(e) => setFormData({ ...formData, questionsPracticed: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Correct</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.correctAnswers}
                    onChange={(e) => setFormData({ ...formData, correctAnswers: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Incorrect</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.incorrectAnswers}
                    onChange={(e) => setFormData({ ...formData, incorrectAnswers: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Confidence (1-5)</Label>
                  <Select
                    value={formData.confidenceLevel}
                    onValueChange={(v) => setFormData({ ...formData, confidenceLevel: v })}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <SelectItem key={n} value={n.toString()}>
                          {n} - {n <= 2 ? 'Low' : n <= 3 ? 'Medium' : 'High'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Difficulty</Label>
                  <Select
                    value={formData.difficulty}
                    onValueChange={(v) => setFormData({ ...formData, difficulty: v })}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.mockInterview}
                    onChange={(e) => setFormData({ ...formData, mockInterview: e.target.checked })}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">Mock Interview</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.codingPractice}
                    onChange={(e) => setFormData({ ...formData, codingPractice: e.target.checked })}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">Coding Practice</span>
                </label>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Additional notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                />
              </div>

              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-xl">
                {editingSession ? 'Update Session' : 'Save Session'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <ProgressRing
                progress={Math.min(100, (todayTotalMins / goal) * 100)}
                size={70}
                strokeWidth={7}
                color="#8b5cf6"
              >
                <span className="text-base font-bold">{Math.round(todayTotalMins / 60)}h</span>
              </ProgressRing>
              <div>
                <p className="text-sm text-gray-500">Today&apos;s Prep</p>
                <p className="font-semibold text-gray-900">Goal: {Math.round(goal / 60)}h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm bg-white">
          <CardContent className="p-5 flex flex-col items-center justify-center">
            <Target className="w-8 h-8 text-blue-500 mb-2" />
            <p className="text-3xl font-bold text-gray-900">{readinessScore}%</p>
            <p className="text-xs text-gray-500">Readiness Score</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm bg-white">
          <CardContent className="p-5 flex flex-col items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
            <p className="text-3xl font-bold text-gray-900">{overallAccuracy}%</p>
            <p className="text-xs text-gray-500">Overall Accuracy</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm bg-white">
          <CardContent className="p-5 flex flex-col items-center justify-center">
            <Calendar className="w-8 h-8 text-orange-500 mb-2" />
            <p className="text-3xl font-bold text-gray-900">{sessions.length}</p>
            <p className="text-xs text-gray-500">Total Sessions</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Chart */}
      <Card className="rounded-2xl border-0 shadow-sm bg-white">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gray-400" />
            This Week&apos;s Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} unit="h" />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  }}
                />
                <Bar dataKey="hours" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="Hours" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Sessions */}
      <Card className="rounded-2xl border-0 shadow-sm bg-white">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            Recent Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <EmptyState
              icon={<GraduationCap className="w-8 h-8" />}
              title="No interview prep sessions yet"
              description="Start preparing for your interviews!"
              actionLabel="Add First Session"
              onAction={() => setDialogOpen(true)}
            />
          ) : (
            <div className="space-y-3">
              {sessions.slice(0, 15).map((session) => {
                const accuracy = session.questionsAnswered > 0 
                  ? Math.round((session.correctAnswers / session.questionsAnswered) * 100)
                  : 0;
                
                return (
                  <div
                    key={session.id}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl group hover:bg-gray-100 transition-colors"
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      session.mockInterview ? 'bg-purple-100' : 'bg-indigo-100'
                    }`}>
                      <GraduationCap className={`w-6 h-6 ${
                        session.mockInterview ? 'text-purple-500' : 'text-indigo-500'
                      }`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900 truncate">
                          {session.topic}
                        </span>
                        {session.category && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full capitalize">
                            {session.category.replace('-', ' ')}
                          </span>
                        )}
                        {session.mockInterview && (
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                            Mock
                          </span>
                        )}
                        {session.codingPractice && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                            Code
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-sm text-gray-500">
                        {session.duration && <span>{session.duration} min</span>}
                        {session.questionsAnswered > 0 && (
                          <>
                            <span>{session.correctAnswers}/{session.questionsAnswered} correct</span>
                            <span className={`font-medium ${accuracy >= 70 ? 'text-emerald-600' : accuracy >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                              {accuracy}% accuracy
                            </span>
                          </>
                        )}
                        {session.confidenceLevel && (
                          <span>Confidence: {'★'.repeat(session.confidenceLevel)}{'☆'.repeat(5 - session.confidenceLevel)}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditDialog(session)}
                        className="p-2 hover:bg-white rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-gray-500" />
                      </button>
                      <button
                        onClick={() => setDeleteId(session.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>

                    <span className="text-xs text-gray-400 hidden sm:block">
                      {format(new Date(session.date), 'MMM d')}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete Session?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </div>
  );
}
