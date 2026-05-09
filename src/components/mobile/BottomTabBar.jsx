import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, Car, Settings } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function BottomTabBar() {
  const location = useLocation();
  const { user } = useAuth();

  const tabs = [
    { path: '/', icon: Home, label: 'Início' },
    { path: '/area-cliente', icon: BookOpen, label: 'Minhas Reservas' },
    ...(user?.role === 'driver' ? [{ path: '/driver', icon: Car, label: 'Motorista' }] : []),
    ...(user?.role === 'admin' ? [{ path: '/admin', icon: Settings, label: 'Gestão' }] : []),
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border safe-area-bottom z-40">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => (
          <Link
            key={tab.path}
            to={tab.path}
            className={`flex flex-col items-center justify-center flex-1 h-16 transition-colors min-h-[44px] ${
              isActive(tab.path)
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">{tab.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}