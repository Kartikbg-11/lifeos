'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Eye, EyeOff, Save, Key, Brain, Settings2, Globe } from 'lucide-react';

export default function SettingsPage() {
  const [provider, setProvider] = useState('openai');
  const [apiKey, setApiKey] = useState('sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxx');
  const [showKey, setShowKey] = useState(false);
  const [model, setModel] = useState('gpt-4o');
  const [temperature, setTemperature] = useState([0.7]);
  const [maxTokens, setMaxTokens] = useState('4096');
  const [language, setLanguage] = useState('en');

  const [saved, setSaved] = useState(false);
  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* AI Provider Settings */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-emerald-400" />
            AI Provider Configuration
          </CardTitle>
          <CardDescription className="text-zinc-400">Configure the AI provider for test case generation.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label className="text-zinc-300">AI Provider</Label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                <SelectItem value="openai">OpenAI (GPT-4o)</SelectItem>
                <SelectItem value="gemini">Google Gemini</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300">API Key</Label>
            <div className="relative">
              <Input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white pr-10 font-mono"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-zinc-400 hover:text-white"
                onClick={() => setShowKey(s => !s)}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-zinc-500">Your API key is stored securely and never shared.</p>
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300">Model</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                {provider === 'openai' ? (
                  <>
                    <SelectItem value="gpt-4o">GPT-4o (Recommended)</SelectItem>
                    <SelectItem value="gpt-4o-mini">GPT-4o Mini (Faster)</SelectItem>
                    <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                    <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (Cost Effective)</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
                    <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash</SelectItem>
                    <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-zinc-300">Temperature</Label>
              <span className="text-sm text-emerald-400 font-mono">{temperature[0]}</span>
            </div>
            <Slider
              value={temperature}
              onValueChange={setTemperature}
              min={0}
              max={2}
              step={0.1}
              className="[&>span:first-child]:bg-emerald-500"
            />
            <p className="text-xs text-zinc-500">Lower values are more focused, higher values are more creative.</p>
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300">Max Tokens</Label>
            <Select value={maxTokens} onValueChange={setMaxTokens}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                <SelectItem value="2048">2,048</SelectItem>
                <SelectItem value="4096">4,096 (Recommended)</SelectItem>
                <SelectItem value="8192">8,192</SelectItem>
                <SelectItem value="16384">16,384</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* General Settings */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-emerald-400" />
            General Settings
          </CardTitle>
          <CardDescription className="text-zinc-400">Configure general application preferences.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label className="text-zinc-300">Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="zh">Chinese (Simplified)</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="ja">Japanese</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator className="bg-zinc-800" />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Auto-save drafts</p>
              <p className="text-xs text-zinc-400">Automatically save test case drafts while editing</p>
            </div>
            <Switch defaultChecked className="data-[state=checked]:bg-emerald-500" />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Email notifications</p>
              <p className="text-xs text-zinc-400">Receive email alerts for generation completions</p>
            </div>
            <Switch defaultChecked className="data-[state=checked]:bg-emerald-500" />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Real-time collaboration</p>
              <p className="text-xs text-zinc-400">See other users&apos; changes in real-time</p>
            </div>
            <Switch className="data-[state=checked]:bg-emerald-500" />
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-500/20 bg-zinc-900/50">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-red-400">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Clear all generated data</p>
              <p className="text-xs text-zinc-400">Permanently remove all AI-generated test cases</p>
            </div>
            <Button variant="outline" size="sm" className="border-red-500/30 text-red-400 hover:bg-red-500/10">
              Clear Data
            </Button>
          </div>
          <Separator className="bg-zinc-800" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Reset API key</p>
              <p className="text-xs text-zinc-400">Remove the current API key configuration</p>
            </div>
            <Button variant="outline" size="sm" className="border-red-500/30 text-red-400 hover:bg-red-500/10">
              <Key className="w-3 h-3 mr-1" />Reset Key
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} className="bg-emerald-500 hover:bg-emerald-600 text-white min-w-[120px]">
          {saved ? (
            <>✓ Saved</>
          ) : (
            <><Save className="w-4 h-4 mr-2" />Save Settings</>
          )}
        </Button>
      </div>
    </div>
  );
}