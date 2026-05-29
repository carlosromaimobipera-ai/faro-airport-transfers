import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Zap, Plus, Pencil, Trash2, AlertCircle } from 'lucide-react';

const RULE_TYPES = [
  { value: 'season',       label: 'Época / Período', icon: '📅' },
  { value: 'weekday',      label: 'Dia da Semana',   icon: '📆' },
  { value: 'vehicle',      label: 'Tipo de Veículo', icon: '🚗' },
  { value: 'route_region', label: 'Região da Rota',  icon: '🗺️' },
];

const WEEKDAYS = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
];

const VEHICLE_TYPES = [
  { value: 'sedan',   label: 'Sedan' },
  { value: 'minivan', label: 'Minivan' },
  { value: 'minibus', label: 'Minibus' },
];

const ROUTE_REGIONS = [
  { value: 'all',           label: 'Todas as rotas' },
  { value: 'algarve_local', label: 'Algarve (local)' },
  { value: 'lisbon',        label: 'Lisboa' },
  { value: 'spain',         label: 'Espanha' },
];

const EMPTY_RULE = {
  name: '',
  rule_type: 'season',
  multiplier: 1.2,
  date_from: '',
  date_to: '',
  weekdays: [],
  vehicle_types: [],
  route_region: 'all',
  active: true,
  priority: 0,
  description: '',
};

function multiplierLabel(m) {
  const pct = Math.round((m - 1) * 100);
  if (pct > 0) return `+${pct}%`;
  if (pct < 0) return `${pct}%`;
  return '0%';
}

function multiplierColor(m) {
  if (m > 1)  return 'bg-red-100 text-red-700 border-red-200';
  if (m < 1)  return 'bg-green-100 text-green-700 border-green-200';
  return 'bg-gray-100 text-gray-700';
}

function ruleDescription(rule) {
  const parts = [];
  if (rule.rule_type === 'season' && rule.date_from && rule.date_to)
    parts.push(`${rule.date_from} → ${rule.date_to}`);
  if (rule.rule_type === 'weekday' && rule.weekdays?.length)
    parts.push(rule.weekdays.map(d => WEEKDAYS.find(w => w.value === d)?.label).join(', '));
  if (rule.vehicle_types?.length)
    parts.push(rule.vehicle_types.join(', '));
  if (rule.route_region && rule.route_region !== 'all')
    parts.push(ROUTE_REGIONS.find(r => r.value === rule.route_region)?.label);
  return parts.join(' · ') || 'Sem restrições';
}

