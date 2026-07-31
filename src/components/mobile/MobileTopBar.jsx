import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';

// Tab root routes — show logo, no back button
const TAB_ROOTS = ['/', '/area-cliente', '/driver', '/admin'];

// Map routes to page titles (translation keys or static strings)
const ROUTE_TITLES = {
  '/sobre': 'nav_about',
  '/contacto': 'nav_contact',
  '/confirmacao': 'confirmation_title',
  '/review': 'review_title',
  '/politica-de-privacidade': 'privacy_title',
  '/termos-de-servico': 'terms_title',
  '/eliminar-conta': 'delete_account_title',
};

export default function MobileTopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { lang } = useLang();

  const isTabRoot = TAB_ROOTS.includes(location.pathname);
  const titleKey = ROUTE_TITLES[location.pathname];

  // Resolve title: try i18n key first, fallback to static string
  const title = titleKey ? (t(lang, titleKey) || titleKey) : null;

  return (
    <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-b border-border safe-area-top">
      <div className="flex items-center h-14 px-4 gap-3">
        {isTabRoot ? (
          // Logo on tab roots
          <div className="flex items-center gap-2 flex-1">
            <img
              src="https://media.base44.com/images/public/69f9fe03f147edc32575e815/logo.png"
              alt="Transfers Algarve"
              className="h-8 object-contain"
            />
          </div>
        ) : (
          // Back button + title on child routes
          <>
            <button
              onClick={() => navigate(-1)}
              aria-label="Voltar"
              className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            {title && (
              <span className="font-semibold text-base flex-1 truncate">{title}</span>
            )}
          </>
        )}
      </div>
    </div>
  );
}