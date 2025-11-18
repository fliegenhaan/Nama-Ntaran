import React, { ReactNode } from 'react';

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'dark' | 'subtle' | 'light';
  hover?: boolean;
  noPadding?: boolean;
}

const GlassPanel: React.FC<GlassPanelProps> = ({
  children,
  className = '',
  variant = 'light',
  hover = false,
  noPadding = false,
}) => {
  const variantClasses = {
    default: 'glass',
    dark: 'glass-dark',
    subtle: 'glass-subtle',
    light: 'bg-white border border-gray-200 shadow-sm',
  };

  const hoverClasses = hover
    ? 'hover:shadow-xl transition-smooth hover:-translate-y-1'
    : '';

  const paddingClasses = noPadding ? '' : 'p-6';

  return (
    <div
      className={`${variantClasses[variant]} ${paddingClasses} ${hoverClasses} rounded-2xl ${className}`}
    >
      {children}
    </div>
  );
};

export default GlassPanel;
