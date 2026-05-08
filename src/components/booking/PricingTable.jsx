import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from "@/components/ui/badge";
import { Users, MapPin, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { vehicleTypes } from '@/lib/transferData';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';

// Prices: [sedan 1-4pax, minivan 5-8pax] — minibus uses same as minivan +20%
const pricingData = [
  { dest: "Albufeira",              sedan: 40,  minivan: 50  },
  { dest: "Aljezur",                sedan: 120, minivan: 140 },
  { dest: "Altura",                 sedan: 65,  minivan: 75  },
  { dest: "Alvor",                  sedan: 65,  minivan: 75  },
  { dest: "Armação de Pêra",        sedan: 50,  minivan: 60  },
  { dest: "Burgau",                 sedan: 85,  minivan: 95  },
  { dest: "Cabanas de Tavira",      sedan: 45,  minivan: 55  },
  { dest: "Carvoeiro",              sedan: 55,  minivan: 65  },
  { dest: "El Rompido/Spain",       sedan: 150, minivan: 175 },
  { dest: "Estói",                  sedan: 30,  minivan: 85  },
  { dest: "Faro",                   sedan: 20,  minivan: 95  },
  { dest: "Isla Antilla/Spain",     sedan: 140, minivan: 160 },
  { dest: "Isla Canela/Spain",      sedan: 90,  minivan: 100 },
  { dest: "Lagos",                  sedan: 85,  minivan: 95  },
  { dest: "Manta Rota",             sedan: 60,  minivan: 70  },
  { dest: "Monchique",              sedan: 80,  minivan: 90  },
  { dest: "Olhão",                  sedan: 25,  minivan: 30  },
  { dest: "Parchal",                sedan: 55,  minivan: 65  },
  { dest: "Portimão",               sedan: 60,  minivan: 70  },
  { dest: "Praia da Luz",           sedan: 85,  minivan: 95  },
  { dest: "Praia da Rocha",         sedan: 65,  minivan: 75  },
  { dest: "Quarteira",              sedan: 30,  minivan: 40  },
  { dest: "Quinta do Lago",         sedan: 30,  minivan: 40  },
  { dest: "Sagres",                 sedan: 120, minivan: 140 },
  { dest: "Silves",                 sedan: 55,  minivan: 65  },
  { dest: "Tavira",                 sedan: 40,  minivan: 70  },
  { dest: "Vale do Lobo",           sedan: 30,  minivan: 40  },
  { dest: "Vilamoura",              sedan: 30,  minivan: 40  },
  { dest: "Vila Real Sto António",  sedan: 80,  minivan: 95  },
  { dest: "Huelva/Spain",           sedan: 145, minivan: 155 },
  { dest: "Isla Cristina/Spain",    sedan: 120, minivan: 135 },
  { dest: "Ayamonte/Spain",         sedan: 110, minivan: 130 },
  { dest: "Málaga/Spain",           sedan: 490, minivan: 580 },
  { dest: "Punta Umbria/Spain",     sedan: 165, minivan: 185 },
  { dest: "Albufeira/Açoteias",     sedan: 40,  minivan: 50  },
  { dest: "Albufeira/Guia",         sedan: 45,  minivan: 55  },
  { dest: "Albufeira/Ferreiras",    sedan: 45,  minivan: 55  },
  { dest: "Algoz",                  sedan: 30,  minivan: 40  },
  { dest: "Almancil",               sedan: 25,  minivan: 35  },
  { dest: "Boliqueime",             sedan: 35,  minivan: 45  },
  { dest: "Ferreiras",              sedan: 40,  minivan: 50  },
  { dest: "Loulé",                  sedan: 25,  minivan: 35  },
  { dest: "Moncarapacho",           sedan: 30,  minivan: 35  },
  { dest: "Parque da Floresta",     sedan: 110, minivan: 130 },
  { dest: "Tavira/Cabanas do Rey",  sedan: 60,  minivan: 75  },
  { dest: "Porches",                sedan: 50,  minivan: 60  },
  { dest: "Vau",                    sedan: 60,  minivan: 75  },
  { dest: "Salema",                 sedan: 100, minivan: 115 },
  { dest: "Sta. Bárbara de Nexe",   sedan: 30,  minivan: 40  },
];

const SHOW_LIMIT = 10;

export default function PricingTable() {
  const { lang } = useLang();
  const [showAll, setShowAll] = useState(false);

  const visible = showAll ? pricingData : pricingData.slice(0, SHOW_LIMIT);

  return (
    <section className="py-20 bg-muted/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
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
                  <div className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Destino</div>
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
                <tr key={row.dest} className={`border-b border-border/40 hover:bg-muted/40 transition-colors ${i % 2 === 0 ? '' : 'bg-muted/20'}`}>
                  <td className="py-3 px-4 text-sm font-medium flex items-center gap-1.5">
                    <ArrowRight className="w-3 h-3 text-primary shrink-0" />
                    {row.dest}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-bold text-primary text-base">€{row.sedan}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-bold text-primary text-base">€{row.minivan}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-bold text-primary text-base">€{Math.round(row.minivan * 1.15)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </motion.table>
        </div>

        <div className="text-center mt-4">
          <button
            onClick={() => setShowAll(v => !v)}
            className="inline-flex items-center gap-2 text-sm text-primary font-medium hover:underline"
          >
            {showAll ? (
              <><ChevronUp className="w-4 h-4" /> Ver menos</>
            ) : (
              <><ChevronDown className="w-4 h-4" /> Ver todos os {pricingData.length} destinos</>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}