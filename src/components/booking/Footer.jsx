import React from 'react';
import { Plane, Phone, Mail, MapPin, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';

export default function Footer() {
  const { lang } = useLang();

  return (
    <footer className="bg-foreground text-background/80 py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Plane className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display text-xl font-bold text-background">Transfers Algarvestar</span>
            </div>
            <p className="text-sm text-background/60 leading-relaxed">{t(lang, 'footer_desc')}</p>
          </div>

          <div>
            <h4 className="font-bold text-background mb-4">{t(lang, 'footer_destinations')}</h4>
            <ul className="space-y-2 text-sm text-background/60">
              <li>Aeroporto Faro → Albufeira</li>
              <li>Aeroporto Faro → Vilamoura</li>
              <li>Aeroporto Faro → Lagos</li>
              <li>Aeroporto Faro → Lisboa</li>
              <li>Aeroporto Faro → Sevilha</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-background mb-4">{t(lang, 'footer_contact')}</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-background/60">
                <Phone className="w-4 h-4 text-primary" /> +351 913 956 971
              </li>
              <li className="flex items-center gap-2 text-background/60">
                <Mail className="w-4 h-4 text-primary" /> info@transfers-algarvestar.com
              </li>
              <li className="flex items-center gap-2 text-background/60">
                <MessageCircle className="w-4 h-4 text-green-400" />
                <a href="https://wa.me/351913956971" target="_blank" rel="noopener noreferrer" className="hover:text-green-400 transition-colors">
                  WhatsApp: +351 913 956 971
                </a>
              </li>
              <li className="flex items-center gap-2 text-background/60">
                <MapPin className="w-4 h-4 text-primary" /> Aeroporto de Faro, Algarve
              </li>
            </ul>
          </div>
        </div>

        {/* Social Media Buttons */}
        <div className="border-t border-background/10 mt-10 pt-8 flex flex-col items-center gap-4">
          <p className="text-sm text-background/50">{t(lang, 'social_follow')}</p>
          <div className="flex flex-wrap justify-center gap-3">
            {/* Instagram */}
            <a
              href="https://www.instagram.com/algarvestar/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white transition-opacity hover:opacity-80"
              style={{ background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              Instagram
            </a>

            {/* Facebook */}
            <a
              href="https://www.facebook.com/transfersalgarvestar"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white bg-[#1877F2] transition-opacity hover:opacity-80"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook
            </a>

            {/* TripAdvisor */}
            <a
              href="https://www.tripadvisor.pt/Attraction_Review-g189113-d12539956-Reviews-Transfers_Algarvestar-Armacao_de_Pera_Faro_District_Algarve.html"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white bg-[#34E0A1] transition-opacity hover:opacity-80"
              style={{ color: '#000' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2c5.514 0 10 4.486 10 10s-4.486 10-10 10S2 17.514 2 12 6.486 2 12 2zm-4.5 6.5c-1.933 0-3.5 1.567-3.5 3.5s1.567 3.5 3.5 3.5 3.5-1.567 3.5-3.5-1.567-3.5-3.5-3.5zm9 0c-1.933 0-3.5 1.567-3.5 3.5s1.567 3.5 3.5 3.5 3.5-1.567 3.5-3.5-1.567-3.5-3.5-3.5zm-9 1.5c1.105 0 2 .895 2 2s-.895 2-2 2-2-.895-2-2 .895-2 2-2zm9 0c1.105 0 2 .895 2 2s-.895 2-2 2-2-.895-2-2 .895-2 2-2zm-4.5-3.5c-1.38 0-2.63.56-3.536 1.464L8 8c.672-.672 1.546-1.127 2.523-1.376C9.61 7.315 9 8.338 9 9.5c0 1.657 1.343 3 3 3s3-1.343 3-3c0-1.162-.61-2.185-1.523-2.876.977.249 1.851.704 2.523 1.376l-.464-.036C14.63 7.06 13.38 6.5 12 6.5z"/>
              </svg>
              TripAdvisor
            </a>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-background/40">
          <span>© {new Date().getFullYear()} Transfers Algarvestar. {t(lang, 'footer_rights')}</span>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/sobre" className="hover:text-background/70 transition-colors">{t(lang, 'about_title')}</Link>
            <Link to="/contacto" className="hover:text-background/70 transition-colors">{t(lang, 'contact_title')}</Link>
            <Link to="/politica-de-privacidade" className="hover:text-background/70 transition-colors">{t(lang, 'footer_privacy')}</Link>
            <Link to="/termos-de-servico" className="hover:text-background/70 transition-colors">{t(lang, 'footer_terms')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}