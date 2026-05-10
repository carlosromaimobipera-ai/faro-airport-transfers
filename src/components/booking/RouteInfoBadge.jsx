import React from 'react';
import { MapPin, ArrowRight, Zap, Clock, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RouteInfoBadge({ origin, destination, distance, price, duration_minutes, isLoading }) {
  if (!origin || !distance) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-4 border border-primary/20 shadow-sm"
    >
      {/* Origin → Destination row */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <MapPin className="w-4 h-4 text-primary" />
        </div>
        <div className="text-xs min-w-0">
          <p className="text-muted-foreground">Partida</p>
          <p className="font-semibold text-foreground break-words">{origin}</p>
        </div>
        <ArrowRight className="w-4 h-4 text-secondary shrink-0 mx-1" />
        <div className="text-xs min-w-0">
          <p className="text-muted-foreground">Destino</p>
          <p className="font-semibold text-foreground break-words">{destination || '—'}</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        {/* Distance */}
        <div className="flex items-start gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
            {isLoading ? <Loader2 className="w-4 h-4 text-blue-600 animate-spin" /> : <span className="text-blue-600 text-xs font-bold">⇔</span>}
          </div>
          <div className="text-xs">
            <p className="text-muted-foreground">Distância</p>
            <p className="font-semibold text-foreground">{distance} km</p>
          </div>
        </div>

        {/* Duration */}
        {duration_minutes && (
          <div className="flex items-start gap-2">
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-orange-600" />
            </div>
            <div className="text-xs">
              <p className="text-muted-foreground">Duração</p>
              <p className="font-semibold text-foreground">{duration_minutes} min</p>
            </div>
          </div>
        )}

        {/* Price */}
        {price && (
          <div className="flex items-start gap-2">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
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