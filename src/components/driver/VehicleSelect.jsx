import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { vehicleTypes } from '@/lib/transferData';

const vehicleLabel = { sedan: 'Sedan', premium: 'Premium', minivan: 'Minivan', minibus: 'Minibus' };

export default function VehicleSelect({ value, onChange }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
      <SelectContent>
        {vehicleTypes.map(v => (
          <SelectItem key={v.id} value={v.id}>{vehicleLabel[v.id] || v.id}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}