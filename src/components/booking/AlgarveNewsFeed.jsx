import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Calendar, MapPin, ExternalLink, Wind, Droplets, ArrowRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { pt, enGB, es, fr, de, nl } from 'date-fns/locale';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';

const dateFnsLocales = { pt, en: enGB, es, fr, de, nl };
const DATE_FORMAT = { pt: "d 'de' MMM", en: 'd MMM', es: "d 'de' MMM", fr: 'd MMM', de: 'd. MMM', nl: 'd MMM' };

const WMO_MAP = {
  0:  { emoji: '☀️', key: 'weather_clear', bg: 'from-amber-400 to-orange-400' },
  1:  { emoji: '🌤️', key: 'weather_mainly_clear', bg: 'from-amber-300 to-sky-400' },
  2:  { emoji: '⛅', key: 'weather_partly_cloudy', bg: 'from-sky-300 to-slate-400' },
  3:  { emoji: '☁️', key: 'weather_cloudy', bg: 'from-slate-400 to-slate-500' },
  45: { emoji: '🌫️', key: 'weather_fog', bg: 'from-slate-300 to-slate-400' },
  48: { emoji: '🌫️', key: 'weather_fog', bg: 'from-slate-300 to-slate-400' },
  51: { emoji: '🌦️', key: 'weather_drizzle', bg: 'from-sky-400 to-blue-500' },
  53: { emoji: '🌦️', key: 'weather_drizzle', bg: 'from-sky-400 to-blue-500' },
  55: { emoji: '🌦️', key: 'weather_drizzle', bg: 'from-sky-400 to-blue-500' },
  61: { emoji: '🌧️', key: 'weather_rain', bg: 'from-blue-500 to-blue-700' },
  63: { emoji: '🌧️', key: 'weather_rain', bg: 'from-blue-500 to-blue-700' },
  65: { emoji: '🌧️', key: 'weather_rain', bg: 'from-blue-500 to-blue-700' },
  80: { emoji: '🌦️', key: 'weather_showers', bg: 'from-sky-400 to-blue-600' },
  81: { emoji: '🌦️', key: 'weather_showers', bg: 'from-sky-400 to-blue-600' },
  95: { emoji: '⛈️', key: 'weather_thunder', bg: 'from-slate-600 to-slate-800' },
  99: { emoji: '⛈️', key: 'weather_thunder', bg: 'from-slate-600 to-slate-800' },
};

