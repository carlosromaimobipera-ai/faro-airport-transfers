import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plane, Menu, X, Car, LogIn, LogOut, User } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import LanguageSwitcher from './LanguageSwitcher';
import CurrencySwitcher from './CurrencySwitcher';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import { base44 } from '@/api/base44Client';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const { lang } = useLang();

  useEffect(() => {
    base44.auth.isAuthenticated().then(async (authed) => {
      if (authed) {
        const me = await base44.auth.me();
        setUser(me);
      }
    });
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav style={{ top: 'env(safe-area-inset-top, 0px)' }} className={cn(
      "fixed left-0 right-0 z-50 transition-all duration-300",
      scrolled
        ? "bg-background/95 backdrop-blur-md shadow-sm border-b border-border/40"
        : "bg-transparent"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-end md:justify-between">
        <Link to="/" className="hidden md:flex items-center gap-2">
          <img
            src="https://media.base44.com/images/public/69f9fe03f147edc32575e815/logo.png"
            alt="Transfers Algarvestar"
            className="h-7 w-auto object-contain"
          />
        </Link>

        <div className="hidden md:flex items-center gap-2">
          <a href="#booking" className={cn("text-sm font-medium transition-colors hover:text-primary px-3 py-2", scrolled ? "text-foreground" : "text-white/90")}>
            {t(lang, 'nav_book')}
          </a>
          <Link to="/admin" className={cn("text-sm font-medium transition-colors hover:text-primary px-3 py-2", scrolled ? "text-foreground" : "text-white/90")}>
            {t(lang, 'nav_manage')}
          </Link>
          <Link to="/area-cliente" className={cn("text-sm font-medium transition-colors hover:text-primary px-3 py-2", scrolled ? "text-foreground" : "text-white/90")}>
            {t(lang, 'nav_myreservations')}
          </Link>
          <Link to="/driver" className={cn("flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary px-3 py-2", scrolled ? "text-foreground" : "text-white/90")}>
            <Car className="w-4 h-4" /> {t(lang, 'nav_drivers')}
          </Link>
          <LanguageSwitcher dark={!scrolled} />
          <CurrencySwitcher />
          {user ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => base44.auth.logout('/')}
              className={cn("gap-1.5 ml-2", scrolled ? "text-foreground" : "text-white/90 hover:text-white hover:bg-white/10")}
            >
              <LogOut className="w-4 h-4" /> {t(lang, 'customer_logout')}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => base44.auth.redirectToLogin(window.location.pathname)}
              className={cn("gap-1.5 ml-2", scrolled ? "text-foreground" : "text-white/90 hover:text-white hover:bg-white/10")}
            >
              <LogIn className="w-4 h-4" /> Login
            </Button>
          )}
          <a href="#booking">
            <Button size="sm" className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold ml-1">
              {t(lang, 'nav_cta')}
            </Button>
          </a>
        </div>

        <div className="md:hidden flex items-center gap-1 ml-auto pr-2">
          <CurrencySwitcher />
          <LanguageSwitcher dark={!scrolled} />
          <button onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen
              ? <X className={scrolled ? "text-foreground" : "text-white"} />
              : <Menu className={scrolled ? "text-foreground" : "text-white"} />
            }
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-background border-t border-border p-4 space-y-3">
          <a href="#booking" className="block text-sm font-medium py-2" onClick={() => setMenuOpen(false)}>{t(lang, 'nav_book')}</a>
          <Link to="/admin" className="block text-sm font-medium py-2" onClick={() => setMenuOpen(false)}>{t(lang, 'nav_manage')}</Link>
          <Link to="/area-cliente" className="block text-sm font-medium py-2" onClick={() => setMenuOpen(false)}>{t(lang, 'nav_myreservations')}</Link>
          <Link to="/driver" className="flex items-center gap-2 text-sm font-medium py-2" onClick={() => setMenuOpen(false)}>
            <Car className="w-4 h-4" /> {t(lang, 'nav_drivers')}
          </Link>
          {user ? (
            <button
              onClick={() => base44.auth.logout('/')}
              className="flex items-center gap-2 text-sm font-medium py-2 text-destructive"
            >
              <LogOut className="w-4 h-4" /> {t(lang, 'customer_logout')}
            </button>
          ) : (
            <button
              onClick={() => base44.auth.redirectToLogin(window.location.pathname)}
              className="flex items-center gap-2 text-sm font-medium py-2 text-primary"
            >
              <LogIn className="w-4 h-4" /> Login
            </button>
          )}
        </div>
      )}
    </nav>
  );
}