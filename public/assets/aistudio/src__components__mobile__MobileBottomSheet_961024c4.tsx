import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface MobileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const MobileBottomSheet: React.FC<MobileBottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startYRef.current === null) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - startYRef.current;

    // If dragging downwards from top of sheet, allow dismiss
    if (deltaY > 80 && sheetRef.current) {
      startYRef.current = null;
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Dimmed glass backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-up Liquid Glass Sheet */}
      <div
        ref={sheetRef}
        data-testid="mobile-bottom-sheet"
        className="relative z-10 w-full max-h-[75vh] min-h-[45vh] bg-[#141418]/95 backdrop-blur-2xl border-t border-white/15 rounded-t-2xl shadow-[0_-12px_40px_rgba(0,0,0,0.7)] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-250 pb-[env(safe-area-inset-bottom)]"
      >
        {/* Top Handle / Grab Bar */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          className="w-full pt-2 pb-1.5 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing shrink-0 select-none"
        >
          <div className="w-10 h-1 bg-white/30 rounded-full" />
        </div>

        {/* Sheet Header */}
        <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between gap-3 shrink-0 select-none">
          <div className="min-w-0">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#f4f4f5] truncate">
              {title}
            </h3>
            {subtitle && (
              <p className="text-[10px] text-[#71717a] truncate">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar painel"
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-[#f4f4f5] flex items-center justify-center cursor-pointer transition-transform"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Sheet Content */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-2.5">
          {children}
        </div>
      </div>
    </div>
  );
};
