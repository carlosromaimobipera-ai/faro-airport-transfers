import React from 'react';
import { MapPin } from 'lucide-react';
import ServiceLandingPage from '@/components/booking/ServiceLandingPage';
import { useLang } from '@/lib/LanguageContext';
import { dayTripContent } from '@/lib/dayTripContent';

export default function TransferDayTrips() {
  const { lang } = useLang();
  const content = dayTripContent[lang] || dayTripContent.pt;

  return (
    <ServiceLandingPage content={content} initialService="daytrip" BadgeIcon={MapPin} />
  );
}