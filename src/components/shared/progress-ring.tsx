'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  children?: React.ReactNode;
  className?: string;
  color?: string;
  bgColor?: string;
  showValue?: boolean;
  valueLabel?: string;
}

export function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 8,
  children,
  className,
  color = '#10b981',
  bgColor = '#e5e7eb',
  showValue = true,
  valueLabel,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(100, Math.max(0, progress)) / 100) * circumference;

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children || (
          showValue && (
            <>
              <span className="text-2xl font-bold text-gray-900">
                {Math.round(progress)}%
              </span>
              {valueLabel && (
                <span className="text-xs text-gray-500 mt-0.5">{valueLabel}</span>
              )}
            </>
          )
        )}
      </div>
    </div>
  );
}

interface ScoreRingProps {
  score: number; // 0-100
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function ScoreRing({ score, size = 140, strokeWidth = 10, className }: ScoreRingProps) {
  const getColor = (s: number) => {
    if (s >= 80) return '#10b981'; // emerald
    if (s >= 60) return '#f59e0b'; // amber
    if (s >= 40) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  const getLabel = (s: number) => {
    if (s >= 80) return 'Excellent';
    if (s >= 60) return 'Good';
    if (s >= 40) return 'Average';
    return 'Needs Work';
  };

  const color = getColor(score);
  const label = getLabel(score);

  return (
    <ProgressRing
      progress={score}
      size={size}
      strokeWidth={strokeWidth}
      color={color}
      className={className}
    >
      <div className="flex flex-col items-center justify-center">
        <span className="text-3xl font-bold" style={{ color }}>
          {score}
        </span>
        <span className="text-xs text-gray-500">/100</span>
        <span className="text-xs font-medium mt-1" style={{ color }}>
          {label}
        </span>
      </div>
    </ProgressRing>
  );
}
