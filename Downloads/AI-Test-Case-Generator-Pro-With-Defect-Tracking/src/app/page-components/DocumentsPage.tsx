'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, FileText, File, Eye, Trash2, Search, Filter, CloudUpload, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description?: string;
  status?: string;
  _count?: { documents?: number; testCases?: number; testScenarios?: number; members?: number };
}

interface DocItem {
  id: string;
  projectId: string;
  name: string;
  fileType: string;
  filePath?: string;
  fileSize: number;
  status: string;
  version?: number;
  contentExtracted?: string;
  uploadedById?: string;
  createdAt: string;
  updatedAt?: string;
}

const statusColors: Record<string, string> = {
  COMPLETED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  PROCESSED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  Processed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  PROCESSING: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  Processing: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  UPLOADED: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  Uploaded: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  PENDING: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
  Pending: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
  FAILED: 'bg-red-500/15 text-red-400 border-red-500/20',
  Failed: 'bg-red-500/15 text-red-400 border-red-500/20',
  Uploading: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
};

const typeIcons: Record<string, string> = {
  PDF: '🔴', DOCX: '🔵', DOC: '🔵', YAML: '🟡', YML: '🟡',
  XLSX: '🟢', CSV: '🟢', TXT: '⚪', JSON: '🟡', PNG: '🖼️',
  JPG: '🖼️', JPEG: '🖼️', GIF: '🖼️', WEBP: '🖼️',
};

function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toISOString().split('T')[0];
  } catch {
    return dateStr;
  }
}

