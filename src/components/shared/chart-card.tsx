'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ChartCardProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  children: React.ReactNode;
  className?: string;
  loading?: boolean;
  empty?: boolean;
  emptyMessage?: string;
}

export function ChartCard({
  title,
  description,
  action,
  children,
  className,
  loading = false,
  empty = false,
  emptyMessage = 'No data available',
}: ChartCardProps) {
  return (
    <Card className={cn('rounded-2xl border-0 shadow-sm bg-white', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-gray-900">
              {title}
            </CardTitle>
            {description && (
              <p className="text-xs text-gray-500 mt-1">{description}</p>
            )}
          </div>
          {action && (
            <Button
              variant="ghost"
              size="sm"
              onClick={action.onClick}
              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
            >
              {action.label}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
          </div>
        ) : empty ? (
          <div className="h-64 flex flex-col items-center justify-center text-gray-400">
            <p className="text-sm">{emptyMessage}</p>
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

interface StatsGridProps {
  stats: {
    label: string;
    value: string | number;
    change?: number;
    icon?: React.ReactNode;
  }[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export function StatsGrid({ stats, columns = 4, className }: StatsGridProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-4', gridCols[columns], className)}>
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-2 mb-2">
            {stat.icon && (
              <span className="text-gray-400">{stat.icon}</span>
            )}
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {stat.label}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">
              {stat.value}
            </span>
            {stat.change !== undefined && (
              <span
                className={cn(
                  'text-xs font-medium',
                  stat.change >= 0 ? 'text-emerald-600' : 'text-red-600'
                )}
              >
                {stat.change >= 0 ? '+' : ''}
                {stat.change}%
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
