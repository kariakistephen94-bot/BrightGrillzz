import Link from 'next/link'
import Image from 'next/image'
import { Instagram, Facebook, MapPin, Mail, Phone, MessageCircle } from 'lucide-react'
import { CONTACT } from '@/lib/contact'

export default function Footer() {
  return (
    <footer className="bg-navy-dark text-white/80 pt-14 md:pt-16 pb-28 md:pb-12 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          {/* Brand & intro */}
          <div className="col-span-1 md:col-span-2 space-y-6">
            <Link href="/" className="inline-flex">
              <span className="bg-white rounded-2xl p-3 inline-flex">
                <Image
                  src="/logo.png"
                  alt="BrightGrillzz"
                  width={500}
                  height={500}
                  className="h-16 w-auto object-contain"
                />
              </span>
            </Link>
            <p className="text-sm md:text-base leading-relaxed text-white/60 max-w-md">
              Abuja&apos;s home of luxury barbecue — flame-grilled proteins, bold flavours and
              premium cuts. Open 24/7 and trusted by celebrities and connoisseurs across the city.
            </p>
            <p className="text-sm font-semibold text-white">{CONTACT.hours}</p>
          </div>

          {/* Quick links */}
          <div className="space-y-6">
            <h4 className="text-white font-bold text-lg tracking-wide uppercase">Quick Links</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><Link href="/menu" className="hover:text-secondary transition-colors">Order Now</Link></li>
              <li><Link href="/track" className="hover:text-secondary transition-colors">Track Order</Link></li>
              <li><Link href="/gallery" className="hover:text-secondary transition-colors">Gallery</Link></li>
              <li><Link href="/contact" className="hover:text-secondary transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* Connect */}
          <div className="space-y-6">
            <h4 className="text-white font-bold text-lg tracking-wide uppercase">Connect</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li>
                <a href={`tel:${CONTACT.phone}`} className="flex items-center gap-3 hover:text-secondary transition-colors">
                  <Phone className="w-5 h-5 text-secondary" />
                  {CONTACT.phoneShort}
                </a>
              </li>
              <li>
                <a href={`mailto:${CONTACT.email}`} className="flex items-center gap-3 hover:text-secondary transition-colors">
                  <Mail className="w-5 h-5 text-secondary" />
                  {CONTACT.email}
                </a>
              </li>
              <li>
                <a
                  href={CONTACT.maps}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 hover:text-secondary transition-colors"
                >
                  <MapPin className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                  {CONTACT.address}
                </a>
              </li>
            </ul>

            <div className="flex items-center gap-3">
              <a
                href={CONTACT.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="bg-white/10 p-3 rounded-full hover:bg-secondary hover:text-white transition-all hover:scale-110"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href={CONTACT.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="bg-white/10 p-3 rounded-full hover:bg-secondary hover:text-white transition-all hover:scale-110"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href={CONTACT.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="bg-white/10 p-3 rounded-full hover:bg-secondary hover:text-white transition-all hover:scale-110"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-14 pt-8 border-t border-white/10 text-center text-sm text-white/50">
          <p>&copy; {new Date().getFullYear()} BrightGrillzz. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
