import React from 'react';
import { MessageCircle } from 'lucide-react';

export default function WhatsAppFloatingButton() {
  const whatsappNumber = '351913956971';
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=Olá%20Transfers%20Algarvestar,%20tenho%20uma%20dúvida%20sobre%20os%20vossos%20serviços.`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-40 bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center gap-2 md:gap-3"
      title="Chat com Transfers Algarvestar"
    >
      <MessageCircle className="w-6 h-6" />
      <span className="hidden sm:inline text-sm font-semibold pr-1">Chat</span>
    </a>
  );
}