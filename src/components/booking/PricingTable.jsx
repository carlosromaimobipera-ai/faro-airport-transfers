import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, ArrowRight, ChevronDown, ChevronUp, Users } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';

// [sedan 1-4pax, vw caddy 5-8pax, mercedes vito 5-8pax]
const pricingData = [
  { dest: "Albufeira",                  p1: 40,  p2: 50  },
  { dest: "Aljezur",                    p1: 120, p2: 140 },
  { dest: "Altura",                     p1: 65,  p2: 75  },
  { dest: "Alvor",                      p1: 65,  p2: 75  },
  { dest: "Armação de Pêra",            p1: 50,  p2: 60  },
  { dest: "Burgau",                     p1: 85,  p2: 95  },
  { dest: "Cabanas de Tavira",          p1: 45,  p2: 55  },
  { dest: "Carvoeiro",                  p1: 55,  p2: 65  },
  { dest: "El Rompido/Spain",           p1: 150, p2: 175 },
  { dest: "Estói",                      p1: 30,  p2: 85  },
  { dest: "Faro",                       p1: 20,  p2: 95  },
  { dest: "Isla Antilla/Spain",         p1: 140, p2: 160 },
  { dest: "Isla Canela/Spain",          p1: 90,  p2: 100 },
  { dest: "Lagos",                      p1: 85,  p2: 95  },
  { dest: "Lisboa",                     p1: 310, p2: 350 },
  { dest: "Manta Rota",                 p1: 60,  p2: 70  },
  { dest: "Meia Praia",                 p1: 80,  p2: 90  },
  { dest: "Monchique",                  p1: 80,  p2: 90  },
  { dest: "Olhão",                      p1: 25,  p2: 30  },
  { dest: "Parchal",                    p1: 55,  p2: 65  },
  { dest: "Portimão",                   p1: 60,  p2: 70  },
  { dest: "Praia da Luz",               p1: 85,  p2: 95  },
  { dest: "Praia da Rocha",             p1: 65,  p2: 75  },
  { dest: "Quarteira",                  p1: 30,  p2: 40  },
  { dest: "Quinta do Lago",             p1: 30,  p2: 40  },
  { dest: "Sagres",                     p1: 120, p2: 140 },
  { dest: "Sevilha/Spain",              p1: 300, p2: 350 },
  { dest: "Silves",                     p1: 55,  p2: 65  },
  { dest: "Tavira",                     p1: 40,  p2: 70  },
  { dest: "Vale do Lobo",               p1: 30,  p2: 40  },
  { dest: "Vilamoura",                  p1: 30,  p2: 40  },
  { dest: "Vila Real Sto António",      p1: 80,  p2: 95  },
  { dest: "Huelva/Spain",               p1: 145, p2: 155 },
  { dest: "Isla Cristina/Spain",        p1: 120, p2: 135 },
  { dest: "Ayamonte/Spain",             p1: 110, p2: 130 },
  { dest: "Málaga/Spain",               p1: 490, p2: 580 },
  { dest: "Punta Umbría/Spain",         p1: 165, p2: 185 },
  { dest: "Albufeira/Açoteias",         p1: 40,  p2: 50  },
  { dest: "Albufeira/Guia",             p1: 45,  p2: 55  },
  { dest: "Albufeira/Ferreiras Água",   p1: 45,  p2: 55  },
  { dest: "Algoz",                      p1: 30,  p2: 40  },
  { dest: "Almancil",                   p1: 25,  p2: 35  },
  { dest: "Boliqueime",                 p1: 35,  p2: 45  },
  { dest: "Ferreiras",                  p1: 40,  p2: 50  },
  { dest: "Loulé",                      p1: 25,  p2: 35  },
  { dest: "Moncarapacho",               p1: 30,  p2: 35  },
  { dest: "Parque da Floresta",         p1: 110, p2: 130 },
  { dest: "Tavira/Cabanas do Rey",      p1: 60,  p2: 75  },
  { dest: "Porches",                    p1: 50,  p2: 60  },
  { dest: "Vau",                        p1: 60,  p2: 75  },
  { dest: "Salema",                     p1: 100, p2: 115 },
  { dest: "Sta. Bárbara de Nexe",       p1: 30,  p2: 40  },
];

const SHOW_LIMIT = 12;

export default function PricingTable() {
  const { lang } = useLang();
  const [showAll, setShowAll] = useState(false);

  const visible = showAll ? pricingData : pricingData.slice(0, SHOW_LIMIT);

  return (
    <section className="py-20 bg-muted/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">{t(lang, 'pricing_title')}</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">{t(lang, 'pricing_sub')}</p>
          <p className="text-xs text-muted-foreground mt-2">* Preços desde o Aeroporto de Faro (ida)</p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-border/40 bg-card shadow-sm">
          <motion.table
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="w-full border-collapse"
          >
            <thead>
              <tr className="bg-primary text-primary-foreground">
                <th className="text-left py-3 px-4 text-sm font-semibold">
                  <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Destinos</div>
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold">
                  <div className="flex flex-col items-center gap-0.5">
                    <span>Sedan / Kia</span>
                    <span className="text-[10px] opacity-80 font-normal flex items-center gap-1"><Users className="w-3 h-3" />1–4 pessoas</span>
                  </div>
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold">
                  <div className="flex flex-col items-center gap-0.5">
                    <span>VW Caddy</span>
                    <span className="text-[10px] opacity-80 font-normal flex items-center gap-1"><Users className="w-3 h-3" />5–8 pessoas</span>
                  </div>
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold">
                  <div className="flex flex-col items-center gap-0.5">
                    <span>Mercedes Vito</span>
                    <span className="text-[10px] opacity-80 font-normal flex items-center gap-1"><Users className="w-3 h-3" />5–8 pessoas</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row, i) => (
                <tr key={row.dest} className={`border-b border-border/40 hover:bg-primary/5 transition-colors ${i % 2 === 0 ? '' : 'bg-muted/20'}`}>
                  <td className="py-3 px-4 text-sm font-medium">
                    <div className="flex items-center gap-1.5">
                      <ArrowRight className="w-3 h-3 text-primary shrink-0" />
                      {row.dest}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-bold text-primary text-base">€{row.p1}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-bold text-primary text-base">€{row.p2}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-bold text-primary text-base">€{Math.round(row.p2 * 1.15)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </motion.table>
        </div>

        <div className="text-center mt-5">
          <button
            onClick={() => setShowAll(v => !v)}
            className="inline-flex items-center gap-2 text-sm text-primary font-semibold hover:underline"
          >
            {showAll
              ? <><ChevronUp className="w-4 h-4" /> Ver menos</>
              : <><ChevronDown className="w-4 h-4" /> Ver todos os {pricingData.length} destinos</>
            }
          </button>
        </div>
      </div>
    </section>
  );
}