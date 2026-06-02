import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Calendar, MapPin, ExternalLink, Sparkles, Wind, Droplets, Newspaper } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { pt, enGB, es, fr, de, nl } from 'date-fns/locale';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';

const dateFnsLocales = { pt, en: enGB, es, fr, de, nl };

const DATE_FORMAT = { pt: "d 'de' MMM", en: 'd MMM', es: "d 'de' MMM", fr: 'd MMM', de: 'd. MMM', nl: 'd MMM' };

const WMO_MAP = {
  0:  { emoji: '☀️', key: 'weather_clear' },
  1:  { emoji: '🌤️', key: 'weather_mainly_clear' },
  2:  { emoji: '⛅', key: 'weather_partly_cloudy' },
  3:  { emoji: '☁️', key: 'weather_cloudy' },
  45: { emoji: '🌫️', key: 'weather_fog' },
  48: { emoji: '🌫️', key: 'weather_fog' },
  51: { emoji: '🌦️', key: 'weather_drizzle' },
  53: { emoji: '🌦️', key: 'weather_drizzle' },
  55: { emoji: '🌦️', key: 'weather_drizzle' },
  61: { emoji: '🌧️', key: 'weather_rain' },
  63: { emoji: '🌧️', key: 'weather_rain' },
  65: { emoji: '🌧️', key: 'weather_rain' },
  71: { emoji: '❄️', key: 'weather_snow' },
  73: { emoji: '❄️', key: 'weather_snow' },
  75: { emoji: '❄️', key: 'weather_snow' },
  80: { emoji: '🌦️', key: 'weather_showers' },
  81: { emoji: '🌦️', key: 'weather_showers' },
  82: { emoji: '⛈️', key: 'weather_showers' },
  95: { emoji: '⛈️', key: 'weather_thunder' },
  96: { emoji: '⛈️', key: 'weather_thunder' },
  99: { emoji: '⛈️', key: 'weather_thunder' },
};

function WeatherWidget({ lang }) {
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=37.0194&longitude=-7.9304&current=temperature_2m,weathercode,windspeed_10m,relativehumidity_2m&timezone=Europe/Lisbon&forecast_days=1')
      .then(r => r.json())
      .then(data => setWeather(data.current))
      .catch(() => {});
  }, []);

  if (!weather) {
    return (
      <div className="bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 border border-sky-100 dark:border-sky-800 rounded-2xl p-5 animate-pulse h-28" />
    );
  }

  const info = WMO_MAP[weather.weathercode] || { emoji: '🌡️', key: 'weather_clear' };

  return (
    <div className="bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 border border-sky-100 dark:border-sky-800 rounded-2xl p-5">
      <p className="text-xs text-sky-600 dark:text-sky-400 font-semibold uppercase tracking-wide mb-3">
        {t(lang, 'weather_title')}
      </p>
      <div className="flex items-center gap-4">
        <span className="text-4xl">{info.emoji}</span>
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground">{Math.round(weather.temperature_2m)}°C</span>
            <span className="text-sm text-muted-foreground">{t(lang, info.key)}</span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Wind className="w-3 h-3" /> {Math.round(weather.windspeed_10m)} km/h
            </span>
            <span className="flex items-center gap-1">
              <Droplets className="w-3 h-3" /> {weather.relativehumidity_2m}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

const categoryEmojis = {
  festival: '🎭', show: '🎵', cultural: '🏛️', sports: '🏄',
  gastronomy: '🍽️', promo: '📰', other: '⭐',
};

function EventCard({ item, lang }) {
  const emoji = categoryEmojis[item.category] || '⭐';
  const locale = dateFnsLocales[lang] || dateFnsLocales.en;
  const fmt = DATE_FORMAT[lang] || 'd MMM';

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    try { return format(parseISO(dateStr), fmt, { locale }); } catch { return dateStr; }
  };

  const dateLabel = item.date_from
    ? (item.date_to && item.date_to !== item.date_from
        ? `${formatDate(item.date_from)} – ${formatDate(item.date_to)}`
        : formatDate(item.date_from))
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
              <Calendar className="w-3 h-3" />{dateLabel}
            </span>
          )}
          {item.location && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />{item.location}
            </span>
          )}
        </div>
      </div>
      {item.external_link && (
        <>
          <a href={item.external_link} target="_blank" rel="noopener noreferrer" className="absolute inset-0" aria-label={item.title} />
          <div className="px-5 pb-4">
            <span className="inline-flex items-center gap-1 text-xs text-primary/80 group-hover:text-primary transition-colors">
              <ExternalLink className="w-3 h-3" />{t(lang, 'feed_more_info')}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

export default function AlgarveNewsFeed() {
  const { lang } = useLang();

  const { data: events = [] } = useQuery({
    queryKey: ['algarve-events'],
    queryFn: () => base44.entities.AlgarveNews.filter({ active: true, data_source: 'google_calendar' }, 'date_from', 6),
    staleTime: 1000 * 60 * 30,
  });

  const { data: news = [] } = useQuery({
    queryKey: ['algarve-news', lang],
    queryFn: () => base44.entities.AlgarveNews.filter({ active: true, data_source: 'manual', lang }, '-created_date', 3),
    staleTime: 1000 * 60 * 30,
  });

  return (
    <section className="py-12 px-4 bg-muted/40">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="w-5 h-5 text-secondary" />
          <h2 className="text-xl font-semibold text-foreground font-display">
            {t(lang, 'feed_title')}
          </h2>
        </div>

        {/* Weather + Events row */}
        <div className={`grid gap-4 mb-6 ${events.length > 0 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
          <WeatherWidget lang={lang} />
          {events.length > 0 && events.slice(0, 2).map(item => (
            <EventCard key={item.id} item={item} lang={lang} />
          ))}
        </div>

        {/* Remaining events */}
        {events.length > 2 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">{t(lang, 'feed_events_badge')}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.slice(2).map(item => <EventCard key={item.id} item={item} lang={lang} />)}
            </div>
          </div>
        )}

        {/* News section */}
        {news.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Newspaper className="w-4 h-4 text-secondary" />
              <span className="text-sm font-semibold text-foreground">{t(lang, 'feed_news_badge')}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {news.map(item => <EventCard key={item.id} item={item} lang={lang} />)}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}