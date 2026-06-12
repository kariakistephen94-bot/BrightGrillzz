
"use client";

import Link from 'next/link';
import { Home, UtensilsCrossed, CalendarDays, ShoppingBag, MapPin } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Menu', href: '/menu', icon: UtensilsCrossed },
  { label: 'Reserve', href: '/reserve', icon: CalendarDays },
  { label: 'Order', href: '/order', icon: ShoppingBag },
  { label: 'Contact', href: '/contact', icon: MapPin },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="md:hidden fixed bottom-0 left-0 w-full bg-primary border-t border-white/10 z-[100] px-2 py-3">
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 transition-all",
                isActive ? "text-secondary" : "text-white/50"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] uppercase font-bold tracking-widest">{item.label}</span>
              {isActive && <div className="w-1 h-1 bg-secondary rounded-full" />}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
