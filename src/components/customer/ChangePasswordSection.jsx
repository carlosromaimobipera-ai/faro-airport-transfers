import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KeyRound, CheckCircle, AlertCircle } from 'lucide-react';

export default function ChangePasswordSection({ email }) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRequest = async () => {
    setLoading(true);
    setError('');
    try {
      await base44.auth.resetPasswordRequest(email);
      setSent(true);
    } catch {
      // Always show success for security reasons
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-dashed">
      <CardContent className="p-4">
        {sent ? (
          <div className="flex items-center gap-2 text-green-700 text-sm">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>Email enviado para <strong>{email}</strong>. Verifique a sua caixa de entrada para redefinir a palavra-passe.</span>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm font-medium">Alterar Palavra-passe</p>
                <p className="text-xs text-muted-foreground">Receberá um link por email para definir uma nova senha.</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleRequest} disabled={loading} className="shrink-0">
              {loading ? 'A enviar...' : 'Enviar link'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}