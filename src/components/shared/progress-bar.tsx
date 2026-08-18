'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  color?: string;
  bgColor?: string;
  showLabel?: boolean;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export function ProgressBar({
  value,
  max = 100,
  className,
  color,
  bgColor,
  showLabel = true,
  label,
  size = 'md',
  animated = true,
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  const getColor = () => {
    if (color) return color;
    if (percentage >= 80) return 'bg-emerald-500';
    if (percentage >= 60) return 'bg-amber-500';
    if (percentage >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const sizes = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className={cn('w-full', className)}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && (
            <span className="text-sm font-medium text-gray-700">{label}</span>
          )}
          {showLabel && (
            <span className="text-sm text-gray-500">
              {value}/{max}
            </span>
          )}
        </div>
      )}
      <div
        className={cn(
          'w-full rounded-full overflow-hidden',
          sizes[size],
          bgColor || 'bg-gray-200'
        )}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            getColor(),
            animated && 'animate-pulse-slow'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

interface ProgressWithIconProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  unit?: string;
  goal: number;
  goalUnit?: string;
  percentage?: number;
  color?: string;
  className?: string;
}

export function ProgressWithIcon({
  icon,
  label,
  value,
  unit = '',
  goal,
  goalUnit = '',
  percentage,
  color = '#10b981',
  className,
}: ProgressWithIconProps) {
  const calcPercentage = percentage ?? Math.min(100, (value / goal) * 100);

  return (
    <div className={cn('flex flex-col', className)}>
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}15` }}
        >
          {icon}
        </div>
        <span className="font-medium text-gray-800 text-sm">{label}</span>
      </div>
      <div className="flex items-baseline gap-1 mb-1.5">
        <span className="text-lg font-bold text-gray-900">
          {value}{unit}
        </span>
        <span className="text-sm text-gray-400">/ {goal}{goalUnit}</span>
        <span className="ml-auto text-sm font-semibold" style={{ color }}>
          {Math.round(calcPercentage)}%
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${calcPercentage}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}
