import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FloatingLight } from "@/components/ui/floating-light";
import { Header } from "@/components/layout/header";
import { HeroSection } from "@/components/landing/hero-section";
import { BenefitsSection } from "@/components/landing/benefits-section";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { FAQSection } from "@/components/landing/faq-section";
import { CTASection } from "@/components/landing/cta-section";

export default function Landing() {
  const navigate = useNavigate();

  const handleLogin = (email: string, password: string) => {
    // Here you would integrate with Supabase authentication
    console.log("Login attempt:", { email, password });
    // For now, simulate successful login
    navigate("/dashboard");
  };

  const handleRegister = (name: string, email: string, password: string) => {
    // Here you would integrate with Supabase authentication
    console.log("Register attempt:", { name, email, password });
    // For now, simulate successful registration
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen smooth-scroll">
      <FloatingLight />
      <Header />
      
      <main>
        <HeroSection onLogin={handleLogin} onRegister={handleRegister} />
        <BenefitsSection />
        <TestimonialsSection />
        <FAQSection />
        <CTASection />
      </main>
    </div>
  );
}