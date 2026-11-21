import React, { useState } from 'react';
import { ImageOff, WifiOff, Eye } from 'lucide-react';
import { formatDataSize } from '../utils/format';

interface SmartMediaProps {
  src?: string;
  alt: string;
  sizeKb?: number;
  freeMode: boolean;
  className?: string;
  containerClassName?: string;
  aspectClass?: string;
  compact?: boolean;
  onUnlockCost?: (kb: number) => void;
}

export const SmartMedia: React.FC<SmartMediaProps> = ({
  src,
  alt,
  sizeKb = 240,
  freeMode,
  className = 'w-full h-full object-cover',
  containerClassName = '',
  aspectClass = 'aspect-[4/3]',
  compact = false,
  onUnlockCost,
}) => {
  const [unlockedInFreeMode, setUnlockedInFreeMode] = useState(false);
  const [hasError, setHasError] = useState(false);

  if (!src) return null;

  if (freeMode && !unlockedInFreeMode) {
    return (
      <div
        className={`relative flex flex-col items-center justify-center bg-slate-100 border border-slate-200 text-slate-700 px-4 py-6 text-center ${aspectClass} ${containerClassName}`}
      >
        <WifiOff className="w-5 h-5 text-slate-500 mb-2" aria-hidden="true" />
        <p className={`font-medium text-slate-800 ${compact ? 'text-xs' : 'text-sm'}`}>
          Photo hidden in Free Mode
        </p>
        <p className="text-xs text-slate-500 mt-0.5 max-w-[240px] truncate">{alt}</p>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setUnlockedInFreeMode(true);
            onUnlockCost?.(sizeKb);
          }}
          className="mt-3 inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 active:scale-[0.98] transition-all whitespace-nowrap shrink-0"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Use Data ({formatDataSize(sizeKb)})</span>
        </button>
      </div>
    );
  }

  if (hasError) {
    return (
      <div
        className={`relative flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500 p-4 text-center ${aspectClass} ${containerClassName}`}
      >
        <ImageOff className="w-6 h-6 mb-1.5 text-slate-400" aria-hidden="true" />
        <span className="text-xs font-medium text-slate-600 line-clamp-2">{alt}</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-slate-100 ${aspectClass} ${containerClassName}`}>
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
        className={className}
      />
    </div>
  );
};
