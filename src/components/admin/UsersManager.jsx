import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AlertCircle, Loader2, Mail, Plus, KeyRound, Trash2, ShieldCheck, User as UserIcon, Search, Pencil } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

export default function UsersManager() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [editData, setEditData] = useState({ full_name: '', role: 'user' });
  const [search, setSearch] = useState('');

  // Invite via email
  const [inviteData, setInviteData] = useState({ email: '', role: 'user' });
  // Create with password
  const [createData, setCreateData] = useState({ email: '', password: '', confirmPassword: '', role: 'user' });

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id) => base44.entities.User.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeleteTarget(null);
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.User.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditTarget(null);
    },
  });

  const handleEditSave = () => {
    if (!editTarget) return;
    updateUserMutation.mutate({ id: editTarget.id, data: { role: editData.role, full_name: editData.full_name } });
  };

  const resetState = () => {
    setError('');
    setSuccess('');
    setInviteData({ email: '', role: 'user' });
    setCreateData({ email: '', password: '', confirmPassword: '', role: 'user' });
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!inviteData.email) { setError('Introduza o email'); return; }
    setIsLoading(true);
    try {
      const role = inviteData.role === 'admin' ? 'admin' : 'user';
      await base44.users.inviteUser(inviteData.email, role);
      setSuccess(`Convite enviado para ${inviteData.email}`);
      setInviteData({ email: '', role: 'user' });
      setTimeout(() => { setIsOpen(false); setSuccess(''); }, 2500);
    } catch (err) {
      setError(err?.message || 'Erro ao enviar convite. Verifique se o email já está registado.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!createData.email || !createData.password) { setError('Preencha email e palavra-passe'); return; }
    if (createData.password !== createData.confirmPassword) { setError('As palavras-passe não coincidem'); return; }
    if (createData.password.length < 8) { setError('A palavra-passe deve ter pelo menos 8 caracteres'); return; }
    setIsLoading(true);
    try {
      await base44.auth.register({ email: createData.email, password: createData.password });
      setSuccess(`Conta criada para ${createData.email}. O utilizador receberá um email de verificação.`);
      setCreateData({ email: '', password: '', confirmPassword: '', role: 'user' });
      setTimeout(() => { setIsOpen(false); setSuccess(''); queryClient.invalidateQueries({ queryKey: ['users'] }); }, 2500);
    } catch (err) {
      setError(err?.message || 'Erro ao criar conta. O email pode já estar registado.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = () => {
    if (!deleteTarget) return;
    deleteUserMutation.mutate(deleteTarget.id);
  };

  const filteredUsers = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.email?.toLowerCase().includes(q) || u.full_name?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-lg">Gestão de Utilizadores</h3>
              <p className="text-xs text-muted-foreground mt-1">Convide, crie ou elimine acessos para motoristas e administradores</p>
            </div>
            <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetState(); }}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4" />
                  Adicionar Utilizador
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Adicionar Utilizador</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="invite" onValueChange={() => { setError(''); setSuccess(''); }}>
                  <TabsList className="w-full">
                    <TabsTrigger value="invite" className="flex-1 gap-1.5">
                      <Mail className="w-4 h-4" /> Enviar Convite
                    </TabsTrigger>
                    <TabsTrigger value="create" className="flex-1 gap-1.5">
                      <KeyRound className="w-4 h-4" /> Criar com Senha
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="invite">
                    <form onSubmit={handleInvite} className="space-y-4 pt-2">
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input type="email" placeholder="utilizador@example.com" value={inviteData.email} onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })} disabled={isLoading} />
                      </div>
                      <div className="space-y-2">
                        <Label>Função</Label>
                        <Select value={inviteData.role} onValueChange={(role) => setInviteData({ ...inviteData, role })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">Utilizador / Motorista</SelectItem>
                            <SelectItem value="admin">Administrador</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {error && <ErrorBox msg={error} />}
                      {success && <SuccessBox msg={success} />}
                      <Button type="submit" disabled={isLoading} className="w-full">
                        {isLoading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />A enviar...</> : 'Enviar Convite por Email'}
                      </Button>
                      <p className="text-xs text-muted-foreground text-center">O utilizador receberá um link para definir a sua palavra-passe.</p>
                    </form>
                  </TabsContent>

                  <TabsContent value="create">
                    <form onSubmit={handleCreate} className="space-y-4 pt-2">
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input type="email" placeholder="motorista@example.com" value={createData.email} onChange={(e) => setCreateData({ ...createData, email: e.target.value })} disabled={isLoading} />
                      </div>
                      <div className="space-y-2">
                        <Label>Palavra-passe</Label>
                        <Input type="password" placeholder="Mínimo 8 caracteres" value={createData.password} onChange={(e) => setCreateData({ ...createData, password: e.target.value })} disabled={isLoading} />
                      </div>
                      <div className="space-y-2">
                        <Label>Confirmar Palavra-passe</Label>
                        <Input type="password" placeholder="Repetir palavra-passe" value={createData.confirmPassword} onChange={(e) => setCreateData({ ...createData, confirmPassword: e.target.value })} disabled={isLoading} />
                      </div>
                      <div className="space-y-2">
                        <Label>Função</Label>
                        <Select value={createData.role} onValueChange={(role) => setCreateData({ ...createData, role })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">Utilizador / Motorista</SelectItem>
                            <SelectItem value="admin">Administrador</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {error && <ErrorBox msg={error} />}
                      {success && <SuccessBox msg={success} />}
                      <Button type="submit" disabled={isLoading} className="w-full">
                        {isLoading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />A criar...</> : 'Criar Conta'}
                      </Button>
                      <p className="text-xs text-muted-foreground text-center">Partilhe o email e a palavra-passe diretamente com o utilizador.</p>
                    </form>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-700 flex items-start gap-2 mb-4">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Como funciona?</p>
              <ul className="text-xs mt-1 space-y-1 list-disc list-inside">
                <li><strong>Enviar Convite:</strong> O utilizador recebe um email com link para se registar.</li>
                <li><strong>Criar com Senha:</strong> Cria a conta diretamente e partilha as credenciais com o motorista.</li>
                <li><strong>Eliminar conta:</strong> Remove o acesso do utilizador. O email fica livre para recriar.</li>
                <li>Para acesso ao painel de motorista, use a função <strong>Utilizador / Motorista</strong> e associe o email na ficha do motorista.</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User list */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-primary" />
              Contas Registadas
              <Badge variant="secondary" className="ml-1">{users.length}</Badge>
            </h3>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Pesquisar email ou nome..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
            </div>
          </div>

          {usersLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum utilizador encontrado.</p>
          ) : (
            <div className="divide-y rounded-lg border">
              {filteredUsers.map(u => {
                const isSelf = currentUser?.id === u.id;
                const isDeleting = deleteUserMutation.isPending && deleteTarget?.id === u.id;
                return (
                  <div key={u.id} className="flex items-center justify-between px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium truncate">{u.full_name || '(sem nome)'}</p>
                        {u.role === 'admin' ? (
                          <Badge variant="outline" className="text-purple-700 border-purple-200 bg-purple-50 gap-1">
                            <ShieldCheck className="w-3 h-3" /> Admin
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-blue-700 border-blue-200 bg-blue-50 gap-1">
                            <UserIcon className="w-3 h-3" /> Utilizador
                          </Badge>
                        )}
                        {isSelf && <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">Você</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{u.email}</p>
                      {u.created_date && (
                        <p className="text-xs text-muted-foreground/70 mt-0.5">
                          {format(new Date(u.created_date), "d MMM yyyy", { locale: pt })}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-3 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                        disabled={isSelf}
                        onClick={() => { setEditTarget(u); setEditData({ full_name: u.full_name || '', role: u.role || 'user' }); }}
                        title="Editar utilizador"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                        disabled={isSelf || isDeleting}
                        onClick={() => setDeleteTarget(u)}
                        title={isSelf ? 'Não pode eliminar a sua própria conta' : 'Eliminar conta'}
                      >
                        {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit user dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => { if (!open) setEditTarget(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Utilizador</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={editTarget?.email || ''} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={editData.full_name}
                onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                placeholder="Nome completo"
              />
            </div>
            <div className="space-y-2">
              <Label>Função (Acesso)</Label>
              <Select value={editData.role} onValueChange={(role) => setEditData({ ...editData, role })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Utilizador / Motorista</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {updateUserMutation.isError && (
              <ErrorBox msg={updateUserMutation.error?.message || 'Erro ao atualizar utilizador.'} />
            )}
            <Button onClick={handleEditSave} disabled={updateUserMutation.isPending} className="w-full">
              {updateUserMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" />A guardar...</>
              ) : 'Guardar Alterações'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar conta de utilizador?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove permanentemente o acesso de <strong>{deleteTarget?.email}</strong>.
              O email ficará livre para criar uma nova conta.
              {deleteTarget?.role === 'admin' && ' Esta é uma conta de administrador.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteUserMutation.isError && (
            <ErrorBox msg={deleteUserMutation.error?.message || 'Erro ao eliminar conta.'} />
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteUserMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteUserMutation.isPending}
              onClick={handleDeleteUser}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteUserMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Eliminar definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ErrorBox({ msg }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex items-center gap-2">
      <AlertCircle className="w-4 h-4 shrink-0" />
      {msg}
    </div>
  );
}

function SuccessBox({ msg }) {
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">
      ✓ {msg}
    </div>
  );
}