const categoryConfig = {
  festival: { emoji: '🎭', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  show:     { emoji: '🎵', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300' },
  cultural: { emoji: '🏛️', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  sports:   { emoji: '🏄', color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300' },
  gastronomy:{ emoji: '🍽️', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
  promo:    { emoji: '📰', color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  other:    { emoji: '⭐', color: 'bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-300' },
};

function WeatherBanner({ lang }) {
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=37.0194&longitude=-7.9304&current=temperature_2m,weathercode,windspeed_10m,relativehumidity_2m&timezone=Europe/Lisbon&forecast_days=1')
      .then(r => r.json())
      .then(data => setWeather(data.current))
      .catch(() => {});
  }, []);

  if (!weather) return <div className="h-24 rounded-2xl bg-muted animate-pulse" />;

  const info = WMO_MAP[weather.weathercode] || { emoji: '🌡️', key: 'weather_clear', bg: 'from-sky-400 to-blue-500' };

  return (
    <div className={`rounded-2xl bg-gradient-to-r ${info.bg} p-5 text-white flex items-center justify-between`}>
      <div className="flex items-center gap-4">
        <span className="text-5xl drop-shadow">{info.emoji}</span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest opacity-80 mb-0.5">Algarve</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold">{Math.round(weather.temperature_2m)}°C</span>
            <span className="text-sm opacity-90">{t(lang, info.key)}</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-1.5 text-sm opacity-80 text-right">
        <span className="flex items-center justify-end gap-1.5">
          <Wind className="w-3.5 h-3.5" /> {Math.round(weather.windspeed_10m)} km/h
        </span>
        <span className="flex items-center justify-end gap-1.5">
          <Droplets className="w-3.5 h-3.5" /> {weather.relativehumidity_2m}%
        </span>
      </div>
    </div>
  );
}

function EventCard({ item, lang }) {
  const cat = categoryConfig[item.category] || categoryConfig.other;
  const locale = dateFnsLocales[lang] || dateFnsLocales.en;
  const fmt = DATE_FORMAT[lang] || 'd MMM';

  const formatDate = (d) => {
    if (!d) return null;
    try { return format(parseISO(d), fmt, { locale }); } catch { return d; }
  };

  const dateLabel = item.date_from
    ? (item.date_to && item.date_to !== item.date_from
        ? `${formatDate(item.date_from)} – ${formatDate(item.date_to)}`
        : formatDate(item.date_from))
    : null;

  const handleClick = () => {
    if (item.external_link) window.open(item.external_link, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      onClick={handleClick}
      className={`flex-shrink-0 w-64 sm:w-72 bg-card border border-border rounded-2xl overflow-hidden flex flex-col transition-all duration-200 ${item.external_link ? 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/40' : ''}`}
    >
      {/* Color accent bar by category */}
      <div className={`h-1.5 w-full ${item.category === 'festival' ? 'bg-purple-400' : item.category === 'show' ? 'bg-pink-400' : item.category === 'cultural' ? 'bg-amber-400' : item.category === 'sports' ? 'bg-sky-400' : item.category === 'gastronomy' ? 'bg-orange-400' : item.category === 'promo' ? 'bg-green-400' : 'bg-slate-300'}`} />

      {item.image_url && (
        <div className="w-full h-36 overflow-hidden">
          <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="p-4 flex flex-col flex-1">
        {/* Category badge */}
        <div className="flex items-center justify-between mb-2">
          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${cat.color}`}>
            {cat.emoji} {item.category || 'other'}
          </span>
          {item.external_link && (
            <ExternalLink className="w-3.5 h-3.5 text-primary/50" />
          )}
        </div>

        <h3 className="font-bold text-foreground text-sm leading-snug line-clamp-2 mb-1.5 flex-1">
          {item.title}
        </h3>

        {item.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-3">
            {item.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 mt-auto">
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
    </div>
  );
}

function HorizontalScroll({ title, icon: Icon, iconColor, items, lang }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4 px-1">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">{title}</h3>
        <span className="text-xs text-muted-foreground ml-1">({items.length})</span>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-hide -mx-4 px-4">
        {items.map(item => (
          <div key={item.id} className="snap-start">
            <EventCard item={item} lang={lang} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AlgarveNewsFeed() {
  const { lang } = useLang();

  const { data: events = [] } = useQuery({
    queryKey: ['algarve-events'],
    queryFn: () => base44.entities.AlgarveNews.filter({ active: true, data_source: 'google_calendar' }, 'date_from', 10),
    staleTime: 1000 * 60 * 30,
  });

  const { data: news = [] } = useQuery({
    queryKey: ['algarve-news', lang],
    queryFn: () => base44.entities.AlgarveNews.filter({ active: true, data_source: 'manual', lang }, '-created_date', 6),
    staleTime: 1000 * 60 * 30,
  });

  return (
    <section className="py-10 bg-background">
      <div className="max-w-6xl mx-auto px-4">

        {/* Weather Banner */}
        <div className="mb-8">
          <WeatherBanner lang={lang} />
        </div>

        {/* Events horizontal scroll */}
        <HorizontalScroll
          title={t(lang, 'feed_events_badge')}
          icon={Calendar}
          iconColor="text-primary"
          items={events}
          lang={lang}
        />

        {/* Tips/News horizontal scroll */}
        <HorizontalScroll
          title={t(lang, 'feed_news_badge')}
          icon={ArrowRight}
          iconColor="text-secondary"
          items={news}
          lang={lang}
        />

      </div>
    </section>
  );
}