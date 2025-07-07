import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CreditCard, CheckCircle, Gift, ArrowLeft, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// Cupons válidos (em produção, isso estaria no backend)
const VALID_COUPONS = {
  "FIRSTMONTHFREE": { discount: 100, type: "first_month", description: "Primeiro mês grátis" },
  "INFINITY2025": { discount: 100, type: "permanent", description: "Acesso gratuito permanente" }
};

export default function Checkout() {
  const navigate = useNavigate();
  const { profile, updateProfile } = useAuth();
  
  const [paymentMethod, setPaymentMethod] = useState("credit-card");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    cardName: "",
    expiryDate: "",
    cvv: ""
  });

  // Preços e cálculos
  const basePrice = 29.90;
  const discountAmount = appliedCoupon ? (appliedCoupon.discount / 100) * basePrice : 0;
  const finalPrice = basePrice - discountAmount;

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      toast({
        title: "Código de cupom vazio",
        description: "Por favor, insira um código de cupom válido",
        variant: "destructive",
      });
      return;
    }

    setIsValidatingCoupon(true);

    // Simular validação de cupom (em produção, isso seria uma chamada de API)
    setTimeout(() => {
      const normalizedCode = couponCode.trim().toUpperCase();
      const coupon = VALID_COUPONS[normalizedCode as keyof typeof VALID_COUPONS];
      
      if (coupon) {
        setAppliedCoupon({
          code: normalizedCode,
          ...coupon
        });
        toast({
          title: "Cupom aplicado com sucesso!",
          description: coupon.description,
        });
      } else {
        toast({
          title: "Cupom inválido",
          description: "O código de cupom inserido não é válido",
          variant: "destructive",
        });
      }
      
      setIsValidatingCoupon(false);
    }, 1000);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // Simulação de processamento de pagamento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Atualizar o status do plano no perfil do usuário
      if (profile) {
        const { error } = await updateProfile({
          plan_status: 'pro',
          // Se for cupom permanente, não definimos data de expiração
          ...(appliedCoupon?.type !== 'permanent' && {
            trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // +30 dias
          })
        });

        if (error) throw error;
      }

      toast({
        title: "Pagamento processado com sucesso!",
        description: "Bem-vindo ao plano Pro!",
      });

      // Redirecionar para o dashboard após o pagamento bem-sucedido
      navigate("/dashboard");
    } catch (error: any) {
      console.error('Error processing payment:', error);
      toast({
        title: "Erro ao processar pagamento",
        description: error.message || "Ocorreu um erro ao processar seu pagamento",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate('/settings')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Checkout</h1>
          <p className="text-muted-foreground">
            Faça upgrade para o plano Pro
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulário de pagamento */}
        <div className="lg:col-span-2">
          <Card className="card-soft">
            <CardHeader>
              <CardTitle>Informações de Pagamento</CardTitle>
              <CardDescription>
                Escolha seu método de pagamento preferido
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <RadioGroup 
                  value={paymentMethod} 
                  onValueChange={setPaymentMethod}
                  className="grid grid-cols-3 gap-4"
                >
                  <div>
                    <RadioGroupItem 
                      value="credit-card" 
                      id="credit-card" 
                      className="peer sr-only" 
                    />
                    <Label
                      htmlFor="credit-card"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <CreditCard className="mb-3 h-6 w-6" />
                      <span className="text-sm font-medium">Cartão de Crédito</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem 
                      value="pix" 
                      id="pix" 
                      className="peer sr-only" 
                      disabled
                    />
                    <Label
                      htmlFor="pix"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary opacity-50 cursor-not-allowed"
                    >
                      <svg className="mb-3 h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13.9 7L17 10.1L7.1 20H4V16.9L13.9 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M11 10L14 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M16 3L21 8L16 13L11 8L16 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="text-sm font-medium">PIX (Em breve)</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem 
                      value="boleto" 
                      id="boleto" 
                      className="peer sr-only" 
                      disabled
                    />
                    <Label
                      htmlFor="boleto"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary opacity-50 cursor-not-allowed"
                    >
                      <svg className="mb-3 h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
                        <path d="M7 4V20" stroke="currentColor" strokeWidth="2"/>
                        <path d="M17 4V20" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      <span className="text-sm font-medium">Boleto (Em breve)</span>
                    </Label>
                  </div>
                </RadioGroup>

                {paymentMethod === "credit-card" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="card-number">Número do Cartão</Label>
                      <div className="relative">
                        <Input
                          id="card-number"
                          placeholder="1234 5678 9012 3456"
                          value={cardDetails.cardNumber}
                          onChange={(e) => setCardDetails({ ...cardDetails, cardNumber: e.target.value })}
                          className="pl-10"
                        />
                        <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="card-name">Nome no Cartão</Label>
                      <Input
                        id="card-name"
                        placeholder="NOME COMO ESTÁ NO CARTÃO"
                        value={cardDetails.cardName}
                        onChange={(e) => setCardDetails({ ...cardDetails, cardName: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="expiry-date">Data de Validade</Label>
                        <Input
                          id="expiry-date"
                          placeholder="MM/AA"
                          value={cardDetails.expiryDate}
                          onChange={(e) => setCardDetails({ ...cardDetails, expiryDate: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cvv">CVV</Label>
                        <Input
                          id="cvv"
                          placeholder="123"
                          value={cardDetails.cvv}
                          onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="coupon-code">Cupom de Desconto</Label>
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <Input
                        id="coupon-code"
                        placeholder="CUPOM"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        disabled={!!appliedCoupon}
                        className={appliedCoupon ? "pl-10" : ""}
                      />
                      {appliedCoupon && (
                        <CheckCircle className="absolute left-3 top-2.5 h-4 w-4 text-success" />
                      )}
                    </div>
                    {appliedCoupon ? (
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleRemoveCoupon}
                      >
                        Remover
                      </Button>
                    ) : (
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleApplyCoupon}
                        disabled={isValidatingCoupon || !couponCode.trim()}
                      >
                        {isValidatingCoupon ? "Validando..." : "Aplicar"}
                      </Button>
                    )}
                  </div>
                  {appliedCoupon && (
                    <p className="text-sm text-success flex items-center mt-1">
                      <Gift className="h-3 w-3 mr-1" />
                      {appliedCoupon.description}
                    </p>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    className="btn-gradient"
                    disabled={isProcessing || (paymentMethod === "credit-card" && (!cardDetails.cardNumber || !cardDetails.cardName || !cardDetails.expiryDate || !cardDetails.cvv))}
                  >
                    {isProcessing ? "Processando..." : "Finalizar Compra"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Resumo do pedido */}
        <div>
          <Card className="card-soft">
            <CardHeader>
              <CardTitle>Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Plano Pro (Mensal)</span>
                <span>R$ {basePrice.toFixed(2)}</span>
              </div>
              
              {appliedCoupon && (
                <div className="flex justify-between text-success">
                  <span>Desconto ({appliedCoupon.code})</span>
                  <span>-R$ {discountAmount.toFixed(2)}</span>
                </div>
              )}
              
              <Separator />
              
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>R$ {finalPrice.toFixed(2)}</span>
              </div>

              <div className="text-sm text-muted-foreground">
                {appliedCoupon?.type === 'permanent' ? (
                  <p>Acesso gratuito permanente</p>
                ) : appliedCoupon?.type === 'first_month' ? (
                  <p>Primeiro mês grátis, depois R$ {basePrice.toFixed(2)}/mês</p>
                ) : (
                  <p>Cobrança mensal de R$ {basePrice.toFixed(2)}</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex-col space-y-4">
              <div className="w-full rounded-md bg-primary/5 p-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="bg-primary/10">Pro</Badge>
                  <span className="font-medium">O que está incluído:</span>
                </div>
                <ul className="mt-2 space-y-1 text-muted-foreground">
                  <li>• Tarefas e projetos ilimitados</li>
                  <li>• Colaboração em tempo real</li>
                  <li>• Dashboard avançado</li>
                  <li>• Suporte prioritário</li>
                </ul>
              </div>
              
              <div className="flex items-center justify-center text-xs text-muted-foreground">
                <Lock className="h-3 w-3 mr-1" />
                Pagamento seguro via gateway criptografado
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
