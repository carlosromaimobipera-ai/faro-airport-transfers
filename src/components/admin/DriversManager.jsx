import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, UserCheck } from 'lucide-react';

const emptyDriver = { name: '', phone: '', email: '', vehicle_plate: '', vehicle_model: '', vehicle_type: 'sedan', active: true, notes: '' };

export default function DriversManager() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyDriver);

  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => base44.entities.Driver.list('name'),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editing
      ? base44.entities.Driver.update(editing.id, data)
      : base44.entities.Driver.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      setOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Driver.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['drivers'] }),
  });

  const openNew = () => { setEditing(null); setForm(emptyDriver); setOpen(true); };
  const openEdit = (d) => { setEditing(d); setForm({ ...d }); setOpen(true); };
  const update = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-primary" /> Motoristas
        </CardTitle>
        <Button size="sm" onClick={openNew} className="gap-1 h-8">
          <Plus className="w-3.5 h-3.5" /> Novo motorista
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {drivers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum motorista registado.</p>
        ) : (
          <div className="divide-y">
            {drivers.map(d => (
              <div key={d.id} className="flex items-center justify-between px-6 py-3">
                <div>
                  <p className="text-sm font-medium">{d.name}</p>
                  <p className="text-xs text-muted-foreground">{d.phone} {d.email ? `· ${d.email}` : ''}</p>
                  {d.vehicle_model && <p className="text-xs text-muted-foreground">{d.vehicle_model} {d.vehicle_plate ? `(${d.vehicle_plate})` : ''}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={d.active ? 'text-green-700 border-green-200 bg-green-50' : 'text-gray-500 border-gray-200 bg-gray-50'}>
                    {d.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(d)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => deleteMutation.mutate(d.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar motorista' : 'Novo motorista'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2 space-y-1">
              <Label>Nome *</Label>
              <Input value={form.name} onChange={e => update('name', e.target.value)} placeholder="Nome completo" />
            </div>
            <div className="space-y-1">
              <Label>Telefone *</Label>
              <Input value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+351..." />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input value={form.email} onChange={e => update('email', e.target.value)} placeholder="email@..." />
            </div>
            <div className="space-y-1">
              <Label>Matrícula</Label>
              <Input value={form.vehicle_plate} onChange={e => update('vehicle_plate', e.target.value)} placeholder="AA-00-AA" />
            </div>
            <div className="space-y-1">
              <Label>Modelo veículo</Label>
              <Input value={form.vehicle_model} onChange={e => update('vehicle_model', e.target.value)} placeholder="Ex: VW Caddy" />
            </div>
            <div className="space-y-1">
              <Label>Tipo veículo</Label>
              <Select value={form.vehicle_type} onValueChange={v => update('vehicle_type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sedan">Sedan</SelectItem>
                  <SelectItem value="minivan">Minivan</SelectItem>
                  <SelectItem value="minibus">Minibus</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Estado</Label>
              <Select value={form.active ? 'true' : 'false'} onValueChange={v => update('active', v === 'true')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Ativo</SelectItem>
                  <SelectItem value="false">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Notas internas</Label>
              <Input value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Notas..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate(form)} disabled={!form.name || !form.phone || saveMutation.isPending}>
              {saveMutation.isPending ? 'A guardar...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}