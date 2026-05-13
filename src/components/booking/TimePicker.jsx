import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const minutes = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

export default function TimePicker({ value, onChange }) {
  const [hh, mm] = value ? value.split(':') : ['', ''];

  const handleHour = (h) => {
    onChange(`${h}:${mm || '00'}`);
  };

  const handleMinute = (m) => {
    onChange(`${hh || '00'}:${m}`);
  };

  return (
    <div className="flex gap-2">
      <Select value={hh || ''} onValueChange={handleHour}>
        <SelectTrigger className="h-12 flex-1">
          <SelectValue placeholder="HH" />
        </SelectTrigger>
        <SelectContent>
          {hours.map(h => (
            <SelectItem key={h} value={h}>{h}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="flex items-center text-muted-foreground font-bold">:</span>
      <Select value={mm || ''} onValueChange={handleMinute}>
        <SelectTrigger className="h-12 flex-1">
          <SelectValue placeholder="MM" />
        </SelectTrigger>
        <SelectContent>
          {minutes.map(m => (
            <SelectItem key={m} value={m}>{m}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}