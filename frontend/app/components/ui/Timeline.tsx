'use client';

import { LucideIcon } from 'lucide-react';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface TimelineItem {
  id: string | number;
  title: string;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  icon?: LucideIcon;
}

interface TimelineProps {
  items: TimelineItem[];
}

export default function Timeline({ items }: TimelineProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          bg: 'bg-green-100',
          border: 'border-green-500',
          icon: 'text-green-600',
          line: 'bg-green-500',
        };
      case 'pending':
        return {
          bg: 'bg-yellow-100',
          border: 'border-yellow-500',
          icon: 'text-yellow-600',
          line: 'bg-yellow-500',
        };
      case 'failed':
        return {
          bg: 'bg-red-100',
          border: 'border-red-500',
          icon: 'text-red-600',
          line: 'bg-red-500',
        };
      default:
        return {
          bg: 'bg-gray-100',
          border: 'border-gray-500',
          icon: 'text-gray-600',
          line: 'bg-gray-500',
        };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return CheckCircle;
      case 'pending':
        return Clock;
      case 'failed':
        return AlertCircle;
      default:
        return Clock;
    }
  };

  return (
    <div className="relative">
      {items.map((item, index) => {
        const colors = getStatusColor(item.status);
        const Icon = item.icon || getStatusIcon(item.status);
        const isLast = index === items.length - 1;

        return (
          <div key={item.id} className="relative pb-8">
            {!isLast && (
              <div
                className={`absolute left-6 top-12 w-0.5 h-full ${colors.line} opacity-30`}
              />
            )}
            <div className="flex items-start gap-4">
              <div
                className={`flex-shrink-0 w-12 h-12 rounded-full ${colors.bg} border-2 ${colors.border} flex items-center justify-center`}
              >
                <Icon className={`w-6 h-6 ${colors.icon}`} />
              </div>
              <div className="flex-1 bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                  <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                    {item.date}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
