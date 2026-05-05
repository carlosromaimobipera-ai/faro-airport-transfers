import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plane, Menu, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
          <div className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
            scrolled ? "bg-primary" : "bg-white/20 backdrop-blur-sm"
          )}>
            <Plane className={cn("w-5 h-5", scrolled ? "text-primary-foreground" : "text-white")} />
          </div>
          <span className={cn(
            "font-display text-lg font-bold transition-colors",
            scrolled ? "text-foreground" : "text-white"
          )}>
            Faro Transfers
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          <a href="#booking" className={cn("text-sm font-medium transition-colors hover:text-primary", scrolled ? "text-foreground" : "text-white/90")}>
            Reservar
          </a>
          <Link to="/admin" className={cn("text-sm font-medium transition-colors hover:text-primary", scrolled ? "text-foreground" : "text-white/90")}>
            Gestão
          </Link>
          <a href="#booking">
            <Button size="sm" className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold">
              Reservar Agora
            </Button>
          </a>
        </div>

        {/* Mobile menu toggle */}
        <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen
            ? <X className={scrolled ? "text-foreground" : "text-white"} />
            : <Menu className={scrolled ? "text-foreground" : "text-white"} />
          }
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-background border-t border-border p-4 space-y-3">
          <a href="#booking" className="block text-sm font-medium py-2" onClick={() => setMenuOpen(false)}>Reservar</a>
          <Link to="/admin" className="block text-sm font-medium py-2" onClick={() => setMenuOpen(false)}>Gestão</Link>
        </div>
      )}
    </nav>
  );
}