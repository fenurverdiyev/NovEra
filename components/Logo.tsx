import React from 'react';

export const Logo: React.FC<{ className?: string, isLarge?: boolean }> = ({ className, isLarge = false }) => {
  const textSize = isLarge ? 'text-7xl md:text-8xl' : 'text-2xl';

  return (
    <div className={`font-bold tracking-wider ${className}`}>
      <h1 className={`${textSize} relative`}>
        <span 
          className="bg-gradient-to-r from-blue-300 via-white to-white text-transparent bg-clip-text"
          style={{ filter: 'brightness(1.2)'}}
        >
          NovEra
        </span>
        {/* Sparkle */}
        <span 
          className="absolute text-white text-[0.4em]"
          style={{
            top: '0.1em',
            right: '-0.2em',
            textShadow: '0 0 8px #fff, 0 0 15px var(--color-accent), 0 0 20px var(--color-accent)'
          }}
        >
          &#x2727;
        </span>
      </h1>
      {isLarge && (
        <p className="text-center text-text-sub mt-2 text-lg">
          Yeni dövr burada başlayır.
        </p>
      )}
    </div>
  );
};
