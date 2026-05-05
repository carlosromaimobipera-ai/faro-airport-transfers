import React from 'react';
import { useLang } from '@/lib/LanguageContext';
import { languages } from '@/lib/i18n';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LanguageSwitcher({ dark = false }) {
  const { lang, setLang } = useLang();
  const current = languages.find(l => l.code === lang) || languages[1];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "gap-1.5 px-2 h-9 font-medium",
            dark
              ? "text-white/90 hover:text-white hover:bg-white/10"
              : "text-foreground hover:bg-muted"
          )}
        >
          <span className="text-base leading-none">{current.flag}</span>
          <span className="text-xs hidden sm:inline">{current.label}</span>
          <ChevronDown className="w-3 h-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {languages.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => setLang(l.code)}
            className={cn(
              "flex items-center gap-2.5 cursor-pointer",
              lang === l.code && "bg-primary/10 text-primary font-semibold"
            )}
          >
            <span className="text-base">{l.flag}</span>
            <span className="text-sm">{l.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}