export default function PriceRulesManager() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null); // null = new rule
  const [form, setForm] = useState(EMPTY_RULE);

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['price-rules'],
    queryFn: () => base44.entities.PriceRule.list('priority', 200),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editing
      ? base44.entities.PriceRule.update(editing.id, data)
      : base44.entities.PriceRule.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-rules'] });
      setOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PriceRule.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['price-rules'] }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }) => base44.entities.PriceRule.update(id, { active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['price-rules'] }),
  });

  const openNew = () => { setEditing(null); setForm(EMPTY_RULE); setOpen(true); };
  const openEdit = (rule) => { setEditing(rule); setForm({ ...rule }); setOpen(true); };

  const toggleWeekday = (day) => {
    setForm(prev => ({
      ...prev,
      weekdays: prev.weekdays.includes(day)
        ? prev.weekdays.filter(d => d !== day)
        : [...prev.weekdays, day],
    }));
  };

  const toggleVehicle = (v) => {
    setForm(prev => ({
      ...prev,
      vehicle_types: prev.vehicle_types.includes(v)
        ? prev.vehicle_types.filter(x => x !== v)
        : [...prev.vehicle_types, v],
    }));
  };

  const handleSave = () => {
    const data = { ...form, multiplier: parseFloat(form.multiplier) || 1, priority: parseInt(form.priority) || 0 };
    saveMutation.mutate(data);
  };

  const activeRules = rules.filter(r => r.active);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" /> Regras de Preço Dinâmico
            </CardTitle>
            <Button size="sm" onClick={openNew} className="gap-1.5">
              <Plus className="w-4 h-4" /> Nova Regra
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            As regras multiplicam o preço calculado. Quando várias regras se aplicam, os multiplicadores somam-se ao base 1.
            Ex: +20% época + +10% fim de semana = preço × 1.30.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground text-sm">A carregar...</div>
          ) : rules.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto opacity-40" />
              <p className="text-muted-foreground text-sm">Nenhuma regra criada.</p>
              <p className="text-xs text-muted-foreground">Os preços são calculados com as tarifas base por km.</p>
            </div>
          ) : (
            <div className="divide-y">
              {rules.sort((a, b) => b.priority - a.priority).map(rule => (
                <div key={rule.id} className={`flex items-center gap-3 px-5 py-3 ${!rule.active ? 'opacity-50' : ''}`}>
                  <div className="text-lg w-6 shrink-0">
                    {RULE_TYPES.find(t => t.value === rule.rule_type)?.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{rule.name}</p>
                      <Badge variant="outline" className={`text-xs ${multiplierColor(rule.multiplier)}`}>
                        {multiplierLabel(rule.multiplier)}
                      </Badge>
                      {rule.priority > 0 && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                          P{rule.priority}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{ruleDescription(rule)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={rule.active}
                      onCheckedChange={(v) => toggleMutation.mutate({ id: rule.id, active: v })}
                    />
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(rule)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="icon" variant="ghost" className="h-8 w-8 text-destructive/70 hover:text-destructive"
                      onClick={() => deleteMutation.mutate(rule.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active rules summary */}
      {activeRules.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-blue-800 mb-2">
              {activeRules.length} regra(s) ativa(s) neste momento
            </p>
            <div className="flex flex-wrap gap-2">
              {activeRules.map(r => (
                <Badge key={r.id} variant="outline" className="bg-white text-blue-700 border-blue-200 text-xs">
                  {r.name} {multiplierLabel(r.multiplier)}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit / Create Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Regra' : 'Nova Regra de Preço'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Nome da regra *</Label>
              <Input
                placeholder="Ex: Alta Temporada Verão"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tipo de regra *</Label>
                <Select value={form.rule_type} onValueChange={v => setForm(p => ({ ...p, rule_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RULE_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.icon} {t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Multiplicador *</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number" step="0.01" min="0.1" max="5"
                    value={form.multiplier}
                    onChange={e => setForm(p => ({ ...p, multiplier: e.target.value }))}
                    className="h-9"
                  />
                  <span className={`text-xs font-bold px-2 py-1 rounded ${multiplierColor(parseFloat(form.multiplier) || 1)}`}>
                    {multiplierLabel(parseFloat(form.multiplier) || 1)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">1.0 = sem alteração · 1.2 = +20% · 0.9 = -10%</p>
              </div>
            </div>

            {/* Season dates */}
            {form.rule_type === 'season' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Data de início</Label>
                  <Input type="date" value={form.date_from} onChange={e => setForm(p => ({ ...p, date_from: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Data de fim</Label>
                  <Input type="date" value={form.date_to} onChange={e => setForm(p => ({ ...p, date_to: e.target.value }))} />
                </div>
              </div>
            )}

            {/* Weekdays */}
            {form.rule_type === 'weekday' && (
              <div className="space-y-1.5">
                <Label>Dias da semana</Label>
                <div className="flex gap-2 flex-wrap">
                  {WEEKDAYS.map(d => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => toggleWeekday(d.value)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all min-h-0 min-w-0 h-auto ${
                        form.weekdays.includes(d.value)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background border-border text-foreground hover:bg-muted'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Vehicle types */}
            <div className="space-y-1.5">
              <Label>Veículos afetados <span className="text-muted-foreground font-normal">(vazio = todos)</span></Label>
              <div className="flex gap-2">
                {VEHICLE_TYPES.map(v => (
                  <button
                    key={v.value}
                    type="button"
                    onClick={() => toggleVehicle(v.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all min-h-0 min-w-0 h-auto ${
                      form.vehicle_types.includes(v.value)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background border-border text-foreground hover:bg-muted'
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Route region */}
            <div className="space-y-1.5">
              <Label>Região da rota</Label>
              <Select value={form.route_region || 'all'} onValueChange={v => setForm(p => ({ ...p, route_region: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROUTE_REGIONS.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Prioridade</Label>
                <Input
                  type="number" min="0" max="100"
                  value={form.priority}
                  onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                  className="h-9"
                />
                <p className="text-xs text-muted-foreground">Maior = aplica por cima</p>
              </div>
              <div className="space-y-1.5">
                <Label>Estado</Label>
                <div className="flex items-center gap-2 pt-2">
                  <Switch checked={form.active} onCheckedChange={v => setForm(p => ({ ...p, active: v }))} />
                  <span className="text-sm">{form.active ? 'Ativa' : 'Inativa'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Notas internas</Label>
              <Input
                placeholder="Descrição ou motivo desta regra..."
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saveMutation.isPending || !form.name || !form.multiplier}>
                {saveMutation.isPending ? 'A guardar...' : 'Guardar Regra'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}