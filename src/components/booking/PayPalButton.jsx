import React, { useState, useEffect } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { base44 } from '@/api/base44Client';

export default function PayPalButton({ amount, onSuccess, onError }) {
  const [loading, setLoading] = useState(false);
  const [clientId, setClientId] = useState(null);

  useEffect(() => {
    base44.functions.invoke('getPaypalClientId', {}).then(res => {
      setClientId(res.data.clientId);
    }).catch(() => {
      onError('Erro ao carregar PayPal. Por favor tente mais tarde.');
    });
  }, []);

  const createOrder = async () => {
    setLoading(true);
    const res = await base44.functions.invoke('createPaypalOrder', {
      amount,
      currency: 'EUR',
      description: 'Transfer Algarvestar',
    });
    setLoading(false);
    return res.data.orderId;
  };

  const onApprove = async (data) => {
    setLoading(true);
    const res = await base44.functions.invoke('capturePaypalOrder', {
      orderId: data.orderID,
    });
    setLoading(false);
    if (res.data.success) {
      onSuccess();
    } else {
      onError('Pagamento não foi capturado corretamente.');
    }
  };

  if (!clientId) {
    return (
      <div className="flex justify-center py-4">
        <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <PayPalScriptProvider options={{ clientId, currency: 'EUR' }}>
      <div className="w-full">
        {loading && (
          <div className="flex justify-center mb-3">
            <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}
        <PayPalButtons
          style={{ layout: 'vertical', color: 'blue', shape: 'rect', label: 'pay' }}
          createOrder={createOrder}
          onApprove={onApprove}
          onError={(err) => onError(err?.message || 'Erro no pagamento PayPal.')}
        />
      </div>
    </PayPalScriptProvider>
  );
}