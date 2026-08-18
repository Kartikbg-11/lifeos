'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  CalendarDays,
  Dumbbell,
  BookOpen,
  GraduationCap,
  Moon,
  Utensils,
  Droplets,
  Receipt,
  CheckSquare,
  Target,
  BarChart3,
  Calendar,
  BookMarked,
  Settings,
  X,
  Zap,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Today', href: '/today', icon: <CalendarDays className="w-5 h-5" /> },
  { label: 'Fitness', href: '/fitness', icon: <Dumbbell className="w-5 h-5" /> },
  { label: 'Learning', href: '/learning', icon: <BookOpen className="w-5 h-5" /> },
  { label: 'Interview Prep', href: '/interview', icon: <GraduationCap className="w-5 h-5" /> },
  { label: 'Sleep', href: '/sleep', icon: <Moon className="w-5 h-5" /> },
  { label: 'Food & Nutrition', href: '/food', icon: <Utensils className="w-5 h-5" /> },
  { label: 'Water', href: '/water', icon: <Droplets className="w-5 h-5" /> },
  { label: 'Expenses', href: '/expenses', icon: <Receipt className="w-5 h-5" /> },
  { label: 'Habits', href: '/habits', icon: <CheckSquare className="w-5 h-5" /> },
  { label: 'Goals', href: '/goals', icon: <Target className="w-5 h-5" /> },
  { label: 'Analytics', href: '/analytics', icon: <BarChart3 className="w-5 h-5" /> },
  { label: 'Calendar', href: '/calendar', icon: <Calendar className="w-5 h-5" /> },
  { label: 'Journal', href: '/journal', icon: <BookMarked className="w-5 h-5" /> },
  { label: 'Settings', href: '/settings', icon: <Settings className="w-5 h-5" /> },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-72 bg-white border-r border-gray-200 shadow-xl transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo / Brand */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <Link href="/" className="flex items-center gap-2.5" onClick={onClose}>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 tracking-tight">
                LIFE<span className="text-emerald-600">OS</span>
              </span>
            </Link>
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const isActive =
                  item.href === '/'
                    ? pathname === '/'
                    : pathname.startsWith(item.href);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      )}
                    >
                      <span
                        className={cn(
                          'transition-colors',
                          isActive ? 'text-emerald-600' : 'text-gray-400'
                        )}
                      >
                        {item.icon}
                      </span>
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center">
              LIFEOS v1.0 • Personal Growth Tracker
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
export { navItems };
