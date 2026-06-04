import React, { useEffect } from 'react';
import Navbar from '@/components/booking/Navbar';
import HeroSection from '@/components/booking/HeroSection';
import BookingForm from '@/components/booking/BookingForm';
import FeaturesSection from '@/components/booking/FeaturesSection';
import ReviewsSection from '@/components/booking/ReviewsSection';
import Footer from '@/components/booking/Footer';
export default function Home() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://app.trysoro.com/api/embed/fee72956-6b91-40d4-b7f6-41effddffd65';
    script.defer = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <BookingForm />
      <div className="bg-white text-gray-900">
        <div id="soro-blog" className="max-w-6xl mx-auto px-4 py-12" />
      </div>

      <FeaturesSection />
      <ReviewsSection />
      <Footer />
    </div>
  );
}