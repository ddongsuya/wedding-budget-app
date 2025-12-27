import React, { memo } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface ButtonProps extends Omit<HTMLMotionProps<"button">, 'children'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  loading?: boolean;
  children?: React.ReactNode;
  fullWidth?: boolean;
  /** Accessible label for screen readers when button has only an icon */
  'aria-label'?: string;
}

export const Button: React.FC<ButtonProps> = memo(({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  icon,
  loading = false,
  fullWidth = false,
  className = '',
  disabled,
  ...props 
}) => {
  const baseStyle = `
    inline-flex items-center justify-center font-semibold rounded-xl 
    transition-all duration-200 ease-out
    focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 
    disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
    touch-feedback gpu-accelerate
  `;
  
  const variants = {
    primary: `
      bg-gradient-to-r from-rose-500 to-rose-600 text-white 
      shadow-button hover:shadow-button-hover hover:from-rose-600 hover:to-rose-700
      focus-visible:ring-rose-500 active:from-rose-700 active:to-rose-800
    `,
    secondary: `
      bg-stone-100 text-stone-700 
      hover:bg-stone-200 focus-visible:ring-stone-400 active:bg-stone-300
    `,
    outline: `
      border-2 border-stone-200 bg-white text-stone-700 
      hover:bg-stone-50 hover:border-stone-300 focus-visible:ring-stone-400 active:bg-stone-100
    `,
    ghost: `
      text-stone-600 hover:bg-stone-100 hover:text-stone-900 active:bg-stone-200
    `,
    danger: `
      bg-white border-2 border-red-200 text-red-600 
      hover:bg-red-50 hover:border-red-300 focus-visible:ring-red-500 active:bg-red-100
    `,
    gold: `
      bg-gradient-to-r from-gold-500 to-gold-600 text-white 
      shadow-[0_2px_4px_rgba(212,164,74,0.3)] hover:shadow-[0_4px_12px_rgba(212,164,74,0.4)]
      hover:from-gold-600 hover:to-gold-700 focus-visible:ring-gold-500
    `,
  };

  // Ensure minimum 44px touch target height for accessibility
  const sizes = {
    sm: "text-xs px-3.5 py-2 gap-1.5 min-h-[40px]",
    md: "text-sm px-5 py-2.5 gap-2 min-h-[44px]",
    lg: "text-base px-6 py-3 gap-2.5 min-h-[48px]"
  };

  return (
    <motion.button 
      whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
      transition={{ duration: 0.1 }}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading}
      aria-disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : icon}
      {children}
    </motion.button>
  );
});

Button.displayName = 'Button';