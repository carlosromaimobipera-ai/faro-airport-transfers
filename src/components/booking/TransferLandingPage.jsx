import React, { useState, useEffect } from 'react';
import Navbar from '@/components/booking/Navbar';
import BookingForm from '@/components/booking/BookingForm';
import ReviewsSection from '@/components/booking/ReviewsSection';
import Footer from '@/components/booking/Footer';
import { ChevronDown } from 'lucide-react';

function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left gap-4"
      >
        <span className="font-medium text-foreground text-sm sm:text-base">{question}</span>
        <ChevronDown className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="pb-4 text-sm text-muted-foreground leading-relaxed">{answer}</p>}
    </div>
  );
}

export default function TransferLandingPage({
  pageTitle,
  metaDescription,
  h1,
  description,
  origin,
  destination,
  reviewsFilter,
  faqs,
}) {
  useEffect(() => {
    document.title = pageTitle;

    let metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', metaDescription);
    } else {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', metaDescription);

    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: { '@type': 'Answer', text: f.answer },
      })),
    };
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(faqSchema);
    script.id = 'faq-jsonld';
    document.head.appendChild(script);

    return () => {
      const existing = document.getElementById('faq-jsonld');
      if (existing) existing.remove();
    };
  }, [pageTitle, metaDescription, faqs]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero with H1 */}
      <section className="pt-32 pb-6 bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4 text-foreground">
            {h1}
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {description}
          </p>
        </div>
      </section>

      {/* Booking Form */}
      <section className="py-6">
        <div className="max-w-3xl mx-auto px-4">
          <BookingForm initialOrigin={origin} initialDestination={destination} />
        </div>
      </section>

      {/* Reviews */}
      <ReviewsSection routeFilter={reviewsFilter} />

      {/* FAQ */}
      <section className="py-14 bg-background">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-center mb-8 text-foreground">
            Perguntas Frequentes
          </h2>
          <div className="bg-card border border-border/40 rounded-2xl px-6 shadow-sm">
            {faqs.map((f, i) => (
              <FAQItem key={i} question={f.question} answer={f.answer} />
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}