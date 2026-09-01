import React from 'react';
import TransferLandingPage from '@/components/booking/TransferLandingPage';

const faqs = [
  {
    question: 'Quanto custa um transfer do Aeroporto de Faro?',
    answer: 'O preço depende do destino e do veículo escolhido. Use o formulário acima para obter um orçamento imediato — sem compromisso. Aceitamos pagamento em dinheiro (euros) ou PayPal.',
  },
  {
    question: 'Como funciona o serviço de transfer no Aeroporto de Faro?',
    answer: 'O nosso motorista espera-o no saguão de chegadas com um cartaz com o seu nome. Ajuda-o com a bagagem e acompanha-o até ao veículo. Não há filas nem esperas — saída direta do aeroporto.',
  },
  {
    question: 'Posso reservar um transfer de Faro para Lisboa?',
    answer: 'Sim! Oferecemos transfers de longa distância do Aeroporto de Faro para Lisboa e vice-versa. A viagem demora cerca de 2h45 e pode ser feita em sedan, minivan ou minibus.',
  },
  {
    question: 'Que veículos estão disponíveis para transfers do Aeroporto de Faro?',
    answer: 'Disponibilizamos sedan (até 4 passageiros), minivan (até 7 passageiros) e minibus (até 8 passageiros). Todos com ar condicionado, seguro e cadeiras para crianças disponíveis sem custo extra.',
  },
  {
    question: 'Posso pagar em dinheiro no momento da viagem?',
    answer: 'Sim. Pode pagar em dinheiro (euros) diretamente ao motorista no momento da viagem, ou pagar online com PayPal no ato da reserva.',
  },
];

export default function TransferFaro() {
  return (
    <TransferLandingPage
      pageTitle="Transfer Aeroporto Faro | Transfers AlgarveStar — Reserve Online"
      metaDescription="Transfer privado do Aeroporto de Faro (FAO) para Albufeira, Vilamoura, Lagos, Portimão e todo o Algarve. Motorista à espera no saguão, veículos confortáveis, pagamento em dinheiro ou PayPal."
      h1="Transfer Aeroporto Faro"
      description="Transfer privado do Aeroporto de Faro (FAO) para Albufeira, Vilamoura, Lagos, Portimão e todo o Algarve. Motorista à espera no saguão, veículos confortáveis, pagamento em dinheiro ou PayPal."
      origin="Aeroporto de Faro (FAO)"
      destination=""
      reviewsFilter="Faro"
      faqs={faqs}
    />
  );
}