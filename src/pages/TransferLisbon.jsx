import React from 'react';
import TransferLandingPage from '@/components/booking/TransferLandingPage';

const faqs = [
  {
    question: 'Quanto custa um transfer do Aeroporto de Lisboa?',
    answer: 'O preço depende do destino e do veículo escolhido. Use o formulário acima para obter um orçamento imediato. Aceitamos pagamento em dinheiro (euros) ou PayPal.',
  },
  {
    question: 'Como funciona o serviço de transfer no Aeroporto de Lisboa?',
    answer: 'O motorista espera-o no saguão de chegadas com um cartaz com o seu nome, ajuda-o com a bagagem e acompanha-o até ao veículo. Saída direta sem filas nem esperas.',
  },
  {
    question: 'Posso reservar um transfer de Lisboa para o Algarve?',
    answer: 'Sim! Oferecemos transfers de longa distância entre Lisboa e o Algarve (Faro, Albufeira, Vilamoura, Lagos, Portimão, etc.). Viagem confortável em sedan, minivan ou minibus.',
  },
  {
    question: 'Que veículos estão disponíveis para transfers do Aeroporto de Lisboa?',
    answer: 'Sedan (até 4 passageiros), minivan (até 7 passageiros) e minibus (até 8 passageiros), todos com ar condicionado, seguro e cadeiras para crianças disponíveis sem custo extra.',
  },
  {
    question: 'O transfer inclui bagagem?',
    answer: 'Sim, a bagagem normal está incluída no preço. Se tem bagagem extra (equipamento de golfe, malas grandes), informe-nos na reserva para garantir o veículo adequado.',
  },
];

export default function TransferLisbon() {
  return (
    <TransferLandingPage
      pageTitle="Transfer Aeroporto Lisboa | Transfers AlgarveStar — Reserve Online"
      metaDescription="Transfer privado do Aeroporto de Lisboa (LIS) para o centro da cidade, Algarve e qualquer destino em Portugal. Motorista no saguão, sedã, minivan e minibus. Pagamento em dinheiro ou PayPal."
      h1="Transfer Aeroporto Lisboa"
      description="Transfer privado do Aeroporto de Lisboa (LIS) para o centro da cidade, Algarve e qualquer destino em Portugal. Serviço profissional, motorista no saguão, pagamento em dinheiro ou PayPal."
      origin="Aeroporto de Lisboa (LIS)"
      destination=""
      reviewsFilter="Lisboa"
      faqs={faqs}
    />
  );
}