export default function DocumentsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [documents, setDocuments] = useState<DocItem[]>([]);
  const [projectFilter, setProjectFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [deleteDoc, setDeleteDoc] = useState<DocItem | null>(null);
  const [previewDoc, setPreviewDoc] = useState<DocItem | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch projects from the database
  const loadProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  }, []);

  // Fetch documents for selected project
  const loadDocuments = useCallback(async (projectId: string) => {
    setLoading(true);
    try {
      const url = projectId === 'all'
        ? '/api/documents'
        : `/api/documents?projectId=${projectId}`;
      const res = await fetch(url);
      if (res.ok) {
        const data: DocItem[] = await res.json();
        setDocuments(data);
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Load documents when project filter changes
  useEffect(() => {
    if (projects.length > 0) {
      loadDocuments(projectFilter);
    }
  }, [projectFilter, projects, loadDocuments]);

  const filtered = documents.filter(d => {
    const matchProject = projectFilter === 'all' || d.projectId === projectFilter;
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase());
    return matchProject && matchSearch;
  });

  // Actual file upload handler
  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    // Validate a project is selected
    if (projectFilter === 'all') {
      setUploadStatus('error');
      setUploadMessage('Please select a project first before uploading documents.');
      setTimeout(() => { setUploadStatus('idle'); setUploadMessage(''); }, 5000);
      return;
    }

    const selectedProject = projectFilter;
    const uploadPromises = Array.from(files).map(async (file) => {
      // Validate file type
      const allowedExtensions = ['.pdf', '.docx', '.doc', '.txt', '.xlsx', '.csv', '.json', '.yaml', '.yml', '.png', '.jpg', '.jpeg', '.gif', '.webp'];
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!allowedExtensions.includes(ext)) {
        return { success: false, fileName: file.name, error: `Unsupported file type: ${ext}` };
      }

      // Validate file size (50MB)
      if (file.size > 50 * 1024 * 1024) {
        return { success: false, fileName: file.name, error: 'File exceeds 50MB limit' };
      }

      setUploadStatus('uploading');
      setUploadProgress(0);
      setUploadMessage(`Uploading ${file.name}...`);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('projectId', selectedProject);

        // Simulate progress for UX
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev === null) return 10;
            if (prev >= 90) { clearInterval(progressInterval); return 90; }
            return prev + 15;
          });
        }, 200);

        const res = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData,
        });

        clearInterval(progressInterval);

        if (res.ok) {
          const data = await res.json();
          setUploadProgress(100);
          return { success: true, data };
        } else {
          const err = await res.json().catch(() => ({}));
          return { success: false, fileName: file.name, error: err.error || 'Upload failed' };
        }
      } catch (error) {
        return { success: false, fileName: file.name, error: 'Network error. Please try again.' };
      }
    });

    const results = await Promise.all(uploadPromises);

    // Process results
    let successCount = 0;
    let errorMessages: string[] = [];

    results.forEach(result => {
      if (result.success) {
        successCount++;
      } else {
        errorMessages.push((result as { fileName: string; error: string }).error);
      }
    });

    if (successCount > 0) {
      setUploadStatus('success');
      setUploadMessage(`Successfully uploaded ${successCount} file${successCount > 1 ? 's' : ''}`);
      // Reload documents after successful upload
      await loadDocuments(projectFilter);
    }
    if (errorMessages.length > 0) {
      setUploadStatus('error');
      setUploadMessage(errorMessages.join('. '));
    }

    // Reset status after delay
    setTimeout(() => {
      setUploadStatus('idle');
      setUploadProgress(null);
      setUploadMessage('');
    }, 4000);
  }, [projectFilter, loadDocuments]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  };

  const handleDelete = async () => {
    if (deleteDoc) {
      try {
        await fetch(`/api/documents/${deleteDoc.id}`, { method: 'DELETE' });
        setDocuments(prev => prev.filter(d => d.id !== deleteDoc.id));
      } catch { /* fall back to local removal */ 
        setDocuments(prev => prev.filter(d => d.id !== deleteDoc.id));
      }
      setDeleteDoc(null);
    }
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'Unknown Project';
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              placeholder="Search documents..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500"
            />
          </div>
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-full sm:w-[240px] bg-zinc-900 border-zinc-800 text-white">
              <Filter className="w-4 h-4 mr-2 text-zinc-400" />
              <SelectValue placeholder={projects.length === 0 ? "Loading projects..." : "All Projects"} />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Upload Area */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardContent className="p-6">
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
              isDragging
                ? 'border-emerald-500 bg-emerald-500/5 scale-[1.01]'
                : uploadStatus === 'success'
                ? 'border-emerald-500/50 bg-emerald-500/5'
                : uploadStatus === 'error'
                ? 'border-red-500/50 bg-red-500/5'
                : 'border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/30'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.docx,.doc,.txt,.xlsx,.csv,.json,.yaml,.yml,.png,.jpg,.jpeg,.gif,.webp"
              onChange={handleFileSelect}
              className="hidden"
            />

            {uploadStatus === 'uploading' ? (
              <div className="space-y-4">
                <Loader2 className="w-10 h-10 mx-auto text-emerald-400 animate-spin" />
                <p className="text-sm font-medium text-zinc-300">{uploadMessage}</p>
                <div className="max-w-xs mx-auto">
                  <Progress value={uploadProgress || 0} className="h-2 bg-zinc-800" />
                  <p className="text-xs text-zinc-500 mt-2">{uploadProgress}%</p>
                </div>
              </div>
            ) : uploadStatus === 'success' ? (
              <div className="space-y-3">
                <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400" />
                <p className="text-sm font-medium text-emerald-400">{uploadMessage}</p>
              </div>
            ) : uploadStatus === 'error' ? (
              <div className="space-y-3">
                <XCircle className="w-10 h-10 mx-auto text-red-400" />
                <p className="text-sm font-medium text-red-400">{uploadMessage}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2 border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  Try Again
                </Button>
              </div>
            ) : (
              <>
                <CloudUpload className={`w-10 h-10 mx-auto mb-3 transition-colors ${isDragging ? 'text-emerald-400' : 'text-zinc-500'}`} />
                <p className="text-sm font-medium text-zinc-300">
                  {isDragging ? 'Drop files here...' : projectFilter === 'all' ? 'Select a project first, then drag & drop files here' : 'Drag & drop files here, or click to browse'}
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  Supports PDF, DOCX, DOC, TXT, XLSX, CSV, YAML, JSON, Images (Max 50MB)
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-4 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Select Files
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            Documents ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-emerald-400 animate-spin mr-3" />
              <span className="text-zinc-400 text-sm">Loading documents...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="text-zinc-400 font-medium">Name</TableHead>
                    <TableHead className="text-zinc-400 font-medium">Project</TableHead>
                    <TableHead className="text-zinc-400 font-medium hidden sm:table-cell">Type</TableHead>
                    <TableHead className="text-zinc-400 font-medium hidden sm:table-cell">Size</TableHead>
                    <TableHead className="text-zinc-400 font-medium">Status</TableHead>
                    <TableHead className="text-zinc-400 font-medium hidden md:table-cell">Uploaded</TableHead>
                    <TableHead className="text-zinc-400 font-medium text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(doc => (
                    <TableRow key={doc.id} className="border-zinc-800 hover:bg-zinc-800/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <File className="w-4 h-4 text-zinc-400 shrink-0" />
                          <span className="text-sm text-white font-medium truncate max-w-[180px] sm:max-w-[250px]">{doc.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">{getProjectName(doc.projectId)}</span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span className="text-sm whitespace-nowrap">{typeIcons[doc.fileType] || '📄'} {doc.fileType}</span>
                      </TableCell>
                      <TableCell className="text-sm text-zinc-400 hidden sm:table-cell whitespace-nowrap">{formatFileSize(doc.fileSize)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[doc.status] || statusColors.PENDING}>{doc.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-zinc-400 hidden md:table-cell whitespace-nowrap">{formatDate(doc.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white" onClick={() => setPreviewDoc(doc)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-red-400" onClick={() => setDeleteDoc(doc)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-10 h-10 mx-auto text-zinc-600 mb-3" />
              <p className="text-zinc-500 text-sm">No documents found.</p>
              <p className="text-zinc-600 text-xs mt-1">
                {projectFilter === 'all' ? 'Select a project and upload documents to get started.' : 'Upload documents to this project to get started.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-700 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <File className="w-5 h-5 text-emerald-400" />
              {previewDoc?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="flex gap-4 text-sm">
              <span className="text-zinc-400">Project:</span><span className="text-white">{previewDoc ? getProjectName(previewDoc.projectId) : '-'}</span>
            </div>
            <div className="flex gap-4 text-sm">
              <span className="text-zinc-400">Type:</span><span className="text-white">{previewDoc?.fileType}</span>
            </div>
            <div className="flex gap-4 text-sm">
              <span className="text-zinc-400">Size:</span><span className="text-white">{previewDoc ? formatFileSize(previewDoc.fileSize) : '-'}</span>
            </div>
            <div className="flex gap-4 text-sm">
              <span className="text-zinc-400">Version:</span><span className="text-white">v{previewDoc?.version || 1}</span>
            </div>
            <div className="flex gap-4 text-sm">
              <span className="text-zinc-400">Status:</span>
              <Badge variant="outline" className={statusColors[previewDoc?.status || 'Pending']}>{previewDoc?.status}</Badge>
            </div>
            <div className="flex gap-4 text-sm">
              <span className="text-zinc-400">Uploaded:</span><span className="text-white">{previewDoc ? formatDate(previewDoc.createdAt) : '-'}</span>
            </div>
            {previewDoc?.contentExtracted && (
              <div className="mt-4">
                <p className="text-sm text-zinc-400 mb-2">Extracted Content:</p>
                <div className="p-4 border border-zinc-800 rounded-lg bg-zinc-800/30 text-zinc-300 text-sm max-h-48 overflow-y-auto whitespace-pre-wrap">
                  {previewDoc.contentExtracted}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteDoc} onOpenChange={() => setDeleteDoc(null)}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Document</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Are you sure you want to delete &quot;{deleteDoc?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-zinc-700 text-zinc-300">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
