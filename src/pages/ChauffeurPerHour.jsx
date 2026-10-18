import React from 'react';
import { Timer } from 'lucide-react';
import ServiceLandingPage from '@/components/booking/ServiceLandingPage';
import { useLang } from '@/lib/LanguageContext';
import { chauffeurContent } from '@/lib/chauffeurContent';

export default function ChauffeurPerHour() {
  const { lang } = useLang();
  const content = chauffeurContent[lang] || chauffeurContent.pt;

  return (
    <ServiceLandingPage content={content} initialService="hourly" BadgeIcon={Timer} />
  );
}