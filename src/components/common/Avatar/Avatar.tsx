import { optimizeImage } from '../../../utils/imageOptimizer';

interface AvatarProps {
  src: string | null | undefined;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
}

const sizeMap = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-lg',
};

const sizePx = {
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
};

export const Avatar = ({
  src,
  name,
  size = 'md',
  className = '',
  onClick,
}: AvatarProps) => {
  const optimizedSrc = src
    ? optimizeImage(src, {
        width: sizePx[size] * 2, // 레티나 대응
        height: sizePx[size] * 2,
        crop: 'fill',
      })
    : null;

  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '?';

  if (!optimizedSrc) {
    return (
      <div
        className={`
          ${sizeMap[size]}
          rounded-full bg-gradient-to-br from-rose-300 to-rose-400
          flex items-center justify-center text-white font-medium
          ${className}
        `}
        onClick={onClick}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={optimizedSrc}
      alt={name || 'Profile'}
      className={`${sizeMap[size]} rounded-full object-cover ${className}`}
      onClick={onClick}
    />
  );
};
