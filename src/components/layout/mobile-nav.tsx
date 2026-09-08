'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Dumbbell,
  BookOpen,
  GraduationCap,
  Droplets,
  CheckSquare,
} from 'lucide-react';

interface MobileNavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const mobileNavItems: MobileNavItem[] = [
  { label: 'Home', href: '/', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Fitness', href: '/fitness', icon: <Dumbbell className="w-5 h-5" /> },
  { label: 'Learn', href: '/learning', icon: <BookOpen className="w-5 h-5" /> },
  { label: 'Interview', href: '/interview', icon: <GraduationCap className="w-5 h-5" /> },
  { label: 'Water', href: '/water', icon: <Droplets className="w-5 h-5" /> },
  { label: 'Habits', href: '/habits', icon: <CheckSquare className="w-5 h-5" /> },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white/95 backdrop-blur-md border-t border-gray-200 safe-area-pb">
      <div className="grid grid-cols-3 gap-1 px-2 py-2 min-[420px]:grid-cols-6">
        {mobileNavItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex min-w-0 flex-col items-center gap-1 px-1 py-1.5 rounded-xl transition-all duration-200',
                isActive
                  ? 'text-emerald-700'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <div
                className={cn(
                  'p-1.5 rounded-lg transition-colors',
                  isActive && 'bg-emerald-50'
                )}
              >
                {item.icon}
              </div>
              <span className="text-xs font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default MobileNav;
