'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Phone, Mail, MapPin, Clock, MessageCircle, ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { CONTACT } from '@/lib/contact'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    date: '',
    time: '',
    guests: '',
    message: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Email the restaurant (fire-and-forget; keepalive survives the new tab).
    fetch('/api/notify/reservation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify(formData),
    }).catch(() => {})

    // Also open a pre-filled WhatsApp message for an instant reply.
    const message = `Hi BrightGrillzz! I'd like to make a reservation.\n\nName: ${formData.name}\nEmail: ${formData.email}\nPhone: ${formData.phone}\nDate: ${formData.date}\nTime: ${formData.time}\nGuests: ${formData.guests}\nMessage: ${formData.message}`
    const encodedMessage = encodeURIComponent(message)
    window.open(`https://wa.me/2348181070919?text=${encodedMessage}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="bg-gradient-to-br from-primary/10 via-white to-secondary/10 pt-28 md:pt-36 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <Badge variant="default" className="mx-auto justify-center mb-4">
              <Phone className="w-3 h-3" />
              <span>Get in Touch</span>
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-4">Contact & Reservations</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Reach out to us for orders, reservations, or any inquiries
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {/* Contact Info Card 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="h-full hover:shadow-premium transition-all duration-300">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <Phone className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle>Call Us</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-muted-foreground">Available 24/7</p>
                  <a href={`tel:${CONTACT.phone}`} className="text-lg font-bold text-primary hover:text-primary/80">
                    {CONTACT.phoneShort}
                  </a>
                  <Button asChild className="w-full rounded-full" size="sm">
                    <a href={`tel:${CONTACT.phone}`}>
                      Call Now
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Contact Info Card 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Card className="h-full hover:shadow-premium transition-all duration-300">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <MessageCircle className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle>WhatsApp</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-muted-foreground">Quick replies & orders</p>
                  <a href={CONTACT.whatsapp} className="text-lg font-bold text-primary hover:text-primary/80">
                    Message Us
                  </a>
                  <Button asChild className="w-full rounded-full" size="sm" variant="default">
                    <a href={CONTACT.whatsapp} target="_blank" rel="noopener noreferrer">
                      Open WhatsApp
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Contact Info Card 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="h-full hover:shadow-premium transition-all duration-300">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle>Visit Us</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    {CONTACT.address}
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Clock className="w-4 h-4 text-primary" />
                    {CONTACT.hours}
                  </div>
                  <Button asChild className="w-full rounded-full" size="sm" variant="outline">
                    <a href={CONTACT.maps} target="_blank" rel="noopener noreferrer">
                      Get Directions
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Reservation Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto"
          >
            <Card className="shadow-premium">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10">
                <CardTitle className="text-2xl">Make a Reservation</CardTitle>
                <CardDescription>
                  Fill in your details and we'll confirm your reservation
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Full Name *</label>
                      <Input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Your name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email *</label>
                      <Input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Phone *</label>
                      <Input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="08XX XXX XXXX"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Number of Guests *</label>
                      <select
                        name="guests"
                        value={formData.guests}
                        onChange={handleChange}
                        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-base shadow-premium-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        required
                      >
                        <option value="">Select number of guests</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, '10+'].map(num => (
                          <option key={num} value={num}>{num} {num === '10+' ? '' : 'guest' + (num === 1 ? '' : 's')}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Reservation Date *</label>
                      <Input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Reservation Time *</label>
                      <Input
                        type="time"
                        name="time"
                        value={formData.time}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Special Requests</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Any special dietary requirements, occasion, or preferences..."
                      className="flex min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2 text-base shadow-premium-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>

                  <Button type="submit" className="w-full rounded-full">
                    Request Reservation
                  </Button>
                </form>

                <p className="text-xs text-muted-foreground text-center mt-4">
                  We'll contact you via WhatsApp to confirm your reservation
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Map Section */}
      <section className="bg-gradient-to-b from-white to-primary/5 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Find Us</h2>
            <p className="text-lg text-muted-foreground">
              Located in the heart of Wuse 2, Abuja
            </p>
          </motion.div>

          <motion.a
            href={CONTACT.maps}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="group relative flex flex-col items-center justify-center text-center rounded-2xl overflow-hidden shadow-premium h-96 bg-gradient-to-br from-primary via-navy to-navy-dark text-white"
          >
            <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:40px_40px]" />
            <div className="relative z-10 px-6">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-5 shadow-lg group-hover:scale-110 transition-transform">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-headline text-2xl md:text-3xl font-bold mb-2">{CONTACT.name}</h3>
              <p className="text-white/80 max-w-md mx-auto mb-6">{CONTACT.address}</p>
              <span className="inline-flex items-center gap-2 rounded-full bg-white text-primary font-bold px-6 py-3 shadow-lg group-hover:gap-3 transition-all">
                Open in Google Maps
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </motion.a>
        </div>
      </section>
    </div>
  )
}
