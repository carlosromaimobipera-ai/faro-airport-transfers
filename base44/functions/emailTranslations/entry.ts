const translations = {
  pt: { subject: 'Voucher {ref} — Transfers AlgarveStar | {date} {time}', hello: 'Olá', status: 'CONFIRMADO' },
  en: { subject: 'Voucher {ref} — Transfers AlgarveStar | {date} {time}', hello: 'Hello', status: 'CONFIRMED' },
  es: { subject: 'Comprobante {ref} — Transfers AlgarveStar | {date} {time}', hello: 'Hola', status: 'CONFIRMADO' },
  fr: { subject: 'Bon {ref} — Transfers AlgarveStar | {date} {time}', hello: 'Bonjour', status: 'CONFIRMÉ' },
  de: { subject: 'Gutschein {ref} — Transfers AlgarveStar | {date} {time}', hello: 'Hallo', status: 'BESTÄTIGT' },
  nl: { subject: 'Voucher {ref} — Transfers AlgarveStar | {date} {time}', hello: 'Hallo', status: 'BEVESTIGD' }
};

export function t(lang, key) {
  return translations[lang]?.[key] || translations['en']?.[key] || '';
}