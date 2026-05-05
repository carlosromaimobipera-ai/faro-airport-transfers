import React from 'react';
import { motion } from 'framer-motion';
import { Plane, Shield, Clock, Star } from 'lucide-react';

const stats = [
  { icon: Shield, label: "Viagem Segura", value: "100%" },
  { icon: Clock, label: "Pontualidade", value: "24/7" },
  { icon: Star, label: "Avaliação", value: "4.9★" },
];

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-20 w-96 h-96 bg-secondary rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 md:pt-28 md:pb-24">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="flex items-center gap-2 mb-6">
              <Plane className="w-5 h-5 text-secondary" />
              <span className="text-sm font-medium tracking-widest uppercase text-secondary">
                Transfers Aeroporto de Faro
              </span>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
              O seu transfer,{' '}
              <span className="text-secondary">simples e seguro</span>
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl leading-relaxed">
              Transfers privados do Aeroporto de Faro para todo o Algarve, Lisboa e Sevilha. 
              Viaje com conforto em veículos modernos com motoristas profissionais.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-wrap gap-8 mt-12"
          >
            {stats.map((stat) => (
              <div key={stat.label} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <stat.icon className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <p className="text-lg font-bold">{stat.value}</p>
                  <p className="text-xs text-primary-foreground/60">{stat.label}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Wave separator */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 80" fill="none" className="w-full">
          <path d="M0 80V30C240 60 480 0 720 30C960 60 1200 0 1440 30V80H0Z" fill="hsl(var(--background))" />
        </svg>
      </div>
    </section>
  );
}