'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import api from '@/services/api';
import { useAuthStore } from '@/store/use-auth-store';
import {
  Settings,
  User,
  Target,
  Download,
  LogOut,
  Save,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { user, updateSettings, logout } = useAuthStore();
  
  // Profile state
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  
  // Goals state
  const [goalsData, setGoalsData] = useState({
    workoutGoal: user?.settings?.workoutGoal || 60,
    pushupGoal: user?.settings?.pushupGoal || 60,
    learningGoal: user?.settings?.learningGoal || 180,
    interviewGoal: user?.settings?.interviewGoal || 180,
    sleepGoal: user?.settings?.sleepGoal || 480,
    waterGoal: user?.settings?.waterGoal || 3000,
    proteinGoal: user?.settings?.proteinGoal || 100,
  });

  // Preferences state
  const [preferencesData, setPreferencesData] = useState({
    currency: user?.settings?.currency || '₹',
    timezone: user?.settings?.timezone || 'Asia/Kolkata',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      await api.settings.update({ name: profileData.name });
      updateSettings({ name: profileData.name });
      toast.success('Profile updated! ✅');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveGoals = async () => {
    try {
      setIsSaving(true);
      await api.settings.update(goalsData);
      updateSettings(goalsData as any);
      toast.success('Goals updated! 🎯');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update goals');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    try {
      setIsSaving(true);
      await api.settings.update(preferencesData);
      updateSettings(preferencesData as any);
      toast.success('Preferences saved! ⚙️');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = async () => {
    try {
      toast.info('Preparing your data export...');
      await api.export.exportData('json');
      toast.success('Data exported successfully! 📥');
    } catch (error: any) {
      toast.error(error.message || 'Export failed');
    }
  };

  const handleLogout = async () => {
    try {
      await api.auth.logout();
      logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      logout();
      window.location.href = '/login';
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="w-7 h-7 text-gray-500" />
          Settings
        </h1>
        <p className="text-gray-500 mt-1">Manage your profile and preferences</p>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-100 rounded-xl p-1 w-full overflow-x-auto">
          <TabsTrigger value="profile" className="rounded-lg flex items-center gap-2 whitespace-nowrap">
            <User className="w-4 h-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="goals" className="rounded-lg flex items-center gap-2 whitespace-nowrap">
            <Target className="w-4 h-4" />
            Goals
          </TabsTrigger>
          <TabsTrigger value="preferences" className="rounded-lg flex items-center gap-2 whitespace-nowrap">
            <Settings className="w-4 h-4" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="data" className="rounded-lg flex items-center gap-2 whitespace-nowrap">
            <Download className="w-4 h-4" />
            Data
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="mt-6">
          <Card className="rounded-2xl border-0 shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{user?.name || 'User'}</p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                  <p className="text-xs text-gray-400 mt-1">Member since {new Date().toLocaleDateString()}</p>
                </div>
              </div>

              <Separator />

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="Your name"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    disabled
                    className="rounded-xl bg-gray-50"
                  />
                  <p className="text-xs text-gray-400">Email cannot be changed</p>
                </div>
              </div>

              <Button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="bg-emerald-600 hover:bg-emerald-700 rounded-xl"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Profile
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals" className="mt-6 space-y-6">
          <Card className="rounded-2xl border-0 shadow-sm bg-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Daily Goals</CardTitle>
                <span className="text-xs text-gray-400">Set your daily targets</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Fitness Goals */}
              <div className="p-4 bg-orange-50 rounded-xl space-y-3">
                <h3 className="font-medium text-orange-800 flex items-center gap-2">
                  💪 Fitness Goals
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm">Workout Duration (minutes)</Label>
                    <Input
                      type="number"
                      value={goalsData.workoutGoal}
                      onChange={(e) => setGoalsData({ ...goalsData, workoutGoal: parseInt(e.target.value) || 60 })}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Push-ups Goal</Label>
                    <Input
                      type="number"
                      value={goalsData.pushupGoal}
                      onChange={(e) => setGoalsData({ ...goalsData, pushupGoal: parseInt(e.target.value) || 60 })}
                      className="rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Learning Goals */}
              <div className="p-4 bg-blue-50 rounded-xl space-y-3">
                <h3 className="font-medium text-blue-800 flex items-center gap-2">
                  📚 Learning Goals
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm">Learning Time (minutes)</Label>
                    <Input
                      type="number"
                      value={goalsData.learningGoal}
                      onChange={(e) => setGoalsData({ ...goalsData, learningGoal: parseInt(e.target.value) || 180 })}
                      className="rounded-xl"
                    />
                    <p className="text-xs text-blue-600">{Math.round(goalsData.learningGoal / 60)} hours</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Interview Prep (minutes)</Label>
                    <Input
                      type="number"
                      value={goalsData.interviewGoal}
                      onChange={(e) => setGoalsData({ ...goalsData, interviewGoal: parseInt(e.target.value) || 180 })}
                      className="rounded-xl"
                    />
                    <p className="text-xs text-blue-600">{Math.round(goalsData.interviewGoal / 60)} hours</p>
                  </div>
                </div>
              </div>

              {/* Health Goals */}
              <div className="p-4 bg-purple-50 rounded-xl space-y-3">
                <h3 className="font-medium text-purple-800 flex items-center gap-2">
                  🏥 Health Goals
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm">Sleep Goal (minutes)</Label>
                    <Input
                      type="number"
                      value={goalsData.sleepGoal}
                      onChange={(e) => setGoalsData({ ...goalsData, sleepGoal: parseInt(e.target.value) || 480 })}
                      className="rounded-xl"
                    />
                    <p className="text-xs text-purple-600">{Math.round(goalsData.sleepGoal / 60)} hours</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Water Goal (ml)</Label>
                    <Input
                      type="number"
                      value={goalsData.waterGoal}
                      onChange={(e) => setGoalsData({ ...goalsData, waterGoal: parseInt(e.target.value) || 3000 })}
                      className="rounded-xl"
                    />
                    <p className="text-xs text-purple-600">{(goalsData.waterGoal / 1000).toFixed(1)} liters</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Protein Goal (grams)</Label>
                    <Input
                      type="number"
                      value={goalsData.proteinGoal}
                      onChange={(e) => setGoalsData({ ...goalsData, proteinGoal: parseInt(e.target.value) || 100 })}
                      className="rounded-xl"
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSaveGoals}
                disabled={isSaving}
                className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-xl py-3"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving Goals...
                  </>
                ) : (
                  <>
                    <Target className="w-4 h-4 mr-2" />
                    Update All Goals
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="mt-6">
          <Card className="rounded-2xl border-0 shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select
                    value={preferencesData.currency}
                    onValueChange={(v) => setPreferencesData({ ...preferencesData, currency: v })}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="₹">₹ - Indian Rupee</SelectItem>
                      <SelectItem value="$">$ - US Dollar</SelectItem>
                      <SelectItem value="€">€ - Euro</SelectItem>
                      <SelectItem value="£">£ - British Pound</SelectItem>
                      <SelectItem value="¥">¥ - Japanese Yen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select
                    value={preferencesData.timezone}
                    onValueChange={(v) => setPreferencesData({ ...preferencesData, timezone: v })}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Kolkata">India (IST)</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                      <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                      <SelectItem value="Europe/London">London (GMT/BST)</SelectItem>
                      <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                      <SelectItem value="Australia/Sydney">Sydney (AEST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="p-4 bg-gray-50 rounded-xl">
                <h3 className="font-medium text-gray-900 mb-2">Theme</h3>
                <p className="text-sm text-gray-500 mb-3">LIFEOS uses a clean white theme optimized for clarity and focus.</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border-2 border-emerald-500 flex items-center justify-center shadow-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Light Theme</p>
                    <p className="text-xs text-gray-500">Currently active</p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSavePreferences}
                disabled={isSaving}
                className="bg-emerald-600 hover:bg-emerald-700 rounded-xl"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Settings className="w-4 h-4 mr-2" />
                    Save Preferences
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Tab */}
        <TabsContent value="data" className="mt-6 space-y-6">
          <Card className="rounded-2xl border-0 shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Data Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Export Section */}
              <div className="p-4 bg-blue-50 rounded-xl">
                <h3 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Export Your Data
                </h3>
                <p className="text-sm text-blue-700 mb-4">
                  Download all your LIFEOS data in JSON format for backup or migration purposes.
                </p>
                <Button
                  onClick={handleExport}
                  variant="outline"
                  className="border-blue-200 text-blue-700 hover:bg-blue-100 rounded-xl"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export JSON
                </Button>
              </div>

              <Separator />

              {/* Account Actions */}
              <div className="p-4 bg-red-50 rounded-xl">
                <h3 className="font-medium text-red-900 mb-2 flex items-center gap-2">
                  <LogOut className="w-5 h-5" />
                  Account
                </h3>
                <p className="text-sm text-red-700 mb-4">
                  Sign out of your account on this device.
                </p>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="border-red-200 text-red-700 hover:bg-red-100 rounded-xl"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>

              {/* App Info */}
              <div className="text-center pt-4">
                <p className="text-sm text-gray-500">
                  LIFEOS v1.0.0
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Built with ❤️ for personal growth enthusiasts
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
