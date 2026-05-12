import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Home, BookOpen, Car, Settings } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const SCROLL_POSITIONS = {};

export default function BottomTabBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoadingAuth } = useAuth();
  const { lang } = useLang();
  const [mounted, setMounted] = useState(false);

  const { data: driverRecord } = useQuery({
    queryKey: ['driver-self', user?.email],
    queryFn: () => base44.entities.Driver.filter({ email: user.email }),
    enabled: !!user?.email && user?.role !== 'admin',
    select: (data) => data?.[0] || null,
    staleTime: 5 * 60 * 1000,
  });

  const isDriver = user?.role === 'driver' || !!driverRecord;

  const tabs = [
    { path: '/', icon: Home, labelKey: 'tab_home' },
    { path: '/area-cliente', icon: BookOpen, labelKey: 'tab_reservations' },
    ...(isDriver ? [{ path: '/driver', icon: Car, labelKey: 'tab_driver' }] : []),
    ...(user?.role === 'admin' ? [{ path: '/admin', icon: Settings, labelKey: 'tab_management' }] : []),
  ];

  const handleTabClick = (e, path) => {
    e.preventDefault();
    navigate(path);
  };

  const isActive = (path) => location.pathname === path;

  // Save scroll position before navigating away
  useEffect(() => {
    const scrollableParent = document.querySelector('.route-content');
    if (scrollableParent && mounted) {
      SCROLL_POSITIONS[location.pathname] = scrollableParent.scrollTop;
    }
  }, [location.pathname, mounted]);

  // Restore scroll position when entering a route
  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => {
      const scrollableParent = document.querySelector('.route-content');
      const savedPosition = SCROLL_POSITIONS[location.pathname] || 0;
      if (scrollableParent) {
        scrollableParent.scrollTop = savedPosition;
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border safe-area-bottom z-40">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => (
          <button
            key={tab.path}
            onClick={(e) => handleTabClick(e, tab.path)}
            className={`flex flex-col items-center justify-center flex-1 h-16 transition-colors min-h-[44px] ${
              isActive(tab.path)
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">{t(lang, tab.labelKey)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}