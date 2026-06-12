
"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2 } from "lucide-react";

export function VIPHub() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast({ title: "Please enter a valid email", variant: "destructive" });
      return;
    }
    setSubmitted(true);
    toast({ title: "Welcome to the Elite Circle", description: "You will receive your welcome gift shortly." });
  };

  if (submitted) {
    return (
      <div className="bg-white p-12 border border-secondary shadow-2xl flex flex-col items-center gap-4 animate-fade-in">
        <CheckCircle2 className="w-16 h-16 text-secondary" />
        <h3 className="font-headline text-3xl font-bold text-primary">Membership Confirmed</h3>
        <p className="text-muted-foreground">Check your inbox for your exclusive VIP access code.</p>
      </div>
    );
  }

  return (
    <div className="bg-primary p-1 md:p-1 flex flex-col md:flex-row items-stretch shadow-2xl">
      <Input 
        type="email" 
        placeholder="Enter your email address" 
        className="bg-white h-14 rounded-none border-none text-primary px-6 text-lg"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Button 
        onClick={handleSubmit}
        className="bg-secondary hover:bg-secondary/90 text-white h-14 px-8 uppercase tracking-[0.2em] font-bold rounded-none flex-shrink-0"
      >
        Join The Elite Circle
      </Button>
    </div>
  );
}
