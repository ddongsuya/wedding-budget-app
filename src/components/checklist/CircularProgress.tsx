import React from 'react';

interface CircularProgressProps {
  percentage: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const SIZES = {
  sm: { width: 60, radius: 24, stroke: 5 },
  md: { width: 80, radius: 32, stroke: 6 },
  lg: { width: 100, radius: 40, stroke: 7 },
};

export const CircularProgress: React.FC<CircularProgressProps> = ({ 
  percentage, 
  size = 'md',
  showLabel = true 
}) => {
  const { width, radius, stroke } = SIZES[size];
  const center = width / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(percentage, 100) / 100) * circumference;

  return (
    <div className="relative" style={{ width, height: width }}>
      <svg className="transform -rotate-90" width={width} height={width}>
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="#e7e5e4"
          strokeWidth={stroke}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="url(#progressGradient)"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fb7185" />
            <stop offset="100%" stopColor="#f43f5e" />
          </linearGradient>
        </defs>
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-bold text-rose-500 ${
            size === 'sm' ? 'text-sm' : size === 'md' ? 'text-lg' : 'text-xl'
          }`}>
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  );
};

export default CircularProgress;
