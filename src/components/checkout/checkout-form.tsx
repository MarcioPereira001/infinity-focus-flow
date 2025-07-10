
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CouponInput } from './coupon-input';
import { PlanSelector } from './plan-selector';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, Shield, Lock } from 'lucide-react';

interface CheckoutFormProps {
  onSuccess?: () => void;
}

export function CheckoutForm({ onSuccess }: CheckoutFormProps) {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string | null>('pro');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: '',
    email: user?.email || '',
    name: ''
  });

  const plans = {
    basic: { name: 'Básico', price: 19.90 },
    pro: { name: 'Profissional', price: 39.90 },
    enterprise: { name: 'Empresarial', price: 79.90 }
  };

  const calculateTotal = () => {
    if (!selectedPlan) return 0;
    
    const plan = plans[selectedPlan as keyof typeof plans];
    if (!plan) return 0;

    if (appliedCoupon?.is_free_month) {
      return 0;
    }

    if (appliedCoupon?.discount_percent) {
      return plan.price * (1 - appliedCoupon.discount_percent / 100);
    }

    return plan.price;
  };

  const handleInputChange = (field: string, value: string) => {
    setPaymentData(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckout = async () => {
    if (!selectedPlan || !user) {
      toast({
        title: "Erro",
        description: "Selecione um plano e faça login para continuar",
        variant: "destructive",
      });
      return;
    }

    // Validar dados do cartão (simulação)
    if (!paymentData.cardNumber || !paymentData.expiryDate || !paymentData.cvv || !paymentData.cardName) {
      toast({
        title: "Dados incompletos",
        description: "Preencha todos os dados do cartão de crédito",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Simular processamento do pagamento
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Atualizar o plano do usuário no perfil
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          plan_status: selectedPlan,
          trial_ends_at: null // Remove trial quando faz upgrade
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Se tem cupom aplicado, marcar como usado
      if (appliedCoupon) {
        // Lógica já implementada no useCoupons
      }

      toast({
        title: "Pagamento aprovado! 🎉",
        description: `Bem-vindo ao plano ${plans[selectedPlan as keyof typeof plans].name}!`,
      });

      onSuccess?.();

    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Erro no pagamento",
        description: "Não foi possível processar o pagamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCardNumber = (value: string) => {
    return value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiryDate = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Seleção de Planos */}
      <div>
        <h2 className="text-2xl font-bold text-center mb-2">Escolha seu plano</h2>
        <p className="text-muted-foreground text-center mb-8">
          Selecione o plano que melhor se adapta às suas necessidades
        </p>
        <PlanSelector
          selectedPlan={selectedPlan}
          onPlanSelect={setSelectedPlan}
          appliedCoupon={appliedCoupon}
        />
      </div>

      {selectedPlan && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulário de Pagamento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Informações de Pagamento
              </CardTitle>
              <CardDescription>
                Seus dados estão seguros e criptografados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Número do Cartão</Label>
                <Input
                  id="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  value={formatCardNumber(paymentData.cardNumber)}
                  onChange={(e) => handleInputChange('cardNumber', e.target.value.replace(/\s/g, ''))}
                  maxLength={19}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Validade</Label>
                  <Input
                    id="expiryDate"
                    placeholder="MM/AA"
                    value={formatExpiryDate(paymentData.expiryDate)}
                    onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                    maxLength={5}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    placeholder="123"
                    value={paymentData.cvv}
                    onChange={(e) => handleInputChange('cvv', e.target.value.replace(/\D/g, ''))}
                    maxLength={4}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cardName">Nome no Cartão</Label>
                <Input
                  id="cardName"
                  placeholder="Nome como aparece no cartão"
                  value={paymentData.cardName}
                  onChange={(e) => handleInputChange('cardName', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  placeholder="Seu nome completo"
                  value={paymentData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={paymentData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>

              <CouponInput
                onCouponApplied={setAppliedCoupon}
                onCouponRemoved={() => setAppliedCoupon(null)}
                appliedCoupon={appliedCoupon}
              />
            </CardContent>
          </Card>

          {/* Resumo do Pedido */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Pedido</CardTitle>
              <CardDescription>
                Confira os detalhes da sua assinatura
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedPlan && (
                <>
                  <div className="flex justify-between items-center">
                    <span>Plano {plans[selectedPlan as keyof typeof plans].name}</span>
                    <span>R$ {plans[selectedPlan as keyof typeof plans].price.toFixed(2)}</span>
                  </div>

                  {appliedCoupon && (
                    <div className="flex justify-between items-center text-green-600">
                      <span>Desconto ({appliedCoupon.code})</span>
                      <span>
                        {appliedCoupon.is_free_month 
                          ? `R$ ${plans[selectedPlan as keyof typeof plans].price.toFixed(2)}`
                          : `-R$ ${(plans[selectedPlan as keyof typeof plans].price * appliedCoupon.discount_percent / 100).toFixed(2)}`
                        }
                      </span>
                    </div>
                  )}

                  <Separator />

                  <div className="flex justify-between items-center font-bold text-lg">
                    <span>Total</span>
                    <span>R$ {calculateTotal().toFixed(2)}</span>
                  </div>

                  {appliedCoupon?.is_free_month && (
                    <p className="text-sm text-muted-foreground">
                      Após o primeiro mês: R$ {plans[selectedPlan as keyof typeof plans].price.toFixed(2)}/mês
                    </p>
                  )}

                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <span>Pagamento seguro e criptografado</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      <span>Cancele a qualquer momento</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleCheckout}
                    disabled={loading}
                    className="w-full"
                    size="lg"
                  >
                    {loading ? 'Processando...' : `Finalizar Pedido - R$ ${calculateTotal().toFixed(2)}`}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    Ao finalizar, você concorda com nossos{' '}
                    <a href="#" className="underline">Termos de Uso</a> e{' '}
                    <a href="#" className="underline">Política de Privacidade</a>
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
