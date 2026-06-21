import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertCircle, Loader2, Mail, Plus, KeyRound } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function UsersManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Invite via email
  const [inviteData, setInviteData] = useState({ email: '', role: 'user' });

  // Create with password
  const [createData, setCreateData] = useState({ email: '', password: '', confirmPassword: '', role: 'user' });

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
      // base44.users.inviteUser only accepts 'user' or 'admin'
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
      const role = createData.role === 'admin' ? 'admin' : 'user';
      await base44.auth.register({ email: createData.email, password: createData.password });
      setSuccess(`Conta criada para ${createData.email}. O utilizador receberá um email de verificação.`);
      setCreateData({ email: '', password: '', confirmPassword: '', role: 'user' });
      setTimeout(() => { setIsOpen(false); setSuccess(''); }, 2500);
    } catch (err) {
      setError(err?.message || 'Erro ao criar conta. O email pode já estar registado.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-lg">Gestão de Utilizadores</h3>
              <p className="text-xs text-muted-foreground mt-1">Convide ou crie acessos para motoristas e administradores</p>
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

                  {/* TAB: Invite */}
                  <TabsContent value="invite">
                    <form onSubmit={handleInvite} className="space-y-4 pt-2">
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                          type="email"
                          placeholder="utilizador@example.com"
                          value={inviteData.email}
                          onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                          disabled={isLoading}
                        />
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

                  {/* TAB: Create with password */}
                  <TabsContent value="create">
                    <form onSubmit={handleCreate} className="space-y-4 pt-2">
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                          type="email"
                          placeholder="motorista@example.com"
                          value={createData.email}
                          onChange={(e) => setCreateData({ ...createData, email: e.target.value })}
                          disabled={isLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Palavra-passe</Label>
                        <Input
                          type="password"
                          placeholder="Mínimo 8 caracteres"
                          value={createData.password}
                          onChange={(e) => setCreateData({ ...createData, password: e.target.value })}
                          disabled={isLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Confirmar Palavra-passe</Label>
                        <Input
                          type="password"
                          placeholder="Repetir palavra-passe"
                          value={createData.confirmPassword}
                          onChange={(e) => setCreateData({ ...createData, confirmPassword: e.target.value })}
                          disabled={isLoading}
                        />
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

          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Como funciona?</p>
              <ul className="text-xs mt-1 space-y-1 list-disc list-inside">
                <li><strong>Enviar Convite:</strong> O utilizador recebe um email com link para se registar.</li>
                <li><strong>Criar com Senha:</strong> Cria a conta diretamente e partilha as credenciais com o motorista.</li>
                <li>Para acesso ao painel de motorista, use a função <strong>Utilizador / Motorista</strong> e associe o email na ficha do motorista.</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
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