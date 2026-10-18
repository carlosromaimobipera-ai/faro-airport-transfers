import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import React, { Suspense, lazy, useEffect } from 'react';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Home from '@/pages/Home';
import { LanguageProvider } from '@/lib/LanguageContext';
import ThemeProvider from '@/lib/ThemeProvider';
import { CurrencyProvider } from '@/lib/CurrencyContext';
import BottomTabBar from '@/components/mobile/BottomTabBar';
import MobileTopBar from '@/components/mobile/MobileTopBar';
import WhatsAppFloatingButton from '@/components/WhatsAppFloatingButton';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import { Navigate } from 'react-router-dom';

// Code-split major pages for faster WebView loading
const About = lazy(() => import('@/pages/About'));
const Contact = lazy(() => import('@/pages/Contact'));
const Confirmation = lazy(() => import('@/pages/Confirmation'));
const Admin = lazy(() => import('@/pages/Admin'));
const Review = lazy(() => import('@/pages/Review'));
const Driver = lazy(() => import('@/pages/Driver'));
const CustomerArea = lazy(() => import('@/pages/CustomerArea'));
const PrivacyPolicy = lazy(() => import('@/pages/PrivacyPolicy'));
const DeleteAccount = lazy(() => import('@/pages/DeleteAccount'));
const TermsOfService = lazy(() => import('@/pages/TermsOfService'));
const TransferFaro = lazy(() => import('@/pages/TransferFaro'));
const TransferLisbon = lazy(() => import('@/pages/TransferLisbon'));
const TransferSeville = lazy(() => import('@/pages/TransferSeville'));
const ChauffeurPerHour = lazy(() => import('@/pages/ChauffeurPerHour'));

const PageLoader = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
  </div>
);

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, user, isAuthenticated } = useAuth();
  const location = useLocation();
  const isHome = location.pathname === '/';

  // SIGNUP conversion — fires once on first authenticated render of a freshly-created user
  useEffect(() => {
    if (typeof window === 'undefined' || !user || !user.id) return;
    // brand-new signup, not a returning login: created_date within the
    // delayed OTP/resend window (Google/social signups are near-instant)
    const createdDate = String(user.created_date || '');
    const createdDateUtc = /(?:Z|[+-]\d{2}:?\d{2})$/.test(createdDate)
        ? createdDate
        : createdDate + 'Z';
    const createdAtMs = Date.parse(createdDateUtc);
    const isNewSignup = Number.isFinite(createdAtMs) &&
        Date.now() - createdAtMs < 24 * 60 * 60 * 1000;
    const key = '_aw_signup_fired_AW-18386612747/yRwfCN204eAcEIvktb9E_' + user.id;
    if (!isNewSignup || localStorage.getItem(key)) return;
    // gtag may not exist yet (Layout's bootstrap effect runs after this
    // child effect), so retry briefly rather than skipping for good
    let tries = 0;
    const fire = () => {
      if (!window.gtag) { if (tries++ < 20) setTimeout(fire, 250); return; }
      // re-check inside the callback: a remount can start a second
      // retry loop that also passed the guard before gtag existed
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, '1');
      window.gtag('event', 'conversion', {
        send_to: 'AW-18386612747/yRwfCN204eAcEIvktb9E',
        transaction_id: user.id,
      });
    };
    fire();
  }, [user]);

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  return (
    <>
      <MobileTopBar />
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={`route-content min-h-screen overflow-y-auto ${isHome ? 'pt-20 md:pt-0' : 'pt-20'}`}
        >
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Auth routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Public routes */}
              <Route path="/" element={<Home />} />
              <Route path="/confirmacao" element={<Confirmation />} />
              <Route path="/review" element={<Review />} />
              <Route path="/sobre" element={<About />} />
              <Route path="/contacto" element={<Contact />} />
              <Route path="/politica-de-privacidade" element={<PrivacyPolicy />} />
              <Route path="/eliminar-conta" element={<DeleteAccount />} />
              <Route path="/termos-de-servico" element={<TermsOfService />} />

              {/* SEO landing pages */}
              <Route path="/transfers/faro" element={<TransferFaro />} />
              <Route path="/transfers/lisbon" element={<TransferLisbon />} />
              <Route path="/transfers/seville" element={<TransferSeville />} />
              <Route path="/chauffeur-por-hora" element={<ChauffeurPerHour />} />

              {/* Protected routes */}
              <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
                <Route path="/admin" element={<Admin />} />
                <Route path="/driver" element={<Driver />} />
                <Route path="/area-cliente" element={<CustomerArea />} />
              </Route>

              <Route path="*" element={<PageNotFound />} />
            </Routes>
          </Suspense>
        </motion.div>
      </AnimatePresence>
    </>
  );
};

function App() {
  // Google Ads gtag bootstrap — runs once
  useEffect(() => {
    if (typeof window === 'undefined' || window.__gads_loaded) return;
    window.__gads_loaded = true;
    window.dataLayer = window.dataLayer || [];
    const inIframe = (() => { try { return window.self !== window.top; } catch { return true; } })();
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
      if (inIframe) {
        try {
          const args = Array.prototype.slice.call(arguments);
          const cmd = args[0];
          window.parent.postMessage({
            type: 'base44_gtag_event',
            event: {
              source: 'gtag',
              timestamp: new Date().toLocaleTimeString(),
              command: cmd,
              params: args.slice(1),
              type: cmd === 'event' ? (args[1] || 'event') : cmd,
            },
          }, '*');
        } catch (_e) { /* relay must not break gtag */ }
      }
    };
    const s = document.createElement('script');
    s.src = 'https://www.googletagmanager.com/gtag/js?id=AW-18386612747';
    s.async = true;
    document.head.appendChild(s);
    window.gtag('js', new Date());
    window.gtag('config', 'AW-18386612747', { send_page_view: false });
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <LanguageProvider>
          <CurrencyProvider>
          <QueryClientProvider client={queryClientInstance}>
            <Router>
              <AuthenticatedApp />
              <BottomTabBar />
              <WhatsAppFloatingButton />
            </Router>
            <Toaster />
          </QueryClientProvider>
          </CurrencyProvider>
        </LanguageProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App