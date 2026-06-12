
"use client";

import { MessageCircle } from 'lucide-react';

export function FloatingWhatsApp() {
  return (
    <a 
      href="https://wa.me/2349000000000?text=Hello%20BrightGrillzz%2C%20I'd%20like%20to%20make%20a%20bespoke%20reservation."
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-24 right-6 md:bottom-8 md:right-8 bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform z-[90] accent-glow"
      aria-label="Contact via WhatsApp"
    >
      <MessageCircle className="w-6 h-6 fill-white" />
    </a>
  );
}
