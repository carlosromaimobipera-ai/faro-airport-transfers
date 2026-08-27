import React, { useEffect, useRef, useState } from 'react';
import Navbar from '@/components/booking/Navbar';
import HeroSection from '@/components/booking/HeroSection';
import BookingForm from '@/components/booking/BookingForm';
import FeaturesSection from '@/components/booking/FeaturesSection';
import ReviewsSection from '@/components/booking/ReviewsSection';
import Footer from '@/components/booking/Footer';
export default function Home() {
  const blogRef = useRef(null);
  const [blogVisible, setBlogVisible] = useState(false);

  useEffect(() => {
    let script;
    let observer;
    let idleId;
    let timeoutId;

    const loadScript = () => {
      script = document.createElement('script');
      script.src = 'https://app.trysoro.com/api/embed/fee72956-6b91-40d4-b7f6-41effddffd65';
      script.defer = true;
      document.body.appendChild(script);

      // Only show the blog section if the external script actually populates it
      observer = new MutationObserver(() => {
        if (blogRef.current && blogRef.current.children.length > 0) {
          setBlogVisible(true);
          observer.disconnect();
        }
      });
      if (blogRef.current) {
        observer.observe(blogRef.current, { childList: true, subtree: true });
      }
    };

    // Defer script loading until the main content is visible
    if ('requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(loadScript, { timeout: 1000 });
    } else {
      timeoutId = setTimeout(loadScript, 200);
    }

    return () => {
      if (idleId && 'cancelIdleCallback' in window) window.cancelIdleCallback(idleId);
      if (timeoutId) clearTimeout(timeoutId);
      if (script && script.parentNode) script.parentNode.removeChild(script);
      if (observer) observer.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <BookingForm />
      <div style={{ display: blogVisible ? 'block' : 'none' }} className="bg-white text-gray-900">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div
            ref={blogRef}
            id="soro-blog"
            className="max-h-[420px] overflow-y-auto rounded-xl border border-gray-100 shadow-sm"
          />
        </div>
      </div>

      <FeaturesSection />
      <ReviewsSection />
      <Footer />
    </div>
  );
}