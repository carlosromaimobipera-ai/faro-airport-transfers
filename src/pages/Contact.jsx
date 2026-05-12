import React from 'react';
import { Phone, Mail, MapPin, MessageCircle, Clock } from 'lucide-react';

export default function Contact() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-foreground text-background py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-display text-4xl font-bold text-background mb-4">Contacte-nos</h1>
          <p className="text-background/70 text-lg max-w-2xl mx-auto">
            Estamos disponíveis para responder a todas as suas questões sobre transfers no Algarve.
          </p>
        </div>
      </div>

      {/* Contact content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-12">

          {/* Contact info */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6">Informações de Contacto</h2>
            <ul className="space-y-6">
              <li className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Telefone / WhatsApp</p>
                  <a href="tel:+351913956971" className="text-muted-foreground hover:text-primary transition-colors">
                    +351 913 956 971
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Email</p>
                  <a href="mailto:info@transfers-algarvestar.com" className="text-muted-foreground hover:text-primary transition-colors">
                    info@transfers-algarvestar.com
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">WhatsApp Direto</p>
                  <a
                    href="https://wa.me/351913956971?text=Olá%2C%20gostaria%20de%20saber%20mais%20sobre%20os%20transfers"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-green-600 transition-colors"
                  >
                    Enviar mensagem no WhatsApp
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Localização</p>
                  <p className="text-muted-foreground">Urbanização Quinta da Torre, Lote 22, R/C A<br />Algarve, Portugal</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Disponibilidade</p>
                  <p className="text-muted-foreground">24 horas por dia, 7 dias por semana,<br />365 dias por ano</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Quick contact form */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6">Envie-nos uma Mensagem</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const data = new FormData(e.target);
                const msg = encodeURIComponent(`Olá, o meu nome é ${data.get('name')}. ${data.get('message')}`);
                window.open(`https://wa.me/351913956971?text=${msg}`, '_blank');
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Nome</label>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="O seu nome"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Email</label>
                <input
                  name="email"
                  type="email"
                  placeholder="o.seu@email.com"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Mensagem</label>
                <textarea
                  name="message"
                  required
                  rows={5}
                  placeholder="Como podemos ajudar?"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Enviar via WhatsApp
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}