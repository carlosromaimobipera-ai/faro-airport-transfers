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
import { Plus, Pencil, Trash2, UserCheck, Eye, EyeOff, Loader2, KeyRound, AlertCircle } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const emptyDriver = { name: '', phone: '', email: '', app_password: '', vehicle_plate: '', vehicle_model: '', vehicle_type: 'sedan', active: true, notes: '' };

export default function DriversManager() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyDriver);
  const [showPassword, setShowPassword] = useState(false);
  const [createAccountLoading, setCreateAccountLoading] = useState(false);
  const [createAccountMsg, setCreateAccountMsg] = useState({ type: '', text: '' });
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [deleteDriverTarget, setDeleteDriverTarget] = useState(null);
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);
  const [deleteAccountMsg, setDeleteAccountMsg] = useState({ type: '', text: '' });

  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => base44.entities.Driver.list('name'),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
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

  // Delete driver record + optionally the associated user account
  const handleDeleteDriverWithAccount = async (deleteAccount) => {
    if (!deleteDriverTarget) return;
    setDeleteAccountLoading(true);
    setDeleteAccountMsg({ type: '', text: '' });
    try {
      if (deleteAccount && deleteDriverTarget.email) {
        const userToDelete = users.find(u => u.email?.toLowerCase() === deleteDriverTarget.email.toLowerCase());
        if (userToDelete) {
          await base44.entities.User.delete(userToDelete.id);
          setDeleteAccountMsg({ type: 'success', text: `Conta de utilizador ${deleteDriverTarget.email} eliminada. Email livre para recriar.` });
        } else {
          setDeleteAccountMsg({ type: 'error', text: `Não foi encontrada conta com email ${deleteDriverTarget.email}. Apenas a ficha do motorista será eliminada.` });
        }
      }
      await deleteMutation.mutateAsync(deleteDriverTarget.id);
      setDeleteDriverTarget(null);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setTimeout(() => setDeleteAccountMsg({ type: '', text: '' }), 4000);
    } catch (err) {
      setDeleteAccountMsg({ type: 'error', text: err?.message || 'Erro ao eliminar.' });
    } finally {
      setDeleteAccountLoading(false);
    }
  };

  const openNew = () => { setEditing(null); setForm(emptyDriver); setOpen(true); setShowPassword(false); setCreateAccountMsg({ type: '', text: '' }); };
  const openEdit = (d) => { setEditing(d); setForm({ ...d }); setOpen(true); setShowPassword(false); setCreateAccountMsg({ type: '', text: '' }); };
  const update = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  const handleCreateAccount = async () => {
    if (!form.email || !form.app_password) {
      setCreateAccountMsg({ type: 'error', text: 'Preencha o email e a palavra-passe antes de criar a conta.' });
      return;
    }
    if (form.app_password.length < 8) {
      setCreateAccountMsg({ type: 'error', text: 'A palavra-passe deve ter pelo menos 8 caracteres.' });
      return;
    }
    setCreateAccountLoading(true);
    setCreateAccountMsg({ type: '', text: '' });
    try {
      await base44.auth.register({ email: form.email, password: form.app_password });
      setCreateAccountMsg({ type: 'success', text: `Conta criada para ${form.email}. O motorista receberá um email de verificação.` });
    } catch (err) {
      setCreateAccountMsg({ type: 'error', text: err?.message || 'Erro ao criar conta. O email pode já estar registado.' });
    } finally {
      setCreateAccountLoading(false);
    }
  };

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
                  {d.app_password && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <KeyRound className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground font-mono">
                        {visiblePasswords[d.id] ? d.app_password : '••••••••'}
                      </span>
                      <button onClick={() => setVisiblePasswords(prev => ({ ...prev, [d.id]: !prev[d.id] }))} className="text-muted-foreground hover:text-foreground">
                        {visiblePasswords[d.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={d.active ? 'text-green-700 border-green-200 bg-green-50' : 'text-gray-500 border-gray-200 bg-gray-50'}>
                    {d.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(d)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => { setDeleteDriverTarget(d); setDeleteAccountMsg({ type: '', text: '' }); }}>
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
                  <SelectItem value="nenhum">Nenhum</SelectItem>
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
              <Label>Email de acesso à app</Label>
              <Input value={form.email} onChange={e => update('email', e.target.value)} placeholder="motorista@email.com" />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="flex items-center gap-1"><KeyRound className="w-3.5 h-3.5" /> Palavra-passe de acesso</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={form.app_password || ''}
                    onChange={e => update('app_password', e.target.value)}
                    placeholder="Palavra-passe do motorista"
                    className="pr-9"
                  />
                  <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={handleCreateAccount} disabled={createAccountLoading} className="gap-1 shrink-0">
                  {createAccountLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Criar conta
                </Button>
              </div>
              {createAccountMsg.text && (
                <div className={`text-xs mt-1 px-2 py-1.5 rounded flex items-center gap-1 ${createAccountMsg.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {createAccountMsg.text}
                </div>
              )}
              <p className="text-xs text-muted-foreground">A palavra-passe é guardada na ficha para referência do admin. Clique "Criar conta" para registar o acesso à app.</p>
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

      {/* Delete driver confirmation */}
      <AlertDialog open={!!deleteDriverTarget} onOpenChange={(open) => { if (!open) { setDeleteDriverTarget(null); setDeleteAccountMsg({ type: '', text: '' }); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar motorista?</AlertDialogTitle>
            <AlertDialogDescription>
              Vai eliminar a ficha de <strong>{deleteDriverTarget?.name}</strong>.
              {deleteDriverTarget?.email
                ? ' Pode também eliminar a conta de utilizador associada para libertar o email e permitir recriar no futuro.'
                : ' Este motorista não tem email de acesso associado.'}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {deleteAccountMsg.text && (
            <div className={`text-sm px-4 py-3 rounded-lg flex items-center gap-2 ${deleteAccountMsg.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              <AlertCircle className="w-4 h-4 shrink-0" />
              {deleteAccountMsg.text}
            </div>
          )}

          <AlertDialogFooter className="flex-col sm:flex-col gap-2">
            {deleteDriverTarget?.email && (
              <AlertDialogAction
                disabled={deleteAccountLoading}
                onClick={() => handleDeleteDriverWithAccount(true)}
                className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto"
              >
                {deleteAccountLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Eliminar ficha + conta de acesso
              </AlertDialogAction>
            )}
            <div className="flex gap-2 w-full sm:w-auto">
              <AlertDialogCancel disabled={deleteAccountLoading} className="flex-1 sm:flex-none">Cancelar</AlertDialogCancel>
              <AlertDialogAction
                disabled={deleteAccountLoading}
                onClick={() => handleDeleteDriverWithAccount(false)}
                className="bg-red-500 hover:bg-red-600 text-white flex-1 sm:flex-none"
              >
                Eliminar só a ficha
              </AlertDialogAction>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}