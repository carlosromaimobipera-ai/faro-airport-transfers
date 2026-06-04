import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import React, { Suspense, lazy } from 'react';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Home from '@/pages/Home';
import { LanguageProvider } from '@/lib/LanguageContext';
import ThemeProvider from '@/lib/ThemeProvider';
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

const PageLoader = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
  </div>
);

const RouteWrapper = ({ children }) => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -100, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="route-content min-h-screen overflow-y-auto"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const location = useLocation();

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
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="route-content min-h-screen overflow-y-auto pt-14 md:pt-0"
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
  return (
    <ThemeProvider>
      <AuthProvider>
        <LanguageProvider>
          <QueryClientProvider client={queryClientInstance}>
            <Router>
              <AuthenticatedApp />
              <BottomTabBar />
              <WhatsAppFloatingButton />
            </Router>
            <Toaster />
          </QueryClientProvider>
        </LanguageProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App