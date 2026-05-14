import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Trash2, AlertTriangle, ArrowLeft, Loader2, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';

export default function DeleteAccount() {
  const { lang } = useLang();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    base44.auth.isAuthenticated().then(async (authed) => {
      if (authed) {
        const me = await base44.auth.me();
        setUser(me);
      }
      setAuthLoading(false);
    });
  }, []);

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    await base44.auth.updateMe({ account_deleted: true });
    await base44.auth.logout('/');
  };

  const handleLogin = () => {
    base44.auth.redirectToLogin(window.location.pathname);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="bg-destructive text-destructive-foreground px-4 pt-10 pb-14">
          <div className="max-w-lg mx-auto">
            <Link to="/" className="inline-flex items-center gap-2 text-destructive-foreground/70 hover:text-destructive-foreground text-sm mb-6">
              <ArrowLeft className="w-4 h-4" /> {t(lang, 'customer_back')}
            </Link>
            <h1 className="text-2xl font-bold font-display">{t(lang, 'delete_account_title')}</h1>
            <p className="text-destructive-foreground/70 text-sm mt-1">{t(lang, 'delete_account_subtitle')}</p>
          </div>
        </div>
        <div className="max-w-lg mx-auto px-4 -mt-8 pb-12 w-full">
          <Card className="shadow-xl">
            <CardContent className="p-8 space-y-6 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <User className="w-8 h-8 text-primary" />
              </div>
              <p className="text-muted-foreground text-sm">{t(lang, 'delete_account_login_required')}</p>
              <Button onClick={handleLogin} className="w-full h-12 text-base font-semibold gap-2">
                <User className="w-5 h-5" />
                {t(lang, 'customer_login_btn')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Logged in
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-destructive text-destructive-foreground px-4 pt-10 pb-16">
        <div className="max-w-lg mx-auto">
          <Link to="/area-cliente" className="inline-flex items-center gap-2 text-destructive-foreground/70 hover:text-destructive-foreground text-sm mb-6">
            <ArrowLeft className="w-4 h-4" /> {t(lang, 'customer_area_title')}
          </Link>
          <h1 className="text-2xl font-bold font-display">{t(lang, 'delete_account_title')}</h1>
          <p className="text-destructive-foreground/70 text-sm mt-1">{user.email}</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-8 pb-12 space-y-4">
        <Card className="shadow-xl border-destructive/30">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0 mt-1">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground mb-1">{t(lang, 'delete_account_warning_title')}</h2>
                <p className="text-sm text-muted-foreground">{t(lang, 'delete_account_warning_desc')}</p>
              </div>
            </div>

            <ul className="space-y-2 pl-2">
              {[
                t(lang, 'delete_account_item1'),
                t(lang, 'delete_account_item2'),
                t(lang, 'delete_account_item3'),
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            <Button
              variant="destructive"
              className="w-full gap-2 h-12"
              onClick={() => setShowDialog(true)}
            >
              <Trash2 className="w-4 h-4" />
              {t(lang, 'delete_account_btn')}
            </Button>

            <Link to="/area-cliente" className="block">
              <Button variant="outline" className="w-full">
                {t(lang, 'delete_account_cancel')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">{t(lang, 'delete_account_confirm_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(lang, 'delete_account_confirm_desc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t(lang, 'delete_account_cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isDeleting ? t(lang, 'delete_account_deleting') : t(lang, 'delete_account_confirm_btn')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}