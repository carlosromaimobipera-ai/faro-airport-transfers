import React from 'react';
import { MapPin, ArrowRight, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RouteInfoBadge({ origin, destination, distance, price }) {
  if (!origin || !distance) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-4 border border-primary/20 shadow-sm"
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Origin */}
        <div className="flex items-start gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <MapPin className="w-4 h-4 text-primary" />
          </div>
          <div className="text-xs">
            <p className="text-muted-foreground">Partida</p>
            <p className="font-semibold text-foreground truncate">{origin}</p>
          </div>
        </div>

        {/* Arrow + Destination */}
        <div className="flex items-start gap-2">
          <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center shrink-0 mt-0.5">
            <ArrowRight className="w-4 h-4 text-secondary" />
          </div>
          <div className="text-xs">
            <p className="text-muted-foreground">Destino</p>
            <p className="font-semibold text-foreground truncate">{destination || '—'}</p>
          </div>
        </div>

        {/* Distance */}
        <div className="flex items-start gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
            <span className="w-4 h-4 text-blue-600 text-xs font-bold">⇔</span>
          </div>
          <div className="text-xs">
            <p className="text-muted-foreground">Distância</p>
            <p className="font-semibold text-foreground">{distance} km</p>
          </div>
        </div>

        {/* Price */}
        {price && (
          <div className="flex items-start gap-2">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
              <Zap className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-xs">
              <p className="text-muted-foreground">Preço base</p>
              <p className="font-semibold text-green-600">€{price.toFixed(2)}</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}