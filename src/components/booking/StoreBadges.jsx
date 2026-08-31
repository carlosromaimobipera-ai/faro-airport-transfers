import React from 'react';

const APP_STORE_URL = 'https://apps.apple.com/pt/app/transfers-algarvestar/id6782687502';
const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=com.base69f9fe03f147edc32575e815.app&pcampaignid=web_share';

export default function StoreBadges({ className = '' }) {
  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      {/* App Store */}
      <a
        href={APP_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2.5 px-4 py-2 rounded-lg bg-black hover:opacity-85 transition-opacity"
        aria-label="Descarregar na App Store"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
        </svg>
        <div className="flex flex-col leading-tight text-left">
          <span className="text-[10px] text-white/80 font-medium">Descarregar na</span>
          <span className="text-sm text-white font-semibold">App Store</span>
        </div>
      </a>

      {/* Google Play */}
      <a
        href={GOOGLE_PLAY_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2.5 px-4 py-2 rounded-lg bg-black hover:opacity-85 transition-opacity"
        aria-label="Disponível no Google Play"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 512 512">
          <path fill="#00C3FF" d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1z"/>
          <path fill="#FFCE00" d="M47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0z"/>
          <path fill="#00F076" d="M47 512c4.2 2.3 8.9 3.5 13.7 3.5 5.3 0 10.5-1.5 15.1-4.4l299.6-172.9-60.9-60.9L47 512z"/>
          <path fill="#FF3A44" d="M471.7 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8z"/>
        </svg>
        <div className="flex flex-col leading-tight text-left">
          <span className="text-[10px] text-white/80 font-medium uppercase tracking-wide">Disponível no</span>
          <span className="text-sm text-white font-semibold">Google Play</span>
        </div>
      </a>
    </div>
  );
}