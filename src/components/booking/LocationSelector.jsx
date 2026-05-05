import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { locations, getAllowedDestinations } from '@/lib/transferData';
import { MapPin, Plane, Globe } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';

export default function LocationSelector({ label, value, onChange, icon: Icon = MapPin, excludeId, allowedIds }) {
  const { lang } = useLang();

  const allowed = allowedIds ? allowedIds : locations.map(l => l.id);

  const available = locations.filter(l => l.id !== excludeId && allowed.includes(l.id));

  const faroDistrict = available.filter(l => l.district === "faro");
  const lisbonDistrict = available.filter(l => l.district === "lisboa");
  const spain = available.filter(l => l.district === "spain");

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
          {faroDistrict.length > 0 && (
            <>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Plane className="w-3 h-3" /> {t(lang, 'label_algarve')}
              </div>
              {faroDistrict.map(loc => (
                <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
              ))}
            </>
          )}
          {lisbonDistrict.length > 0 && (
            <>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mt-1">
                <MapPin className="w-3 h-3" /> {t(lang, 'label_long')}
              </div>
              {lisbonDistrict.map(loc => (
                <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
              ))}
            </>
          )}
          {spain.length > 0 && (
            <>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mt-1">
                <Globe className="w-3 h-3" /> Espanha
              </div>
              {spain.map(loc => (
                <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
              ))}
            </>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}