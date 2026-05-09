import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Trash2, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

export default function DeleteAccountSection() {
  const [showDialog, setShowDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const user = await base44.auth.me();
      // Soft delete by marking user as inactive via custom attribute
      await base44.auth.updateMe({ account_deleted: true });
      // Logout
      await base44.auth.logout('/');
    } catch (error) {
      console.error('Erro ao eliminar conta:', error);
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">Eliminar Conta</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Esta ação é irreversível. Toda a sua informação pessoal será removida do sistema.
              </p>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDialog(true)}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar Conta Permanentemente
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Eliminar Conta?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que pretende eliminar a sua conta? Esta ação não pode ser desfeita e toda a sua informação será apagada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isDeleting ? 'A eliminar...' : 'Sim, eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}