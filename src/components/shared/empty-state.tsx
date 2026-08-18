'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
    >
      {icon && (
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4 text-gray-400">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 max-w-sm mb-4">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button onClick={onAction} className="bg-emerald-600 hover:bg-emerald-700">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

interface NoDataProps {
  message?: string;
  className?: string;
}

export function NoData({ message = 'No data available', className }: NoDataProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center py-8 text-gray-400 text-sm',
        className
      )}
    >
      {message}
    </div>
  );
}
