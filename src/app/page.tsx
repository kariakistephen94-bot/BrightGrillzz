
import Link from 'next/link';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { VIPHub } from "@/components/VIPHub";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { MobileNav } from "@/components/MobileNav";
import { Navbar } from "@/components/Navbar";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { ArrowRight, Star, Clock, MapPin, Phone } from "lucide-react";

export default function Home() {
  const heroBg = PlaceHolderImages.find(img => img.id === 'hero-bg');
  const signatureGrill = PlaceHolderImages.find(img => img.id === 'signature-grill');
  const seafoodPlatter = PlaceHolderImages.find(img => img.id === 'seafood-platter');

  return (
    <div className="relative min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative h-screen w-full overflow-hidden">
        <Image
          src={heroBg?.imageUrl || ""}
          alt="Luxury Grill Hero"
          fill
          className="object-cover brightness-[0.4]"
          priority
          data-ai-hint="grilled steak"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <div className="max-w-4xl space-y-6 animate-fade-in">
            <h1 className="font-headline text-5xl md:text-7xl lg:text-8xl text-white font-black tracking-tight leading-tight">
              Abuja's Premium <span className="text-secondary italic">Destination</span> For Exceptional Grills
            </h1>
            <p className="font-body text-xl md:text-2xl text-white/90 max-w-2xl mx-auto font-light tracking-wide">
              Experience perfectly grilled seafood, meats, and signature dishes crafted for unforgettable moments.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Button asChild size="lg" className="bg-secondary hover:bg-secondary/90 text-white px-8 py-7 text-lg uppercase tracking-widest font-bold">
                <Link href="/reserve">Reserve Your Table</Link>
              </Button>
              <Button variant="outline" asChild size="lg" className="border-white text-white hover:bg-white/10 px-8 py-7 text-lg uppercase tracking-widest font-bold">
                <Link href="/menu">View Menu</Link>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Quick Info Bar */}
        <div className="absolute bottom-0 left-0 w-full glass-morphism text-white p-6 hidden md:block">
          <div className="max-w-7xl mx-auto flex justify-between items-center text-sm tracking-widest uppercase">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-secondary" />
              <span>5 Madiana Close, Wuse 2, Abuja</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-secondary" />
              <span>Mon-Sun: 12PM - 12AM</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-secondary fill-secondary" />
              <span>4.4 Star Rated Excellence</span>
            </div>
          </div>
        </div>
      </section>

      {/* Signature Dishes Highlights */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
            <div className="space-y-4">
              <span className="text-secondary uppercase tracking-[0.3em] font-bold text-sm">Culinary Arts</span>
              <h2 className="font-headline text-4xl md:text-5xl font-bold text-primary">The Signature Collection</h2>
            </div>
            <Button variant="link" asChild className="text-primary hover:text-secondary p-0 h-auto group text-lg tracking-wider">
              <Link href="/menu" className="flex items-center gap-2 uppercase font-bold">
                Browse Full Menu <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             {[
               { id: '1', title: 'Wagyu Gold Ribeye', price: '₦45,000', img: signatureGrill?.imageUrl, desc: 'Premium cut beef, aged for 28 days, finished with bone marrow butter.' },
               { id: '2', title: 'Grand Seafood Tower', price: '₦62,000', img: seafoodPlatter?.imageUrl, desc: 'Jumbo prawns, lobster tail, and calamari grilled with garlic herb crust.' },
               { id: '3', title: 'Hennessy Glazed Wings', price: '₦12,500', img: PlaceHolderImages.find(i => i.id === 'grilled-chicken')?.imageUrl, desc: 'Slow-charred wings tossed in our signature VSOP reduction.' }
             ].map((dish) => (
               <div key={dish.id} className="group cursor-pointer">
                  <div className="relative h-[450px] overflow-hidden mb-6">
                    <Image 
                      src={dish.img || ""} 
                      alt={dish.title} 
                      fill 
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-6 right-6 bg-white px-4 py-2 text-primary font-bold tracking-tighter shadow-xl">
                      {dish.price}
                    </div>
                  </div>
                  <h3 className="font-headline text-2xl font-bold mb-2 group-hover:text-secondary transition-colors">{dish.title}</h3>
                  <p className="text-muted-foreground font-body leading-relaxed">{dish.desc}</p>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* VIP Hub Section */}
      <section className="py-24 bg-muted">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-12">
          <div className="space-y-4">
            <h2 className="font-headline text-4xl md:text-5xl font-bold text-primary">Join the Elite Circle</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Get priority reservations, exclusive access to new menu launches, and tailored experiences for our VIP guests.
            </p>
          </div>
          <VIPHub />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-white pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="space-y-6">
              <h3 className="font-headline text-3xl font-black italic">BrightGrillzz</h3>
              <p className="text-white/60 font-body leading-relaxed">
                Abuja's premier grill destination. Where luxury meets the flame.
              </p>
              <div className="flex gap-4">
                 {/* Social links placeholder */}
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-6 uppercase tracking-widest text-secondary text-sm">Navigation</h4>
              <ul className="space-y-4 text-white/70">
                <li><Link href="/menu" className="hover:text-white transition-colors">Menu</Link></li>
                <li><Link href="/reserve" className="hover:text-white transition-colors">Reservations</Link></li>
                <li><Link href="/order" className="hover:text-white transition-colors">Order Online</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 uppercase tracking-widest text-secondary text-sm">Experience</h4>
              <ul className="space-y-4 text-white/70">
                <li><Link href="#" className="hover:text-white transition-colors">Corporate Dining</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Private Events</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Gift Cards</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">VIP Program</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 uppercase tracking-widest text-secondary text-sm">Visit Us</h4>
              <div className="space-y-4 text-white/70">
                <p className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-1 flex-shrink-0 text-secondary" />
                  5 Madiana Close, Wuse 2, Abuja, Nigeria
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4 flex-shrink-0 text-secondary" />
                  +234 (0) 90 000 0000
                </p>
                <p className="flex items-center gap-2">
                  <Clock className="w-4 h-4 flex-shrink-0 text-secondary" />
                  Open Daily: 12PM - 12AM
                </p>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/40 uppercase tracking-widest">
            <p>© 2024 BrightGrillzz Elite. All Rights Reserved.</p>
            <div className="flex gap-8">
              <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>

      <FloatingWhatsApp />
      <MobileNav />
    </div>
  );
}
