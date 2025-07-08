import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, CreditCard, CheckCircle, AlertCircle } from "lucide-react";

export default function Checkout() {
  const navigate = useNavigate();
  const { user, profile, updateProfile } = useAuth();
  
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
  const discountAmount = appliedCoupon ? 
    (appliedCoupon.is_free_month || appliedCoupon.is_permanent) ? 
      basePrice : 
      (basePrice * appliedCoupon.discount_percent / 100) : 
    0;
  const totalPrice = basePrice - discountAmount;
  
  // Validar cupom
  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      toast({
        title: "Código de cupom vazio",
        description: "Por favor, insira um código de cupom válido",
        variant: "destructive",
      });
      return;
    }
    
    setIsValidatingCoupon(true);
    
    try {
      // Verificar se o cupom existe
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.trim())
        .single();
        
      if (error) throw error;
      
      if (!data) {
        toast({
          title: "Cupom inválido",
          description: "O código de cupom informado não existe",
          variant: "destructive",
        });
        return;
      }
      
      // Verificar se o cupom expirou
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        toast({
          title: "Cupom expirado",
          description: "Este cupom já expirou",
          variant: "destructive",
        });
        return;
      }
      
      // Verificar se o cupom atingiu o limite de usos
      if (data.max_uses && data.current_uses >= data.max_uses) {
        toast({
          title: "Cupom esgotado",
          description: "Este cupom atingiu o limite máximo de usos",
          variant: "destructive",
        });
        return;
      }
      
      // Verificar se o usuário já usou este cupom
      const { data: userCoupon, error: userCouponError } = await supabase
        .from('user_coupons')
        .select('*')
        .eq('user_id', user?.id)
        .eq('coupon_code', couponCode.trim())
        .single();
        
      if (userCouponError && userCouponError.code !== 'PGRST116') { // PGRST116 = not found
        throw userCouponError;
      }
      
      if (userCoupon) {
        toast({
          title: "Cupom já utilizado",
          description: "Você já utilizou este cupom anteriormente",
          variant: "destructive",
        });
        return;
      }
      
      // Aplicar o cupom
      setAppliedCoupon(data);
      
      toast({
        title: "Cupom aplicado com sucesso!",
        description: data.is_free_month ? 
          "Você ganhou 1 mês grátis!" : 
          data.is_permanent ? 
            "Você ganhou acesso permanente ao plano Pro!" : 
            `Desconto de ${data.discount_percent}% aplicado!`,
      });
      
    } catch (error: any) {
      console.error('Error validating coupon:', error);
      toast({
        title: "Erro ao validar cupom",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsValidatingCoupon(false);
    }
  };
  
  // Processar pagamento
  const processPayment = async () => {
    if (!user) return;
    
    setIsProcessing(true);
    
    try {
      // Validar dados do cartão (simulação)
      if (paymentMethod === 'credit-card' && !appliedCoupon?.is_free_month && !appliedCoupon?.is_permanent) {
        if (!cardDetails.cardNumber || !cardDetails.cardName || !cardDetails.expiryDate || !cardDetails.cvv) {
          throw new Error("Por favor, preencha todos os dados do cartão");
        }
        
        if (cardDetails.cardNumber.replace(/\s/g, '').length !== 16) {
          throw new Error("Número do cartão inválido");
        }
        
        if (cardDetails.cvv.length < 3) {
          throw new Error("CVV inválido");
        }
      }
      
      // Se tiver cupom aplicado, registrar o uso
      if (appliedCoupon) {
        // 1. Registrar o uso do cupom para o usuário
        const { error: userCouponError } = await supabase
          .from('user_coupons')
          .insert({
            user_id: user.id,
            coupon_code: appliedCoupon.code,
            applied_at: new Date().toISOString(),
            expires_at: appliedCoupon.is_free_month ? 
              new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : // 30 dias
              null,
            is_active: true
          });
          
        if (userCouponError) throw userCouponError;
        
        // 2. Incrementar o contador de usos do cupom
        const { error: couponUpdateError } = await supabase
          .from('coupons')
          .update({ 
            current_uses: appliedCoupon.current_uses + 1,
            updated_at: new Date().toISOString()
          })
          .eq('code', appliedCoupon.code);
          
        if (couponUpdateError) throw couponUpdateError;
        
        // 3. Atualizar o status do plano do usuário
        const planStatus = appliedCoupon.is_permanent ? 'pro_permanent' : 'pro';
        
        const { error: profileUpdateError } = await supabase
          .from('profiles')
          .update({ 
            plan_status: planStatus,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
          
        if (profileUpdateError) throw profileUpdateError;
      }
      
      // Simular processamento de pagamento
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Pagamento processado com sucesso!",
        description: "Seu plano foi atualizado para Pro",
      });
      
      // Redirecionar para o dashboard após o pagamento
      setTimeout(() => {
        navigate('/dashboard');
        // Recarregar a página para atualizar o contexto de autenticação
        window.location.reload();
      }, 1500);
      
    } catch (error: any) {
      console.error('Error processing payment:', error);
      toast({
        title: "Erro ao processar pagamento",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
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
              <CardTitle>Informações de pagamento</CardTitle>
              <CardDescription>
                Escolha um método de pagamento e preencha os dados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Método de pagamento */}
              <div className="space-y-3">
                <Label>Método de pagamento</Label>
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
                      <span className="text-sm font-medium">Cartão de crédito</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              
              {/* Dados do cartão */}
              {paymentMethod === 'credit-card' && !appliedCoupon?.is_free_month && !appliedCoupon?.is_permanent && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="card-number">Número do cartão</Label>
                      <Input 
                        id="card-number" 
                        placeholder="1234 5678 9012 3456" 
                        value={cardDetails.cardNumber}
                        onChange={(e) => setCardDetails({...cardDetails, cardNumber: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="card-name">Nome no cartão</Label>
                    <Input 
                      id="card-name" 
                      placeholder="Nome como aparece no cartão" 
                      value={cardDetails.cardName}
                      onChange={(e) => setCardDetails({...cardDetails, cardName: e.target.value})}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiry">Data de validade</Label>
                      <Input 
                        id="expiry" 
                        placeholder="MM/AA" 
                        value={cardDetails.expiryDate}
                        onChange={(e) => setCardDetails({...cardDetails, expiryDate: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cvv">CVV</Label>
                      <Input 
                        id="cvv" 
                        placeholder="123" 
                        value={cardDetails.cvv}
                        onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Cupom de desconto */}
              <div className="space-y-2">
                <Label htmlFor="coupon">Cupom de desconto</Label>
                <div className="flex space-x-2">
                  <Input 
                    id="coupon" 
                    placeholder="Insira o código do cupom" 
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    disabled={!!appliedCoupon || isValidatingCoupon}
                  />
                  <Button 
                    variant="outline" 
                    onClick={validateCoupon}
                    disabled={!!appliedCoupon || isValidatingCoupon || !couponCode.trim()}
                  >
                    {isValidatingCoupon ? "Validando..." : "Aplicar"}
                  </Button>
                </div>
                {appliedCoupon && (
                  <div className="flex items-center text-sm text-primary mt-2">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    <span>
                      {appliedCoupon.is_free_month ? 
                        "Cupom aplicado! Você ganhou 1 mês grátis!" : 
                        appliedCoupon.is_permanent ? 
                          "Cupom aplicado! Você ganhou acesso permanente ao plano Pro!" : 
                          `Cupom aplicado! Desconto de ${appliedCoupon.discount_percent}% no valor total.`}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={processPayment} 
                className="w-full btn-gradient"
                disabled={isProcessing}
              >
                {isProcessing ? "Processando..." : "Finalizar compra"}
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        {/* Resumo do pedido */}
        <div>
          <Card className="card-soft">
            <CardHeader>
              <CardTitle>Resumo do pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Plano Pro (mensal)</span>
                  <span>R$ {basePrice.toFixed(2).replace('.', ',')}</span>
                </div>
                
                {appliedCoupon && (
                  <div className="flex justify-between text-sm text-primary">
                    <span>Desconto ({appliedCoupon.code})</span>
                    <span>- R$ {discountAmount.toFixed(2).replace('.', ',')}</span>
                  </div>
                )}
              </div>
              
              <Separator />
              
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>R$ {totalPrice.toFixed(2).replace('.', ',')}</span>
              </div>
              
              <div className="rounded-lg border p-4 space-y-3">
                <h4 className="font-medium">O que está incluído:</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-primary mr-2 mt-0.5" />
                    <span>Tarefas e projetos ilimitados</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-primary mr-2 mt-0.5" />
                    <span>Colaboração em tempo real</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-primary mr-2 mt-0.5" />
                    <span>Analytics avançado</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-primary mr-2 mt-0.5" />
                    <span>Suporte prioritário</span>
                  </li>
                </ul>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p>Você pode cancelar a qualquer momento.</p>
                <p>Ao finalizar a compra, você concorda com os Termos de Serviço e Política de Privacidade.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
