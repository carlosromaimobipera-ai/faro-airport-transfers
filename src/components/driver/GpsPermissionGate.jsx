import React, { useState, useEffect } from 'react';
import { MapPin, MapPinOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Blocks the driver app if GPS permission is not granted.
 * Shows a clear instructions screen to enable location access.
 */
export default function GpsPermissionGate({ children }) {
  const [status, setStatus] = useState('checking'); // 'checking' | 'granted' | 'denied' | 'unavailable'

  const checkPermission = () => {
    setStatus('checking');

    if (!navigator.geolocation) {
      setStatus('unavailable');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      () => setStatus('granted'),
      (err) => {
        if (err.code === 1) setStatus('denied');
        else setStatus('granted'); // timeout or other — allow through
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    checkPermission();
  }, []);

  if (status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3 px-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <MapPin className="w-8 h-8 text-primary animate-pulse" />
          </div>
          <p className="font-semibold text-foreground">A verificar localização...</p>
          <p className="text-sm text-muted-foreground">Por favor autorize o acesso à localização quando solicitado.</p>
        </div>
      </div>
    );
  }

  if (status === 'denied' || status === 'unavailable') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto">
            <MapPinOff className="w-10 h-10 text-red-500" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">Localização obrigatória</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Para usar a app de motorista, é obrigatório ativar a localização GPS.
              Isto permite monitorizar os serviços em tempo real.
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left space-y-2">
            <p className="text-sm font-semibold text-amber-900">Como ativar:</p>
            <ol className="text-sm text-amber-800 space-y-1 list-decimal list-inside leading-relaxed">
              <li>Abra as <strong>Definições</strong> do telemóvel</li>
              <li>Vá a <strong>Privacidade → Localização</strong></li>
              <li>Encontre este site/app e selecione <strong>"Permitir"</strong></li>
              <li>Volte aqui e toque em <strong>"Tentar novamente"</strong></li>
            </ol>
          </div>

          {status === 'unavailable' && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
              O seu dispositivo não suporta GPS. Não é possível usar esta app.
            </div>
          )}

          <Button onClick={checkPermission} className="w-full gap-2">
            <RefreshCw className="w-4 h-4" />
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  // status === 'granted'
  return children;
}