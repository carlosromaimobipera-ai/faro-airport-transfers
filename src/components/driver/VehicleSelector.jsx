import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Car, ChevronDown } from 'lucide-react';

const vehicleOptions = [
  { value: 'sedan',   label: 'Sedan' },
  { value: 'minivan', label: 'Minivan (VW Caddy Maxi)' },
  { value: 'minibus', label: 'Minibus (Mercedes Vito)' },
  { value: 'nenhum',  label: 'Nenhum' },
];

export default function VehicleSelector({ driver, onUpdated }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: (vehicle_type) => base44.entities.Driver.update(driver.id, { vehicle_type }),
    onSuccess: (_data, vehicle_type) => {
      queryClient.invalidateQueries({ queryKey: ['driver'] });
      onUpdated?.(vehicle_type);
    },
  });

  const current = vehicleOptions.find(v => v.value === driver.vehicle_type)?.label || driver.vehicle_type || 'Selecionar veículo';

  return (
    <Select
      value={driver.vehicle_type || undefined}
      open={open}
      onOpenChange={setOpen}
      onValueChange={(v) => { mutation.mutate(v); setOpen(false); }}
    >
      <SelectTrigger className="h-7 w-auto min-w-[140px] gap-1 border-0 bg-white/15 text-primary-foreground hover:bg-white/25 px-2 py-1 text-xs rounded-lg focus:ring-0">
        <Car className="w-3.5 h-3.5 shrink-0" />
        <SelectValue placeholder="Selecionar veículo" />
        <ChevronDown className="w-3 h-3 opacity-70" />
      </SelectTrigger>
      <SelectContent>
        {vehicleOptions.map(v => (
          <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}