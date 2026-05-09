import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

import { MapPin, Plane, Globe } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';

export default function LocationSelector({ label, value, onChange, icon: Icon = MapPin, excludeId, allowedIds }) {
  const { lang } = useLang();

  const available = [];

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground/80 flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" />
        {label}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-12 bg-card border-border/60 hover:border-primary/40 transition-colors">
          <SelectValue placeholder={t(lang, 'select_place')} />
        </SelectTrigger>
        <SelectContent>
          {available.length === 0 && (
            <div className="px-2 py-2 text-xs text-muted-foreground">Sem locais disponíveis</div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}