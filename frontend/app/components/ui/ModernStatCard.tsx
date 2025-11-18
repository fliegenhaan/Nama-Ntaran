'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';

interface ModernStatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
  gradient?: string;
}

const ModernStatCard: React.FC<ModernStatCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  subtitle,
  gradient = 'gradient-bg-1',
}) => {
  // mapping gradient ke solid colors - semua menggunakan purple
  const gradientToColor: Record<string, string> = {
    'gradient-bg-1': 'bg-purple-600',
    'gradient-bg-2': 'bg-purple-600',
    'gradient-bg-3': 'bg-purple-600',
    'gradient-bg-4': 'bg-purple-600',
    'gradient-bg-5': 'bg-purple-600',
  };

  const solidColor = gradientToColor[gradient] || 'bg-purple-600';

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-smooth cursor-pointer">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          {/* judul card dengan text gray */}
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          {/* value */}
          <h3 className="text-3xl font-bold text-gray-900 stat-number">
            {value}
          </h3>
          {/* subtitle jika ada */}
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        {/* icon dengan solid color background */}
        <div className={`${solidColor} p-3 rounded-xl shadow-md`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* trend indicator jika ada */}
      {trend && (
        <div className="flex items-center gap-1 text-sm">
          {trend.isPositive ? (
            <TrendingUp className="w-4 h-4 text-green-600" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-600" />
          )}
          <span
            className={`font-semibold ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {trend.value}%
          </span>
          <span className="text-gray-500">Dari Bulan Lalu</span>
        </div>
      )}
    </div>
  );
};

export default ModernStatCard;
