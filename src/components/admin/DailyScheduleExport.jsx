import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileDown, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function DailyScheduleExport() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleExport = async () => {
    setLoading(true);
    setError('');
    try {
      const { appId, token } = appParams;
      const res = await fetch(
        `${window.location.origin}/api/apps/${appId}/functions/exportDailySchedule`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ date }),
        }
      );
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `servicos-${date}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      setError('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <FileDown className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Serviços por dia (PDF)</span>
          </div>
          <Input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="h-9 w-40"
          />
          <Button size="sm" onClick={handleExport} disabled={loading} className="gap-2 h-9">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
            {loading ? 'A gerar...' : 'Exportar PDF'}
          </Button>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      </CardContent>
    </Card>
  );
}