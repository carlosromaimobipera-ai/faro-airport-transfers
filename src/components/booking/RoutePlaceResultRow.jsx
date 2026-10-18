import React from 'react';
import { Plus, Check, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { t } from '@/lib/i18n';
import { CATEGORIES } from '@/lib/routePlaces';

// Linha de resultado da pesquisa de locais: catálogo (com categoria) ou local do Google.
export default function RoutePlaceResultRow({ name, subtitle, category, isAdded, onToggle, lang }) {
  const cat = category ? CATEGORIES[category] : null;
  const Icon = cat?.icon || MapPin;

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/60 p-2">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${cat ? cat.chip : 'bg-muted text-muted-foreground'}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{name}</p>
        <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
      </div>
      <Button
        type="button"
        size="sm"
        variant={isAdded ? 'default' : 'outline'}
        className="gap-1.5 h-8 shrink-0"
        onClick={onToggle}
      >
        {isAdded ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
        {isAdded ? t(lang, 'rp_added') : t(lang, 'rp_add')}
      </Button>
    </div>
  );
}