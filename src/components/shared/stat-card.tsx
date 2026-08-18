'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: string;
  className?: string;
  onClick?: () => void;
  children?: React.ReactNode;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = '#10b981',
  className,
  onClick,
  children,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        'rounded-2xl border-0 shadow-sm hover:shadow-md transition-all duration-300 bg-white',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 md:p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide truncate">
              {title}
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-1 truncate">
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}
            {trend && (
              <div
                className={cn(
                  'flex items-center gap-1 mt-2 text-xs font-medium',
                  trend.isPositive ? 'text-emerald-600' : 'text-red-600'
                )}
              >
                <span>{trend.isPositive ? '↑' : '↓'}</span>
                <span>{Math.abs(trend.value)}%</span>
                <span className="text-gray-400">vs yesterday</span>
              </div>
            )}
          </div>
          {icon && (
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${color}15` }}
            >
              {icon}
            </div>
          )}
        </div>
        {children && <div className="mt-3">{children}</div>}
      </CardContent>
    </Card>
  );
}

interface MetricCardProps {
  label: string;
  current: number;
  goal: number;
  unit?: string;
  icon: React.ReactNode;
  color?: string;
  showProgress?: boolean;
  completed?: boolean;
  className?: string;
}

export function MetricCard({
  label,
  current,
  goal,
  unit = '',
  icon,
  color = '#10b981',
  showProgress = true,
  completed,
  className,
}: MetricCardProps) {
  const percentage = Math.min(100, Math.round((current / goal) * 100));
  const isCompleted = completed ?? current >= goal;

  return (
    <Card
      className={cn(
        'rounded-2xl border-0 shadow-sm bg-white overflow-hidden',
        className
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${color}15` }}
          >
            {icon}
          </div>
          <span className="font-medium text-sm text-gray-700">{label}</span>
          {isCompleted && (
            <span className="ml-auto w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center">
              <svg
                className="w-3 h-3 text-emerald-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </span>
          )}
        </div>
        
        <div className="flex items-baseline gap-1 mb-2">
          <span className="text-xl font-bold text-gray-900">
            {current}{unit}
          </span>
          <span className="text-sm text-gray-400">/ {goal}{unit}</span>
        </div>

        {showProgress && (
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${percentage}%`,
                backgroundColor: isCompleted ? '#10b981' : color,
              }}
            />
          </div>
        )}

        <div className="mt-2 flex justify-between items-center">
          <span
            className="text-xs font-semibold"
            style={{ color: isCompleted ? '#10b981' : color }}
          >
            {percentage}%
          </span>
          {isCompleted && (
            <span className="text-xs text-emerald-600 font-medium">Complete!</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
