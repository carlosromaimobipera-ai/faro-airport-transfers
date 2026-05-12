import React from 'react';
import { Plane, MapPin, Users, Shield, Clock, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-foreground text-background py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center">
              <Plane className="w-7 h-7 text-primary-foreground" />
            </div>
          </div>
          <h1 className="font-display text-4xl font-bold text-background mb-4">Sobre a Transfers Algarvestar</h1>
          <p className="text-background/70 text-lg max-w-2xl mx-auto">
            O seu parceiro de confiança para transfers privados no Algarve.
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="prose prose-lg max-w-none space-y-8">

          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Quem Somos</h2>
            <p className="text-muted-foreground leading-relaxed">
              A <strong>Transfers Algarvestar</strong> é uma empresa portuguesa especializada em transfers privados de aeroporto e serviços de transporte de luxo em todo o Algarve. Com sede em Faro, operamos transferes entre o Aeroporto de Faro e os principais destinos turísticos da região, incluindo Albufeira, Vilamoura, Lagos, Portimão, Quarteira, Carvoeiro e muitos outros.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Fundada com o objetivo de oferecer um serviço de transporte privado premium, pontual e de confiança, a nossa equipa é constituída por motoristas profissionais, com formação certificada e vasta experiência em transporte de passageiros. Todos os nossos veículos são modernos, climatizados e regularmente inspecionados para garantir a máxima segurança e conforto.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">O Que Fazemos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Oferecemos uma plataforma de reserva online intuitiva que permite aos nossos clientes planear e confirmar os seus transfers de forma simples e rápida. O nosso serviço abrange transfers de ida, de regresso e de ida e volta, disponíveis todos os dias do ano, incluindo feriados. Trabalhamos com três categorias de veículos — Sedan, Minivan e Minibus — para acomodar grupos de diferentes dimensões, desde viajantes individuais até grupos de empresas ou famílias alargadas.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Após a confirmação da reserva, o cliente recebe um voucher detalhado por email com todas as informações do transfer. O nosso motorista estará no local de recolha com o nome do cliente visível, garantindo uma experiência de chegada sem stress.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Para Quem é Este Serviço</h2>
            <p className="text-muted-foreground leading-relaxed">
              O nosso serviço é ideal para turistas que chegam ao Algarve em voo comercial e pretendem deslocar-se de forma confortável e segura para o seu alojamento. É também uma excelente opção para viajantes de negócios que necessitam de pontualidade e profissionalismo, famílias com crianças que preferem a segurança de um transporte privado, e grupos que procuram uma solução prática e económica comparativamente ao aluguer de viaturas ou táxis convencionais.
            </p>
          </div>

          {/* Features grid */}
          <div className="grid sm:grid-cols-2 gap-6 mt-10">
            {[
              { icon: Clock, title: 'Pontualidade Garantida', desc: 'Monitorizamos os voos em tempo real para nos adaptarmos a atrasos ou chegadas antecipadas.' },
              { icon: Shield, title: 'Segurança em Primeiro Lugar', desc: 'Todos os motoristas são certificados e os veículos passam inspeções regulares.' },
              { icon: Users, title: 'Para Todos os Grupos', desc: 'Sedan para 4 pax, Minivan para 6 pax e Minibus para grupos até 14 passageiros.' },
              { icon: Star, title: 'Avaliações 5 Estrelas', desc: 'Centenas de clientes satisfeitos avaliam o nosso serviço com a nota máxima.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-card border border-border rounded-xl p-6 flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{title}</h3>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center pt-8">
            <Link
              to="/contacto"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
            >
              Fale Connosco
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}