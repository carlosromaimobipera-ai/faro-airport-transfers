import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Clock, CreditCard, Headphones, Car, Globe } from 'lucide-react';

const features = [
  { icon: Shield, title: "Viagem segura", desc: "Motoristas licenciados e veículos com seguro completo" },
  { icon: Clock, title: "Pontualidade 24/7", desc: "Monitorização de voos e serviço a qualquer hora" },
  { icon: CreditCard, title: "Preço fixo", desc: "Sem surpresas, o preço que vê é o preço que paga" },
  { icon: Headphones, title: "Suporte dedicado", desc: "Apoio ao cliente disponível por telefone e email" },
  { icon: Car, title: "Frota moderna", desc: "Veículos confortáveis e bem equipados" },
  { icon: Globe, title: "Multilingue", desc: "Motoristas que falam português, inglês e espanhol" },
];

export default function FeaturesSection() {
  return (
    <section className="py-20 bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">
            Porquê escolher-nos?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Transfers privados de qualidade premium a preços competitivos
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="p-6 rounded-2xl bg-background border border-border/40 hover:shadow-lg hover:border-primary/20 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}