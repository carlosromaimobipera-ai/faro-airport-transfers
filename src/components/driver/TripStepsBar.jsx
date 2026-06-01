import React from 'react';
import { Car, MapPin, Users, CheckCircle2 } from 'lucide-react';

const STEPS = [
  { key: 'on_the_way', label: 'A caminho',  icon: Car,          color: 'bg-blue-500' },
  { key: 'on_site',    label: 'No local',   icon: MapPin,       color: 'bg-orange-500' },
  { key: 'on_board',   label: 'On Board',   icon: Users,        color: 'bg-purple-500' },
  { key: 'done',       label: 'Concluída',  icon: CheckCircle2, color: 'bg-green-500' },
];

const ORDER = ['on_the_way', 'on_site', 'on_board', 'done'];

export default function TripStepsBar({ driverStatus, onStep, disabled }) {
  const currentIdx = ORDER.indexOf(driverStatus);

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div className="flex items-center gap-1">
        {STEPS.map((step, i) => {
          const done = i <= currentIdx;
          return (
            <React.Fragment key={step.key}>
              <div className={`flex-1 h-1.5 rounded-full transition-colors ${done ? 'bg-primary' : 'bg-muted'}`} />
            </React.Fragment>
          );
        })}
      </div>

      {/* Step buttons */}
      <div className="grid grid-cols-4 gap-1.5">
        {STEPS.map((step, i) => {
          const isDone = i <= currentIdx;
          const isActive = i === currentIdx;
          const isNext = i === currentIdx + 1 || (currentIdx === -1 && i === 0);
          const Icon = step.icon;

          return (
            <button
              key={step.key}
              onClick={() => !disabled && isNext && onStep(step.key)}
              disabled={disabled || (!isNext && !isDone) || isDone}
              className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-xs font-medium transition-all border
                ${isDone
                  ? 'bg-green-50 border-green-200 text-green-700 opacity-70'
                  : isNext
                  ? `${step.color} text-white border-transparent shadow-sm hover:opacity-90 active:scale-95`
                  : 'bg-muted border-transparent text-muted-foreground opacity-40'
                }`}
            >
              <Icon className="w-4 h-4" />
              <span className="leading-tight text-center">{step.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}