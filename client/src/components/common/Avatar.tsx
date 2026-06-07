import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import ContentLoader from 'react-content-loader';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

interface AvatarSkeletonProps {
  size?: number;
}

const AvatarSkeleton = ({ size = 40 }: AvatarSkeletonProps) => (
  <ContentLoader
    speed={2}
    width={size}
    height={size}
    viewBox={`0 0 ${size} ${size}`}
    backgroundColor="#333"
    foregroundColor="#444"
  >
    <circle cx={size / 2} cy={size / 2} r={size / 2} />
  </ContentLoader>
);

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: number;
  className?: string;
  onClick?: () => void;
}

const sizeClasses: Record<number, string> = {
  20: 'w-5 h-5',
  24: 'w-6 h-6',
  32: 'w-8 h-8',
  40: 'w-10 h-10',
  48: 'w-12 h-12',
  64: 'w-16 h-16',
  96: 'w-24 h-24',
  128: 'w-32 h-32',
  150: 'w-[150px] h-[150px]',
};

const Avatar = ({ src, alt, size = 40, className, onClick }: AvatarProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) {
      setLoading(false);
      return;
    }

    const img = new Image();
    img.src = src;
    img.onload = () => setLoading(false);
    img.onerror = () => {
      setLoading(false);
      setError(true);
    };
  }, [src]);

  const currentSizeClass = sizeClasses[size];
  const customStyle = !currentSizeClass ? { width: `${size}px`, height: `${size}px`, minWidth: `${size}px`, minHeight: `${size}px` } : {};

  if (loading) return <AvatarSkeleton size={size} />;

  return (
    <div
      onClick={onClick}
      style={customStyle}
      className={cn(
        'relative overflow-hidden rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0',
        currentSizeClass,
        className,
        onClick && 'cursor-pointer hover:opacity-80 transition-opacity'
      )}
    >
      {(error || !src) ? (
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 w-full h-full flex items-center justify-center">
          <User size={size * 0.6} className="text-white" />
        </div>
      ) : (
        <img
          src={src}
          alt={alt || 'User avatar'}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={() => setError(true)}
        />
      )}
    </div>
  );
};

export default Avatar;
