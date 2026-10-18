import React, { useState, useEffect } from 'react';
import Navbar from '@/components/booking/Navbar';
import BookingForm from '@/components/booking/BookingForm';
import ReviewsSection from '@/components/booking/ReviewsSection';
import Footer from '@/components/booking/Footer';
import { Button } from "@/components/ui/button";
import { ChevronDown, Timer, CheckCircle2, MessageCircle } from 'lucide-react';

const WHATSAPP_NUMBER = '351913956971';

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

export default function ServiceLandingPage({ content, initialService = 'transfer', BadgeIcon = Timer }) {
  useEffect(() => {
    document.title = content.metaTitle;

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', content.metaDescription);

    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: content.faqs.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    };
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'service-faq-jsonld';
    script.text = JSON.stringify(faqSchema);
    document.head.appendChild(script);

    return () => {
      const existing = document.getElementById('service-faq-jsonld');
      if (existing) existing.remove();
    };
  }, [content]);

  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(content.whatsappMessage)}`;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-10 bg-gradient-to-b from-primary/10 to-background">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <span className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs sm:text-sm font-semibold px-4 py-1.5 rounded-full mb-5 text-left">
            <BadgeIcon className="w-4 h-4 shrink-0" />
            {content.highlights[0].title}
          </span>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4 text-foreground">
            {content.h1}
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-7">
            {content.heroSub}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href="#booking" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto font-semibold">
                {content.ctaBook}
              </Button>
            </a>
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2">
                <MessageCircle className="w-4 h-4 text-green-600" /> {content.ctaWhatsapp}
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="py-10 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 grid gap-4 sm:grid-cols-3">
          {content.highlights.map((h) => (
            <div key={h.title} className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
              <p className="font-display text-lg font-bold text-primary mb-1">{h.title}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{h.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-12 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-center text-foreground">{content.howTitle}</h2>
          <p className="text-center text-muted-foreground mt-2 mb-8">{content.howSub}</p>
          <div className="grid gap-4 sm:grid-cols-3">
            {content.steps.map((s, i) => (
              <div key={s.title} className="bg-card border border-border/50 rounded-2xl p-5">
                <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold mb-3">
                  {i + 1}
                </div>
                <p className="font-semibold text-foreground mb-1">{s.title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ideal for */}
      <section className="py-12 bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-center text-foreground mb-8">{content.idealTitle}</h2>
          <ul className="space-y-3">
            {content.ideal.map((item) => (
              <li key={item} className="flex items-start gap-3 bg-card border border-border/40 rounded-xl px-4 py-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm text-foreground leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Booking */}
      <section id="booking" className="py-12 bg-muted/30 scroll-mt-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-center text-foreground">{content.bookingTitle}</h2>
          <p className="text-center text-muted-foreground mt-2 mb-6">{content.bookingSub}</p>
          <BookingForm initialService={initialService} />
        </div>
      </section>

      {/* Reviews */}
      <ReviewsSection />

      {/* FAQ */}
      <section className="py-14 bg-background">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-center mb-8 text-foreground">
            {content.faqTitle}
          </h2>
          <div className="bg-card border border-border/40 rounded-2xl px-6 shadow-sm">
            {content.faqs.map((f, i) => (
              <FAQItem key={i} question={f.q} answer={f.a} />
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}