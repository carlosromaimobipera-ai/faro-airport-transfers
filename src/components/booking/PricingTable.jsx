import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from "@/components/ui/badge";
import { Users, MapPin, ArrowRight } from 'lucide-react';
import { vehicleTypes } from '@/lib/transferData';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';

const popularRoutes = [
  { from: "Aeroporto de Faro", to: "Albufeira", km: 42 },
  { from: "Aeroporto de Faro", to: "Vilamoura", km: 25 },
  { from: "Aeroporto de Faro", to: "Lagos", km: 88 },
  { from: "Aeroporto de Faro", to: "Lisboa", km: 278 },
  { from: "Aeroporto de Faro", to: "Sevilha", km: 200 },
];

export default function PricingTable() {
  const { lang } = useLang();

  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">{t(lang, 'pricing_title')}</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">{t(lang, 'pricing_sub')}</p>
        </div>

        <div className="overflow-x-auto">
          <motion.table
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="w-full border-collapse"
          >
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground">{t(lang, 'col_route')}</th>
                <th className="text-center py-4 px-4 text-sm font-semibold text-muted-foreground">{t(lang, 'col_dist')}</th>
                {vehicleTypes.map(v => (
                  <th key={v.id} className="text-center py-4 px-4">
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-bold text-sm">{t(lang, v.nameKey)}</span>
                      <Badge variant="secondary" className="text-[10px]">
                        <Users className="w-2.5 h-2.5 mr-0.5" />{v.seats}
                      </Badge>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {popularRoutes.map((route, i) => (
                <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2 text-sm font-medium flex-wrap">
                      <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>{route.from}</span>
                      <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                      <span>{route.to}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center text-sm text-muted-foreground">{route.km} km</td>
                  {vehicleTypes.map(v => (
                    <td key={v.id} className="py-4 px-4 text-center">
                      <span className="font-bold text-lg">€{Math.round(route.km * v.pricePerKm)}</span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </motion.table>
        </div>
      </div>
    </section>
  );
}