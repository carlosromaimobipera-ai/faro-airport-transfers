import React, { useState } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { base44 } from '@/api/base44Client';

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID;

export default function PayPalButton({ amount, onSuccess, onError }) {
  const [loading, setLoading] = useState(false);

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

  return (
    <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID, currency: 'EUR' }}>
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