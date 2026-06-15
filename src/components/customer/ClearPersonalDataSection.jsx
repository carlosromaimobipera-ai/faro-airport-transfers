import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ShieldOff, CheckCircle2 } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';

const LABELS = {
  pt: { btn: 'Apagar os meus dados pessoais', title: 'Apagar dados pessoais?', desc: 'Esta ação irá anonimizar os seus dados pessoais (nome, email, telefone e notas) em todas as reservas. A sua conta continuará ativa. Esta ação não pode ser desfeita.', cancel: 'Cancelar', confirm: 'Sim, apagar dados', doing: 'A apagar...', done: 'Dados pessoais apagados das reservas.' },
  en: { btn: 'Delete my personal data', title: 'Delete personal data?', desc: 'This will anonymize your personal data (name, email, phone and notes) across all bookings. Your account will remain active. This action cannot be undone.', cancel: 'Cancel', confirm: 'Yes, delete data', doing: 'Deleting...', done: 'Personal data removed from bookings.' },
  es: { btn: 'Eliminar mis datos personales', title: '¿Eliminar datos personales?', desc: 'Esta acción anonimizará sus datos personales (nombre, email, teléfono y notas) en todas las reservas. Su cuenta permanecerá activa.', cancel: 'Cancelar', confirm: 'Sí, eliminar', doing: 'Eliminando...', done: 'Datos personales eliminados de las reservas.' },
  fr: { btn: 'Supprimer mes données personnelles', title: 'Supprimer les données personnelles ?', desc: 'Cette action anonymisera vos données personnelles (nom, email, téléphone et notes) sur toutes les réservations. Votre compte restera actif.', cancel: 'Annuler', confirm: 'Oui, supprimer', doing: 'Suppression...', done: 'Données personnelles supprimées des réservations.' },
  de: { btn: 'Meine persönlichen Daten löschen', title: 'Persönliche Daten löschen?', desc: 'Dadurch werden Ihre persönlichen Daten (Name, E-Mail, Telefon und Notizen) in allen Buchungen anonymisiert. Ihr Konto bleibt aktiv.', cancel: 'Abbrechen', confirm: 'Ja, löschen', doing: 'Wird gelöscht...', done: 'Persönliche Daten aus Buchungen entfernt.' },
  nl: { btn: 'Mijn persoonlijke gegevens verwijderen', title: 'Persoonlijke gegevens verwijderen?', desc: 'Dit anonimiseert uw persoonlijke gegevens (naam, e-mail, telefoon en notities) in alle boekingen. Uw account blijft actief.', cancel: 'Annuleren', confirm: 'Ja, verwijderen', doing: 'Verwijderen...', done: 'Persoonlijke gegevens verwijderd uit boekingen.' },
};

export default function ClearPersonalDataSection({ userEmail }) {
  const { lang } = useLang();
  const [showDialog, setShowDialog] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [done, setDone] = useState(false);

  const l = LABELS[lang] || LABELS.en;

  const handleClear = async () => {
    setIsClearing(true);
    // Find all bookings for this user and anonymize personal fields
    const bookings = await base44.entities.Booking.filter({ customer_email: userEmail });
    await Promise.all(bookings.map(b =>
      base44.entities.Booking.update(b.id, {
        customer_name: 'Anónimo',
        customer_email: 'removed@removed.com',
        customer_phone: '',
        notes: '',
        flight_number: '',
        return_flight_number: '',
      })
    ));
    // Also update the user profile
    await base44.auth.updateMe({ full_name: 'Anónimo', phone: '' });
    setIsClearing(false);
    setDone(true);
    setShowDialog(false);
  };

  if (done) {
    return (
      <div className="flex items-center gap-2 text-xs text-green-600 justify-center py-1">
        <CheckCircle2 className="w-3.5 h-3.5" />
        {l.done}
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowDialog(true)}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-amber-600 transition-colors"
      >
        <ShieldOff className="w-3.5 h-3.5" />
        {l.btn}
      </button>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-amber-600">{l.title}</AlertDialogTitle>
            <AlertDialogDescription>{l.desc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{l.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClear}
              disabled={isClearing}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isClearing ? l.doing : l.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}