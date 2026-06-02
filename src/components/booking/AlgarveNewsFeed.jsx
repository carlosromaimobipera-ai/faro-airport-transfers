import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Calendar, MapPin, ExternalLink, Sparkles } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';

const categoryEmojis = {
  festival: '🎭',
  show: '🎵',
  cultural: '🏛️',
  sports: '🏄',
  gastronomy: '🍽️',
  promo: '🎁',
  other: '⭐'
};

function EventCard({ item }) {
  const emoji = categoryEmojis[item.category] || '⭐';

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      return format(parseISO(dateStr), "d 'de' MMMM", { locale: pt });
    } catch {
      return dateStr;
    }
  };

  const dateLabel = item.date_from
    ? item.date_to && item.date_to !== item.date_from
      ? `${formatDate(item.date_from)} – ${formatDate(item.date_to)}`
      : formatDate(item.date_from)
    : null;

  return (
    <div className="group relative bg-white dark:bg-card rounded-2xl shadow-sm border border-border hover:shadow-md hover:border-primary/30 transition-all duration-300 overflow-hidden">
      <div className="p-5">
        <div className="flex items-start gap-3">
          <div className="text-2xl flex-shrink-0 mt-0.5">{emoji}</div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {item.title}
            </h3>
            {item.description && (
              <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                {item.description}
              </p>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {dateLabel && (
            <span className="inline-flex items-center gap-1 text-xs text-primary font-medium">
              <Calendar className="w-3 h-3" />
              {dateLabel}
            </span>
          )}
          {item.location && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              {item.location}
            </span>
          )}
        </div>
      </div>

      {item.external_link && (
        <a
          href={item.external_link}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0"
          aria-label={item.title}
        />
      )}
      {item.external_link && (
        <div className="px-5 pb-4">
          <span className="inline-flex items-center gap-1 text-xs text-primary/80 group-hover:text-primary transition-colors">
            <ExternalLink className="w-3 h-3" />
            Mais informações
          </span>
        </div>
      )}
    </div>
  );
}

export default function AlgarveNewsFeed() {
  const { data: newsItems = [], isLoading } = useQuery({
    queryKey: ['algarve-news'],
    queryFn: () => base44.entities.AlgarveNews.filter({ active: true }, 'priority', 6),
    staleTime: 1000 * 60 * 30, // 30 min cache
  });

  if (isLoading) return null;
  if (!newsItems.length) return null;

  return (
    <section className="py-12 px-4 bg-muted/40">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="w-5 h-5 text-secondary" />
          <h2 className="text-xl font-semibold text-foreground font-display">
            O que há no Algarve
          </h2>
          <span className="ml-2 text-xs bg-secondary/20 text-secondary font-medium px-2 py-0.5 rounded-full">
            Próximos eventos
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {newsItems.map((item) => (
            <EventCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}