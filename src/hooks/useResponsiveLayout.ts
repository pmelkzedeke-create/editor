import { useEffect, useState, useCallback } from 'react';

export type MobileDrawer =
  | 'media'
  | 'split'
  | 'text'
  | 'effects'
  | 'shapes'
  | 'audio'
  | 'inspector'
  | null;

export function useResponsiveLayout() {
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  const [activeDrawer, setActiveDrawer] = useState<MobileDrawer>(null);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setActiveDrawer(null);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const openDrawer = useCallback((drawer: MobileDrawer) => {
    setActiveDrawer(drawer);
  }, []);

  const closeDrawer = useCallback(() => {
    setActiveDrawer(null);
  }, []);

  return {
    isMobile,
    activeDrawer,
    openDrawer,
    closeDrawer,
    setActiveDrawer,
  };
}
