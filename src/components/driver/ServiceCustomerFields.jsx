import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ServiceCustomerFields({ form, update }) {
  return (
    <>
      <div className="space-y-1.5">
        <Label className="text-xs">Nome do cliente *</Label>
        <Input value={form.customer_name} onChange={e => update('customer_name', e.target.value)} placeholder="Nome completo" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Email *</Label>
        <Input type="email" value={form.customer_email} onChange={e => update('customer_email', e.target.value)} placeholder="email@exemplo.com" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Telefone</Label>
        <Input type="tel" value={form.customer_phone} onChange={e => update('customer_phone', e.target.value)} placeholder="+351 ..." />
      </div>
    </>
  );
}