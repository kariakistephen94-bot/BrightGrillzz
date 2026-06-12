
import Link from 'next/link';
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 w-full z-50 px-8 py-6 flex justify-between items-center bg-transparent mix-blend-difference">
      <Link href="/" className="font-headline text-3xl font-black italic text-white tracking-tighter">
        BrightGrillzz
      </Link>
      
      <div className="hidden md:flex items-center gap-10 text-white font-bold uppercase tracking-[0.2em] text-xs">
        <Link href="/menu" className="hover:text-secondary transition-colors">Menu</Link>
        <Link href="/reserve" className="hover:text-secondary transition-colors">Reserve</Link>
        <Link href="/order" className="hover:text-secondary transition-colors">Order</Link>
        <Link href="/contact" className="hover:text-secondary transition-colors">Location</Link>
      </div>

      <div className="hidden md:block">
        <Button asChild className="bg-secondary hover:bg-secondary/90 text-white rounded-none px-6 uppercase tracking-widest font-bold text-xs">
          <Link href="/reserve">Book A Table</Link>
        </Button>
      </div>
    </nav>
  );
}
