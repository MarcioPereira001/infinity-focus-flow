
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function Checkout() {
  const navigate = useNavigate();

  const handleCheckoutSuccess = () => {
    // Redirecionar para dashboard após sucesso
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold">Checkout</h1>
        </div>

        <CheckoutForm onSuccess={handleCheckoutSuccess} />
      </div>
    </div>
  );
}
