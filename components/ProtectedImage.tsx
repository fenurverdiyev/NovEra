import React, { useState } from 'react';
import { NewsIcon } from './Icons';

interface ProtectedImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
}

export const ProtectedImage: React.FC<ProtectedImageProps> = ({ src, alt, className }) => {
  const [hasError, setHasError] = useState(!src);

  if (hasError) {
    return (
      <div className={`flex items-center justify-center bg-bg-onyx ${className}`}>
        <NewsIcon className="w-1/3 h-1/3 text-bg-slate" />
      </div>
    );
  }

  return (
    <img
      src={src ?? ''}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setHasError(true)}
    />
  );
};