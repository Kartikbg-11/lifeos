'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { mockProjects, mockDocuments, generationResults } from '@/lib/mock-data';
import {
  ChevronRight, ChevronLeft, Sparkles, FileSearch, ListChecks, TestTube2,
  AlertTriangle, Globe, Database, Bug, Bot, Download, Loader2, CheckCircle2
} from 'lucide-react';

const generationTypes = [
  { id: 'requirementAnalysis', label: 'Requirement Analysis', icon: FileSearch, description: 'Extract and analyze requirements from documents', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  { id: 'testScenarios', label: 'Test Scenarios', icon: ListChecks, description: 'Generate comprehensive test scenarios', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  { id: 'testCases', label: 'Test Cases', icon: TestTube2, description: 'Create detailed test cases with steps', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
  { id: 'edgeCases', label: 'Edge Cases', icon: AlertTriangle, description: 'Identify boundary and edge case tests', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
  { id: 'apiTestCases', label: 'API Test Cases', icon: Globe, description: 'Generate API endpoint test cases', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  { id: 'databaseTestCases', label: 'Database Test Cases', icon: Database, description: 'Create database and data layer tests', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  { id: 'bugPrediction', label: 'Bug Prediction', icon: Bug, description: 'Predict potential bugs and risk areas', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
  { id: 'automationRecommendation', label: 'Automation Recommendation', icon: Bot, description: 'Get automation strategy recommendations', color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/20' },
];

const priorityColors: Record<string, string> = {
  Critical: 'bg-red-500/15 text-red-400',
  High: 'bg-amber-500/15 text-amber-400',
  Medium: 'bg-emerald-500/15 text-emerald-400',
  Low: 'bg-zinc-500/15 text-zinc-400',
};

const severityColors: Record<string, string> = {
  Critical: 'bg-red-500/15 text-red-400',
  Major: 'bg-amber-500/15 text-amber-400',
  Minor: 'bg-blue-500/15 text-blue-400',
  Trivial: 'bg-zinc-500/15 text-zinc-400',
};

export default function AiGeneratorPage() {
  const [step, setStep] = useState(0);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedDocument, setSelectedDocument] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<Record<string, unknown[]> | null>(null);

  const steps = ['Select Project', 'Select Document', 'Choose Type', 'View Results'];

  const availableDocuments = mockDocuments.filter(d =>
    d.projectId === selectedProject && d.status === 'Processed'
  );

  const handleGenerate = async () => {
    setIsGenerating(true);
    await new Promise(r => setTimeout(r, 2500));
    const key = selectedType as keyof typeof generationResults;
    setResults({ [selectedType]: generationResults[key] });
    setIsGenerating(false);
    setStep(3);
  };

  const canNext = step === 0 ? !!selectedProject : step === 1 ? !!selectedDocument : step === 2 ? !!selectedType : false;

  const renderResults = () => {
    if (!results || !selectedType) return null;
    const data = results[selectedType] as Record<string, string>[];
    if (!data || data.length === 0) return null;

    const columns = Object.keys(data[0]);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <p className="text-sm text-emerald-400 font-medium">
              {data.length} items generated successfully
            </p>
          </div>
          <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
            <Download className="w-4 h-4 mr-2" />Export
          </Button>
        </div>
        <div className="overflow-x-auto border border-zinc-800 rounded-lg">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent bg-zinc-800/30">
                {columns.map(col => (
                  <TableHead key={col} className="text-zinc-300 font-medium text-xs uppercase tracking-wider">{col.replace(/([A-Z])/g, ' $1').trim()}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, i) => (
                <TableRow key={i} className="border-zinc-800 hover:bg-zinc-800/50">
                  {columns.map(col => {
                    const val = row[col];
                    if (col === 'priority' || col === 'likelihood' || col === 'risk' || col === 'effort' || col === 'impact') {
                      return <TableCell key={col}><Badge variant="outline" className={priorityColors[val] || 'bg-zinc-500/15 text-zinc-400'}>{val}</Badge></TableCell>;
                    }
                    if (col === 'severity') {
                      return <TableCell key={col}><Badge variant="outline" className={severityColors[val] || 'bg-zinc-500/15 text-zinc-400'}>{val}</Badge></TableCell>;
                    }
                    return <TableCell key={col} className="text-sm text-zinc-300 max-w-[300px] truncate">{val}</TableCell>;
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${i === step ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : i < step ? 'text-zinc-300' : 'text-zinc-500'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === step ? 'bg-emerald-500 text-white' : i < step ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
                {i < step ? '✓' : i + 1}
              </span>
              <span className="hidden sm:inline">{s}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-8 h-px ${i < step ? 'bg-emerald-500/50' : 'bg-zinc-800'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardContent className="p-6">
          {/* Step 0: Select Project */}
          {step === 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Select a Project</h3>
              <p className="text-sm text-zinc-400">Choose the project you want to generate test cases for.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                {mockProjects.filter(p => p.status === 'Active').map(p => (
                  <Card
                    key={p.id}
                    className={`cursor-pointer transition-all ${selectedProject === p.id ? 'border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/30' : 'border-zinc-800 hover:border-zinc-700'}`}
                    onClick={() => setSelectedProject(p.id)}
                  >
                    <CardContent className="p-4">
                      <p className="font-medium text-white">{p.name}</p>
                      <p className="text-xs text-zinc-400 mt-1">{p.testCases} test cases · {p.members} members</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Select Document */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Select a Document</h3>
              <p className="text-sm text-zinc-400">Choose the source document for AI analysis.</p>
              <div className="space-y-2 mt-4">
                {availableDocuments.length === 0 && (
                  <div className="text-center py-8 text-zinc-500">No processed documents found for this project.</div>
                )}
                {availableDocuments.map(d => (
                  <Card
                    key={d.id}
                    className={`cursor-pointer transition-all ${selectedDocument === d.id ? 'border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/30' : 'border-zinc-800 hover:border-zinc-700'}`}
                    onClick={() => setSelectedDocument(d.id)}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">{d.name}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">{d.type} · {d.size}</p>
                      </div>
                      <Badge variant="outline" className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20">Processed</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Choose Generation Type */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Choose Generation Type</h3>
              <p className="text-sm text-zinc-400">Select what type of AI-generated output you need.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
                {generationTypes.map(t => (
                  <Card
                    key={t.id}
                    className={`cursor-pointer transition-all ${selectedType === t.id ? 'border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/30' : 'border-zinc-800 hover:border-zinc-700'}`}
                    onClick={() => setSelectedType(t.id)}
                  >
                    <CardContent className="p-4 text-center">
                      <div className={`w-10 h-10 mx-auto rounded-xl ${t.bg} flex items-center justify-center mb-2`}>
                        <t.icon className={`w-5 h-5 ${t.color}`} />
                      </div>
                      <p className="text-sm font-medium text-white">{t.label}</p>
                      <p className="text-xs text-zinc-500 mt-1">{t.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Results */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                    Generation Results
                  </h3>
                  <p className="text-sm text-zinc-400 mt-0.5">
                    {generationTypes.find(t => t.id === selectedType)?.label} for {mockProjects.find(p => p.id === selectedProject)?.name}
                  </p>
                </div>
                <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-300" onClick={() => { setStep(2); setResults(null); }}>
                  Regenerate
                </Button>
              </div>

              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-2 border-zinc-800" />
                    <div className="absolute inset-0 w-16 h-16 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                    <Sparkles className="w-6 h-6 text-emerald-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <div className="text-center">
                    <p className="text-white font-medium">AI is analyzing your document...</p>
                    <p className="text-sm text-zinc-400 mt-1">This may take a moment</p>
                  </div>
                </div>
              ) : (
                renderResults()
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setStep(s => s - 1)}
          disabled={step === 0 || isGenerating}
          className="border-zinc-700 text-zinc-300"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />Back
        </Button>

        {step < 2 && (
          <Button
            onClick={() => setStep(s => s + 1)}
            disabled={!canNext}
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            Next<ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        )}

        {step === 2 && (
          <Button
            onClick={handleGenerate}
            disabled={!selectedType || isGenerating}
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            {isGenerating ? 'Generating...' : 'Generate'}
          </Button>
        )}
      </div>
    </div>
  );
}