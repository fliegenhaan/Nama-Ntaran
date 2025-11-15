import React, { ReactNode } from 'react';

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'dark' | 'subtle';
  hover?: boolean;
  noPadding?: boolean;
}

const GlassPanel: React.FC<GlassPanelProps> = ({
  children,
  className = '',
  variant = 'default',
  hover = false,
  noPadding = false,
}) => {
  const variantClasses = {
    default: 'glass',
    dark: 'glass-dark',
    subtle: 'glass-subtle',
  };

  const hoverClasses = hover
    ? 'hover:shadow-glow-lg transition-smooth hover:-translate-y-1'
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
