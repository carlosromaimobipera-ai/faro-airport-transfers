import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cn } from "@/lib/utils";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-center">
        <Link to="/" className="flex items-center gap-2">
          <img
            src="https://media.base44.com/images/public/69f9fe03f147edc32575e815/a7bb1f3ed_Screenshot_20260731_233856_Chrome.jpg"
            alt="Transfers Algarvestar"
            className="h-12 w-auto object-contain"
          />
        </Link>
      </div>
    </nav>
  );
}