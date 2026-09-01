import React from 'react';
import TransferLandingPage from '@/components/booking/TransferLandingPage';

const faqs = [
  {
    question: 'Quanto custa um transfer do Aeroporto de Sevilha?',
    answer: 'O preço depende do destino e do veículo escolhido. Use o formulário acima para obter um orçamento imediato. Aceitamos pagamento em dinheiro (euros) ou PayPal.',
  },
  {
    question: 'Como funciona o serviço de transfer no Aeroporto de Sevilha?',
    answer: 'O motorista espera-o no saguão de chegadas com um cartaz com o seu nome, ajuda-o com a bagagem e acompanha-o até ao veículo. Saída direta sem filas nem esperas.',
  },
  {
    question: 'Posso reservar um transfer de Sevilha para Portugal?',
    answer: 'Sim! Oferecemos transfers internacionais entre Sevilha e o Algarve (Faro, Albufeira, Vilamoura, Lagos, etc.). Viagem confortável em sedan, minivan ou minibus.',
  },
  {
    question: 'Que veículos estão disponíveis para transfers do Aeroporto de Sevilha?',
    answer: 'Sedan (até 4 passageiros), minivan (até 7 passageiros) e minibus (até 8 passageiros), todos com ar condicionado, seguro e cadeiras para crianças disponíveis sem custo extra.',
  },
  {
    question: 'Posso pagar em dinheiro no momento da viagem?',
    answer: 'Sim. Pode pagar em dinheiro (euros) ao motorista no momento da viagem, ou pagar online com PayPal no ato da reserva.',
  },
];

export default function TransferSeville() {
  return (
    <TransferLandingPage
      pageTitle="Transfer Aeroporto Sevilha | Transfers AlgarveStar — Reserve Online"
      metaDescription="Transfer privado do Aeroporto de Sevilha (SVQ) para o Algarve, Portugal e todo o sul de Espanha. Motorista à espera no saguão, veículos confortáveis, pagamento em dinheiro ou PayPal."
      h1="Transfer Aeroporto Sevilha"
      description="Transfer privado do Aeroporto de Sevilha (SVQ) para o Algarve, Portugal e todo o sul de Espanha. Motorista à espera no saguão, veículos confortáveis, pagamento em dinheiro ou PayPal."
      origin="Aeroporto de Sevilha (SVQ)"
      destination=""
      reviewsFilter="Sevilha"
      faqs={faqs}
    />
  );
}