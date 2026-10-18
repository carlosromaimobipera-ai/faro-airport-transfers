import React, { useState } from 'react';
import { Trash2, Send } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { t } from '@/lib/i18n';
import { useCurrency } from '@/lib/CurrencyContext';
import { vehicleTypes, calculatePrice } from '@/lib/transferData';
import { STOP_HOURLY_RATE, stopsPrice } from '@/lib/extraServices';
import { saveRoutePlacesSelection } from '@/lib/routePlaces';

export default function RouteVisitPlanner({ selection, onChange, routeKm, initialVehicle, isSpainRoute, lang }) {
  const { formatPrice } = useCurrency();
  const [vehicle, setVehicle] = useState(
    vehicleTypes.some(v => v.id === initialVehicle) ? initialVehicle : 'sedan'
  );

  const totalHours = selection.reduce((sum, p) => sum + (parseFloat(p.hours) || 0), 0);
  const visitsTotal = stopsPrice(selection);
  const routeValue = routeKm ? calculatePrice(routeKm, vehicle, [], 0, isSpainRoute) : 0;
  const total = Math.round((routeValue + visitsTotal) * 100) / 100;

  const [sent, setSent] = useState(false);

  const updateHours = (name, value) => {
    setSent(false);
    onChange(selection.map(p => (p.name === name ? { ...p, hours: value } : p)));
  };
  const removePlace = (name) => {
    setSent(false);
    onChange(selection.filter(p => p.name !== name));
  };

  const sendToBooking = () => {
    saveRoutePlacesSelection(selection);
    setSent(true);
  };

  return (
    <Card className="border-secondary/30 shadow-lg shadow-black/5">
      <CardContent className="p-4 space-y-4">
        <div>
          <p className="font-display font-bold">{t(lang, 'rp_sel_title')}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{t(lang, 'rp_sel_sub')}</p>
        </div>

        {selection.length === 0 ? (
          <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">{t(lang, 'rp_sel_empty')}</p>
        ) : (
          <div className="space-y-2">
            {selection.map(place => (
              <div key={place.name} className="flex items-center gap-1.5">
                <span className="flex-1 text-sm font-medium truncate">{place.name}</span>
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  value={place.hours}
                  onChange={(e) => updateHours(place.name, e.target.value)}
                  className="w-14 h-9 text-sm"
                />
                <span className="text-xs text-muted-foreground">h</span>
                <span className="text-xs font-semibold text-secondary w-16 text-right">
                  {formatPrice((parseFloat(place.hours) || 0) * STOP_HOURLY_RATE)}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => removePlace(place.name)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {routeKm ? (
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">{t(lang, 'rp_vehicle')}</label>
            <Select value={vehicle} onValueChange={setVehicle}>
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {vehicleTypes.map(v => (
                  <SelectItem key={v.id} value={v.id}>{t(lang, v.nameKey)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        <div className="border-t pt-3 space-y-2 text-sm">
          {routeKm ? (
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">{t(lang, 'rp_route_value')} · {routeKm} km</span>
              <span className="font-medium">{formatPrice(routeValue)}</span>
            </div>
          ) : null}
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">
              {t(lang, 'rp_visits_value')} · {totalHours} h × {STOP_HOURLY_RATE} €
            </span>
            <span className="font-medium">{formatPrice(visitsTotal)}</span>
          </div>
          <div className="flex items-center justify-between gap-2 border-t pt-2">
            <span className="font-bold">{t(lang, 'rp_total_estimated')}</span>
            <span className="text-2xl font-bold text-primary">{formatPrice(total)}</span>
          </div>
        </div>

        <Button
          type="button"
          className="w-full gap-2"
          disabled={selection.length === 0}
          onClick={sendToBooking}
        >
          <Send className="w-4 h-4" /> {t(lang, 'rp_send')}
        </Button>

        {sent && (
          <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
            {t(lang, 'rp_sent')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}