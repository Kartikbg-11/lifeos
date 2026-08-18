'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { ListSkeleton } from '@/components/shared/loading-skeleton';
import api from '@/services/api';
import {
  BookMarked,
  Save,
  Trash2,
  Edit2,
  Calendar,
  Lightbulb,
  Target,
  ThumbsUp,
  AlertTriangle,
  Rocket,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

interface JournalEntry {
  id: string;
  date: string;
  accomplishments?: string;
  whatLearned?: string;
  wentWell?: string;
  wentWrong?: string;
  improvementTomorrow?: string;
  generalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

const JOURNAL_PROMPTS = [
  { key: 'accomplishments', label: 'What did I accomplish today?', icon: <Target className="w-5 h-5 text-emerald-500" />, placeholder: 'List your wins and achievements...' },
  { key: 'whatLearned', label: 'What did I learn today?', icon: <Lightbulb className="w-5 h-5 text-yellow-500" />, placeholder: 'New knowledge or insights gained...' },
  { key: 'wentWell', label: 'What went well?', icon: <ThumbsUp className="w-5 h-5 text-blue-500" />, placeholder: 'Things that went according to plan...' },
  { key: 'wentWrong', label: 'What went wrong?', icon: <AlertTriangle className="w-5 h-5 text-red-500" />, placeholder: 'Challenges or setbacks faced...' },
  { key: 'improvementTomorrow', label: 'What should I improve tomorrow?', icon: <Rocket className="w-5 h-5 text-purple-500" />, placeholder: 'Action items for tomorrow...' },
];

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    accomplishments: '',
    whatLearned: '',
    wentWell: '',
    wentWrong: '',
    improvementTomorrow: '',
    generalNotes: '',
  });

  const today = format(new Date(), 'yyyy-MM-dd');

  const fetchEntries = async () => {
    try {
      setIsLoading(true);
      const response = await api.journal.getAll();
      // Handle both array and object responses
      const data = Array.isArray(response) ? response : (response?.entries || response?.journalEntries || []);
      setEntries(data);
      
      // Check if today's entry exists
      const todayEntry = data.find(e => e.date === today);
      if (todayEntry) {
        setFormData({
          accomplishments: todayEntry.accomplishments || '',
          whatLearned: todayEntry.whatLearned || '',
          wentWell: todayEntry.wentWell || '',
          wentWrong: todayEntry.wentWrong || '',
          improvementTomorrow: todayEntry.improvementTomorrow || '',
          generalNotes: todayEntry.generalNotes || '',
        });
      }
    } catch (error) {
      toast.error('Failed to load journal entries');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  // Check if form has any content
  const hasContent = () => {
    return Object.values(formData).some(val => val.trim().length > 0);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!hasContent()) {
      toast.error('Please write something in at least one section');
      return;
    }

    try {
      const payload = {
        date: editingDate || today,
        accomplishments: formData.accomplishments || undefined,
        whatLearned: formData.whatLearned || undefined,
        wentWell: formData.wentWell || undefined,
        wentWrong: formData.wentWrong || undefined,
        improvementTomorrow: formData.improvementTomorrow || undefined,
        generalNotes: formData.generalNotes || undefined,
      };

      // Check if entry exists for this date
      const existingEntry = entries.find(e => e.date === (editingDate || today));
      
      if (existingEntry) {
        await api.journal.update(editingDate || today, payload);
        toast.success('Journal updated! 📝');
      } else {
        await api.journal.save(payload);
        toast.success('Journal saved! 📝');
      }

      setEditingDate(null);
      fetchEntries();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save journal');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      await api.journal.update(deleteId, {
        accomplishments: '',
        whatLearned: '',
        wentWell: '',
        wentWrong: '',
        improvementTomorrow: '',
        generalNotes: '',
      });
      toast.error('Journal entry deleted');
      setDeleteId(null);
      fetchEntries();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete');
    }
  };

  const openEditDialog = (entry: JournalEntry) => {
    setEditingDate(entry.date);
    setFormData({
      accomplishments: entry.accomplishments || '',
      whatLearned: entry.whatLearned || '',
      wentWell: entry.wentWell || '',
      wentWrong: entry.wentWrong || '',
      improvementTomorrow: entry.improvementTomorrow || '',
      generalNotes: entry.generalNotes || '',
    });
  };

  const closeEditDialog = () => {
    setEditingDate(null);
    
    // Reset to today's data if it exists
    const todayEntry = entries.find(e => e.date === today);
    if (todayEntry) {
      setFormData({
        accomplishments: todayEntry.accomplishments || '',
        whatLearned: todayEntry.whatLearned || '',
        wentWell: todayEntry.wentWell || '',
        wentWrong: todayEntry.wentWrong || '',
        improvementTomorrow: todayEntry.improvementTomorrow || '',
        generalNotes: todayEntry.generalNotes || '',
      });
    } else {
      setFormData({
        accomplishments: '',
        whatLearned: '',
        wentWell: '',
        wentWrong: '',
        improvementTomorrow: '',
        generalNotes: '',
      });
    }
  };

  // Check if today's entry exists
  const todayEntry = entries.find(e => e.date === today);

  if (isLoading) {
    return <ListSkeleton rows={3} />;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BookMarked className="w-7 h-7 text-emerald-600" />
          Daily Journal
        </h1>
        <p className="text-gray-500 mt-1">Reflect on your day and plan for tomorrow</p>
      </div>

      {/* Today's Journal Form */}
      <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-white overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              📅 Today&apos;s Journal - {format(new Date(), 'EEEE, MMM d')}
            </CardTitle>
            {todayEntry && (
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                Saved
              </span>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Journal Prompts */}
          {JOURNAL_PROMPTS.map((prompt) => (
            <div key={prompt.key} className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                {prompt.icon}
                {prompt.label}
              </Label>
              <Textarea
                placeholder={prompt.placeholder}
                value={formData[prompt.key as keyof typeof formData]}
                onChange={(e) => setFormData({ ...formData, [prompt.key]: e.target.value })}
                rows={3}
                className="rounded-xl border-gray-200 focus:border-emerald-500 resize-none"
              />
            </div>
          ))}

          {/* General Notes */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              ✨ General Notes
            </Label>
            <Textarea
              placeholder="Anything else you want to remember..."
              value={formData.generalNotes}
              onChange={(e) => setFormData({ ...formData, generalNotes: e.target.value })}
              rows={3}
              className="rounded-xl border-gray-200 focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Save Button */}
          <Button 
            onClick={() => handleSubmit()}
            className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-xl py-3"
          >
            <Save className="w-4 h-4 mr-2" />
            {todayEntry ? 'Update Journal' : 'Save Journal'}
          </Button>
        </CardContent>
      </Card>

      {/* Previous Entries */}
      <Card className="rounded-2xl border-0 shadow-sm bg-white">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            Previous Entries
          </CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <EmptyState
              icon={<BookMarked className="w-8 h-8" />}
              title="No journal entries yet"
              description="Start writing your first journal entry above!"
            />
          ) : (
            <div className="space-y-3">
              {[...entries]
                .filter(e => e.date !== today)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 10)
                .map((entry) => {
                  const hasContent = [
                    entry.accomplishments,
                    entry.whatLearned,
                    entry.wentWell,
                    entry.wentWrong,
                    entry.improvementTomorrow,
                    entry.generalNotes,
                  ].some(val => val && val.trim().length > 0);

                  if (!hasContent) return null;

                  return (
                    <div
                      key={entry.id}
                      className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">
                            {format(parseISO(entry.date), 'EEEE, MMM d, yyyy')}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditDialog(entry)}
                            className="p-1.5 hover:bg-white rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4 text-gray-500" />
                          </button>
                          <button
                            onClick={() => setDeleteId(entry.date)}
                            className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </div>

                      {/* Preview of content */}
                      <div className="space-y-2 mt-3">
                        {entry.accomplishments && (
                          <div className="flex gap-2">
                            <Target className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-600 line-clamp-2">{entry.accomplishments}</p>
                          </div>
                        )}
                        {entry.whatLearned && (
                          <div className="flex gap-2">
                            <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-600 line-clamp-2">{entry.whatLearned}</p>
                          </div>
                        )}
                        {entry.improvementTomorrow && (
                          <div className="flex gap-2">
                            <Rocket className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-600 line-clamp-2">{entry.improvementTomorrow}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingDate} onOpenChange={(open) => !open && closeEditDialog()}>
        <DialogContent className="rounded-2xl max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Editing: {editingDate && format(parseISO(editingDate), 'MMMM d, yyyy')}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={(e) => handleSubmit(e)} className="space-y-4 mt-4">
            {JOURNAL_PROMPTS.map((prompt) => (
              <div key={prompt.key} className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  {prompt.icon}
                  {prompt.label}
                </Label>
                <Textarea
                  value={formData[prompt.key as keyof typeof formData]}
                  onChange={(e) => setFormData({ ...formData, [prompt.key]: e.target.value })}
                  rows={2}
                  className="rounded-xl border-gray-200"
                />
              </div>
            ))}

            <div className="space-y-2">
              <Label>General Notes</Label>
              <Textarea
                value={formData.generalNotes}
                onChange={(e) => setFormData({ ...formData, generalNotes: e.target.value })}
                rows={2}
                className="rounded-xl border-gray-200"
              />
            </div>

            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-xl">
              Update Entry
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete Journal Entry?"
        description="This will remove all content from this journal entry."
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </div>
  );
}
