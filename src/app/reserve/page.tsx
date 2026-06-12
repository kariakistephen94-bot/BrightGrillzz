
"use client";

import { useState } from 'react';
import { Navbar } from "@/components/Navbar";
import { MobileNav } from "@/components/MobileNav";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { CalendarIcon, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function ReservePage() {
  const [date, setDate] = useState<Date>();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate booking
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      toast({ title: "Reservation Requested", description: "Our concierge will contact you shortly to confirm." });
    }, 2000);
  };

  return (
    <div className="bg-white min-h-screen pb-24">
      <Navbar />
      
      <div className="pt-32 pb-16 max-w-4xl mx-auto px-4">
        {success ? (
          <div className="text-center py-24 space-y-6 animate-fade-in">
             <div className="flex justify-center">
               <CheckCircle2 className="w-24 h-24 text-secondary" />
             </div>
             <h1 className="font-headline text-5xl font-bold text-primary">Table Reserved</h1>
             <p className="text-muted-foreground text-xl max-w-lg mx-auto">
               Thank you for choosing BrightGrillzz. A confirmation has been sent to your email. We look forward to hosting you.
             </p>
             <Button asChild variant="outline" className="border-primary text-primary px-8">
               <a href="/">Return Home</a>
             </Button>
          </div>
        ) : (
          <div className="space-y-12">
            <div className="text-center space-y-4">
              <h1 className="font-headline text-5xl md:text-6xl font-black text-primary italic">Reservations</h1>
              <p className="text-muted-foreground uppercase tracking-[0.4em] font-bold text-sm">Secure Your Luxury Experience</p>
            </div>

            <form onSubmit={handleBooking} className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-muted/20 p-8 md:p-12 border border-muted shadow-sm">
              <div className="space-y-2">
                <Label className="uppercase tracking-widest text-xs font-bold text-primary">Full Name</Label>
                <Input placeholder="John Doe" required className="rounded-none border-muted focus:border-secondary h-12" />
              </div>
              
              <div className="space-y-2">
                <Label className="uppercase tracking-widest text-xs font-bold text-primary">Phone Number</Label>
                <Input placeholder="+234..." type="tel" required className="rounded-none border-muted focus:border-secondary h-12" />
              </div>

              <div className="space-y-2">
                <Label className="uppercase tracking-widest text-xs font-bold text-primary">Number of Guests</Label>
                <Select required>
                  <SelectTrigger className="rounded-none border-muted h-12">
                    <SelectValue placeholder="Select party size" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                      <SelectItem key={n} value={n.toString()}>{n} {n === 1 ? 'Guest' : 'Guests'}</SelectItem>
                    ))}
                    <SelectItem value="large">Large Party (8+)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="uppercase tracking-widest text-xs font-bold text-primary">Preferred Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal rounded-none h-12 border-muted",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label className="uppercase tracking-widest text-xs font-bold text-primary">Special Requests</Label>
                <Input placeholder="Anniversary, birthday, dietary notes..." className="rounded-none border-muted focus:border-secondary h-12" />
              </div>

              <div className="md:col-span-2 pt-4">
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90 text-white h-14 uppercase tracking-[0.3em] font-bold rounded-none"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Request Reservation"}
                </Button>
                <p className="text-[10px] text-muted-foreground mt-4 text-center uppercase tracking-widest">
                  * Submission does not guarantee booking. Our staff will confirm via call/email.
                </p>
              </div>
            </form>
          </div>
        )}
      </div>

      <FloatingWhatsApp />
      <MobileNav />
    </div>
  );
}
