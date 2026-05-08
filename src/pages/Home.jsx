import React from 'react';
import Navbar from '@/components/booking/Navbar';
import HeroSection from '@/components/booking/HeroSection';
import BookingForm from '@/components/booking/BookingForm';
import FeaturesSection from '@/components/booking/FeaturesSection';
import PricingTable from '@/components/booking/PricingTable';
import ReviewsSection from '@/components/booking/ReviewsSection';
import Footer from '@/components/booking/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <BookingForm />
      <FeaturesSection />
      <PricingTable />
      <ReviewsSection />
      <Footer />
    </div>
  );
}