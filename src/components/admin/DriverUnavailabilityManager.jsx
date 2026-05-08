import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, CalendarOff } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

const empty = { driver_id: '', date_from: '', date_to: '', reason: '' };

export default function DriverUnavailabilityManager() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);

  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => base44.entities.Driver.list('name'),
  });

  const { data: unavailabilities = [] } = useQuery({
    queryKey: ['driver-unavailabilities'],
    queryFn: () => base44.entities.DriverUnavailability.list('-date_from', 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      const driver = drivers.find(d => d.id === data.driver_id);
      return base44.entities.DriverUnavailability.create({
        ...data,
        driver_name: driver?.name || '',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-unavailabilities'] });
      setOpen(false);
      setForm(empty);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.DriverUnavailability.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['driver-unavailabilities'] }),
  });

  const update = (field, val) => setForm(prev => ({ ...prev, [field]: val }));
  const canSave = form.driver_id && form.date_from && form.date_to && form.date_from <= form.date_to;

  // Group by driver for display
  const grouped = drivers.map(d => ({
    driver: d,
    periods: unavailabilities.filter(u => u.driver_id === d.id),
  })).filter(g => g.periods.length > 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarOff className="w-4 h-4 text-primary" /> Indisponibilidades
        </CardTitle>
        <Button size="sm" onClick={() => { setForm(empty); setOpen(true); }} className="gap-1 h-8">
          <Plus className="w-3.5 h-3.5" /> Nova
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {grouped.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8 px-6">
            Nenhuma indisponibilidade registada.
          </p>
        ) : (
          <div className="divide-y">
            {grouped.map(({ driver, periods }) => (
              <div key={driver.id} className="px-6 py-3">
                <p className="text-sm font-semibold mb-2">{driver.name}</p>
                <div className="space-y-1">
                  {periods.map(u => (
                    <div key={u.id} className="flex items-center justify-between bg-muted/40 rounded-lg px-3 py-2">
                      <div>
                        <span className="text-xs font-medium">
                          {format(new Date(u.date_from + 'T00:00:00'), "d MMM yyyy", { locale: pt })}
                          {u.date_from !== u.date_to && (
                            <> → {format(new Date(u.date_to + 'T00:00:00'), "d MMM yyyy", { locale: pt })}</>
                          )}
                        </span>
                        {u.reason && <span className="text-xs text-muted-foreground ml-2">· {u.reason}</span>}
                      </div>
                      <Button
                        variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:bg-red-50"
                        onClick={() => deleteMutation.mutate(u.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nova indisponibilidade</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Motorista *</Label>
              <Select value={form.driver_id} onValueChange={v => update('driver_id', v)}>
                <SelectTrigger><SelectValue placeholder="Selecionar motorista" /></SelectTrigger>
                <SelectContent>
                  {drivers.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Data início *</Label>
                <Input type="date" value={form.date_from} onChange={e => update('date_from', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Data fim *</Label>
                <Input type="date" value={form.date_to} onChange={e => update('date_to', e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Motivo</Label>
              <Input placeholder="Férias, folga, doença..." value={form.reason} onChange={e => update('reason', e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={() => createMutation.mutate(form)} disabled={!canSave || createMutation.isPending}>
              {createMutation.isPending ? 'A guardar...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}