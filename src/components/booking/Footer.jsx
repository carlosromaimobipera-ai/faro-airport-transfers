import React from 'react';
import { Plane, Phone, Mail, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-foreground text-background/80 py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Plane className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display text-xl font-bold text-background">Faro Transfers</span>
            </div>
            <p className="text-sm text-background/60 leading-relaxed">
              Serviço premium de transfers privados no Algarve. Do aeroporto ao seu destino com conforto e segurança.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-background mb-4">Destinos populares</h4>
            <ul className="space-y-2 text-sm text-background/60">
              <li>Aeroporto Faro → Albufeira</li>
              <li>Aeroporto Faro → Vilamoura</li>
              <li>Aeroporto Faro → Lagos</li>
              <li>Aeroporto Faro → Lisboa</li>
              <li>Aeroporto Faro → Sevilha</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-background mb-4">Contacto</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-background/60">
                <Phone className="w-4 h-4 text-primary" /> +351 289 000 000
              </li>
              <li className="flex items-center gap-2 text-background/60">
                <Mail className="w-4 h-4 text-primary" /> info@farotransfers.pt
              </li>
              <li className="flex items-center gap-2 text-background/60">
                <MapPin className="w-4 h-4 text-primary" /> Aeroporto de Faro, Algarve
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-background/10 mt-10 pt-6 text-center text-xs text-background/40">
          © {new Date().getFullYear()} Faro Transfers. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}