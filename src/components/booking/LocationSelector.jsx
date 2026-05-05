import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { locations } from '@/lib/transferData';
import { MapPin, Plane } from 'lucide-react';

export default function LocationSelector({ label, value, onChange, icon: Icon = MapPin, excludeId }) {
  const airports = locations.filter(l => l.type === 'airport' && l.id !== excludeId);
  const algarve = locations.filter(l => l.type === 'city' && l.id !== excludeId && !['lisboa', 'sevilha'].includes(l.id));
  const longDistance = locations.filter(l => ['lisboa', 'sevilha'].includes(l.id) && l.id !== excludeId);

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground/80 flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" />
        {label}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-12 bg-card border-border/60 hover:border-primary/40 transition-colors">
          <SelectValue placeholder="Selecione o local" />
        </SelectTrigger>
        <SelectContent>
          {airports.length > 0 && (
            <>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Plane className="w-3 h-3" /> Aeroportos
              </div>
              {airports.map(loc => (
                <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
              ))}
            </>
          )}
          {algarve.length > 0 && (
            <>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mt-1">
                <MapPin className="w-3 h-3" /> Algarve
              </div>
              {algarve.map(loc => (
                <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
              ))}
            </>
          )}
          {longDistance.length > 0 && (
            <>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mt-1">
                <MapPin className="w-3 h-3" /> Longa Distância
              </div>
              {longDistance.map(loc => (
                <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
              ))}
            </>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}