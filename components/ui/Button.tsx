import React, { memo } from 'react';
import { motion } from 'framer-motion';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = memo(({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  icon,
  loading = false,
  className = '',
  disabled,
  ...props 
}) => {
  const baseStyle = "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed touch-feedback gpu-accelerate";
  
  const variants = {
    primary: "bg-rose-500 text-white hover:bg-rose-600 shadow-sm shadow-rose-200 focus:ring-rose-500 active:bg-rose-700",
    secondary: "bg-stone-100 text-stone-700 hover:bg-stone-200 focus:ring-stone-500 active:bg-stone-300",
    outline: "border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 focus:ring-stone-400 active:bg-stone-100",
    ghost: "text-stone-500 hover:bg-stone-100 hover:text-stone-900 active:bg-stone-200",
    danger: "bg-white border border-red-200 text-red-600 hover:bg-red-50 focus:ring-red-500 active:bg-red-100"
  };

  const sizes = {
    sm: "text-xs px-3 py-1.5 gap-1.5",
    md: "text-sm px-4 py-2.5 gap-2",
    lg: "text-base px-6 py-3 gap-2.5"
  };

  return (
    <motion.button 
      whileTap={{ scale: disabled || loading ? 1 : 0.96 }}
      transition={{ duration: 0.1 }}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : icon}
      {children}
    </motion.button>
  );
});

Button.displayName = 'Button';