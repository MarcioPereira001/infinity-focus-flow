import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CheckoutModal } from "@/components/modal/checkout-modal";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import ProjectKanban from "./pages/ProjectKanban";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import { useState, useEffect } from "react";

const queryClient = new QueryClient();

const App = () => {
  const [showCheckout, setShowCheckout] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(5);

  // Simulate trial expiration check
  useEffect(() => {
    // This would be replaced with real authentication state from Supabase
    const checkTrialStatus = () => {
      // Simulate expired trial for demo
      if (window.location.pathname !== "/" && daysRemaining <= 0) {
        setShowCheckout(true);
      }
    };

    checkTrialStatus();
  }, [daysRemaining]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/projects/:id" element={<ProjectKanban />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        
        {/* Checkout Modal - Cannot be closed */}
        <CheckoutModal 
          isOpen={showCheckout} 
          daysRemaining={daysRemaining}
        />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
