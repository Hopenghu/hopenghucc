/**
 * Card - 統一的卡片組件
 * 提供一致的容器樣式
 */

import React from 'react';
import { motion } from 'framer-motion';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hover = false,
  onClick,
  padding = 'md',
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-6',
  };
  
  const baseClasses = 'bg-white rounded-2xl border border-slate-100 shadow-sm';
  const hoverClasses = hover || onClick ? 'hover:shadow-lg hover:border-blue-200 transition-all duration-300 cursor-pointer' : '';
  const classes = `${baseClasses} ${paddingClasses[padding]} ${hoverClasses} ${className}`;
  
  const Component = onClick ? motion.div : 'div';
  const motionProps = onClick ? {
    whileHover: { scale: 1.01 },
    whileTap: { scale: 0.99 },
    onClick,
  } : {};
  
  return (
    <Component className={classes} {...motionProps}>
      {children}
    </Component>
  );
};

export default Card;

