'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/use-auth-store';
import api from '@/services/api';
import { Sidebar } from '@/components/layout/sidebar';
import { MobileNav } from '@/components/layout/mobile-nav';
import { Header } from '@/components/layout/header';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface AuthProviderProps {
  children: React.ReactNode;
}

const authPages = ['/login', '/register'];

export function AuthProvider({ children }: AuthProviderProps) {
  const { user, setUser, setLoading, isLoading } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const isAuthPage = authPages.includes(pathname);

  const checkAuth = useCallback(async () => {
    try {
      // Skip auth check for auth pages
      if (isAuthPage) {
        setAuthChecked(true);
        setLoading(false);
        return;
      }

      setLoading(true);
      
      // Try to get current user from API
      const userData = await api.auth.getMe();
      
      if (userData && userData.id) {
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      // User is not authenticated or API error
      console.log('Auth check failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
      setAuthChecked(true);
    }
  }, [isAuthPage, setUser, setLoading]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (authChecked && !isLoading && !isAuthPage && !user) {
      router.replace('/login');
    }
  }, [authChecked, isLoading, isAuthPage, user, router]);

  // Show loading state while checking auth
  if (isLoading || !authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center animate-pulse">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
            <p className="text-sm text-gray-500">Loading LIFEOS...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show auth pages without layout
  if (isAuthPage) {
    return <>{children}</>;
  }

  // If not authenticated and not on auth page, show login
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-sm text-gray-500">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Show main app layout with sidebar
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar - Desktop */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main content */}
        <div className="flex-1 flex flex-col min-h-screen lg:min-h-0">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          
          <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}
