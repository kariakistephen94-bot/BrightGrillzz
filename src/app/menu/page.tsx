
import { Navbar } from "@/navbar"; // Note: Re-using the navbar or creating specific ones
import { PlaceHolderImages } from "@/lib/placeholder-images";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navbar as MainNavbar } from "@/components/Navbar";
import { MobileNav } from "@/components/MobileNav";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";

const MENU_DATA = [
  {
    category: "Signature Grills",
    items: [
      { name: "Wagyu Gold Ribeye", price: "₦45,000", description: "MBS 7+ beef, smoked hickory salt, clarified butter.", tag: "Popular" },
      { name: "Bourbon Beef Fillet", price: "₦32,500", description: "Pepper-crusted tenderloin with a whiskey cream reduction." },
      { name: "Lamb Chops Royale", price: "₦28,000", description: "Herb-crusted New Zealand lamb, mint & pomegranate salsa.", tag: "Elite Choice" }
    ]
  },
  {
    category: "Seafood",
    items: [
      { name: "Grand Lobster Tail", price: "₦42,000", description: "Grilled Atlantic lobster with saffron lemon butter.", tag: "Chef's Special" },
      { name: "Spicy Tiger Prawns", price: "₦18,500", description: "Jumbo prawns marinated in West African bird's eye chili." },
      { name: "Pan-Seared Salmon", price: "₦24,000", description: "Miso-glazed Atlantic salmon with crispy skin." }
    ]
  },
  {
    category: "Platters",
    items: [
      { name: "The Wuse 2 Feast", price: "₦120,000", description: "Full rack of ribs, whole peri chicken, 6 jumbo prawns, served with 4 sides.", tag: "Best For Groups" },
      { name: "Oceanic Platter", price: "₦85,000", description: "2 Lobster tails, tiger prawns, calamari rings, whole grilled croaker." }
    ]
  }
];

export default function MenuPage() {
  const headerImg = PlaceHolderImages.find(img => img.id === 'luxury-interior');

  return (
    <div className="bg-white min-h-screen pb-24">
      <MainNavbar />
      
      {/* Header */}
      <div className="relative h-[40vh] w-full bg-primary overflow-hidden">
        <Image 
          src={headerImg?.imageUrl || ""} 
          alt="Menu Header" 
          fill 
          className="object-cover opacity-50 grayscale"
          data-ai-hint="luxury restaurant"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <h1 className="font-headline text-5xl md:text-6xl text-white font-black italic">The Menu</h1>
          <p className="text-white/70 uppercase tracking-[0.4em] mt-4 font-bold text-sm">Elevated Barbecue Cuisine</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16">
        <Tabs defaultValue="Signature Grills" className="w-full">
          <div className="overflow-x-auto pb-4 mb-12 scrollbar-hide">
            <TabsList className="bg-transparent h-auto p-0 flex flex-nowrap md:flex-wrap gap-8 justify-start md:justify-center">
              {MENU_DATA.map(cat => (
                <TabsTrigger 
                  key={cat.category} 
                  value={cat.category}
                  className="bg-transparent border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:bg-transparent rounded-none px-0 py-2 text-muted-foreground data-[state=active]:text-primary font-bold uppercase tracking-widest text-xs transition-all"
                >
                  {cat.category}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {MENU_DATA.map(category => (
            <TabsContent key={category.category} value={category.category} className="animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-12">
                {category.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start border-b border-muted pb-8 group">
                    <div className="space-y-2 max-w-[70%]">
                      <div className="flex items-center gap-3">
                        <h3 className="font-headline text-2xl font-bold text-primary group-hover:text-secondary transition-colors">
                          {item.name}
                        </h3>
                        {item.tag && (
                          <Badge className="bg-secondary/10 text-secondary border-none uppercase text-[8px] font-black tracking-widest px-2 py-0">
                            {item.tag}
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground font-body text-sm leading-relaxed">{item.description}</p>
                    </div>
                    <span className="font-headline text-xl font-bold text-primary">{item.price}</span>
                  </div>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-16 text-center bg-muted/30 mt-16">
        <h3 className="font-headline text-3xl font-bold mb-6">Ready to Experience the Flame?</h3>
        <p className="text-muted-foreground mb-8">Secure your table now and indulge in Abuja's most talked-about barbecue.</p>
        <Button asChild size="lg" className="bg-secondary hover:bg-secondary/90 px-12 py-7 font-bold uppercase tracking-widest">
          <Link href="/reserve">Book Your Table</Link>
        </Button>
      </div>

      <FloatingWhatsApp />
      <MobileNav />
    </div>
  );
}
