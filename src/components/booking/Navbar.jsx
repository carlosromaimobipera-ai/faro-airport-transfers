import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plane, Menu, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import LanguageSwitcher from './LanguageSwitcher';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { lang } = useLang();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
      scrolled
        ? "bg-background/95 backdrop-blur-md shadow-sm border-b border-border/40"
        : "bg-transparent"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img
            src="https://transfers-algarvestar.com/site/images/transfers.jpg"
            alt="Transfers Algarvestar"
            className="h-32 w-auto object-contain"
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
          <LanguageSwitcher dark={!scrolled} />
          <a href="#booking">
            <Button size="sm" className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold ml-2">
              {t(lang, 'nav_cta')}
            </Button>
          </a>
        </div>

        <div className="md:hidden flex items-center gap-1">
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
        </div>
      )}
    </nav>
  );
}