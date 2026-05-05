import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Briefcase, Check } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function VehicleCard({ vehicle, selected, onSelect, price }) {
  return (
    <Card
      onClick={() => onSelect(vehicle.id)}
      className={cn(
        "cursor-pointer transition-all duration-300 overflow-hidden group",
        "hover:shadow-lg hover:-translate-y-1",
        selected
          ? "ring-2 ring-primary shadow-lg shadow-primary/10"
          : "border-border/60 hover:border-primary/30"
      )}
    >
      <div className="relative h-40 overflow-hidden">
        <img
          src={vehicle.image}
          alt={vehicle.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {selected && (
          <div className="absolute top-3 right-3 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <Check className="w-4 h-4 text-primary-foreground" />
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
          <h3 className="text-white font-bold text-lg">{vehicle.name}</h3>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {vehicle.seats} lugares
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Briefcase className="w-3 h-3" />
              {vehicle.luggage} malas
            </Badge>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            €{vehicle.pricePerKm.toFixed(2)}/km
          </span>
          {price > 0 && (
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">€{price.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">preço total</p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {vehicle.features.slice(0, 3).map((feature) => (
            <span key={feature} className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {feature}
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
}