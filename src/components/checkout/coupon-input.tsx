
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCoupons } from '@/hooks/useCoupons';
import { toast } from '@/hooks/use-toast';
import { Percent, Gift, X } from 'lucide-react';

interface CouponInputProps {
  onCouponApplied: (coupon: any) => void;
  onCouponRemoved: () => void;
  appliedCoupon?: any;
}

export function CouponInput({ onCouponApplied, onCouponRemoved, appliedCoupon }: CouponInputProps) {
  const [couponCode, setCouponCode] = useState('');
  const { validateCoupon, loading } = useCoupons();

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast({
        title: "Código necessário",
        description: "Digite um código de cupom válido",
        variant: "destructive",
      });
      return;
    }

    const result = await validateCoupon(couponCode);
    
    if (result.valid && result.coupon) {
      onCouponApplied(result.coupon);
      setCouponCode('');
      toast({
        title: "Cupom aplicado!",
        description: `Desconto de ${result.coupon.discount_percent}% aplicado com sucesso`,
      });
    } else {
      toast({
        title: "Cupom inválido",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const handleRemoveCoupon = () => {
    onCouponRemoved();
    toast({
      title: "Cupom removido",
      description: "O desconto foi removido do seu pedido",
    });
  };

  if (appliedCoupon) {
    return (
      <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
        <Gift className="h-4 w-4 text-green-600" />
        <div className="flex-1">
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            {appliedCoupon.code}
          </Badge>
          <p className="text-sm text-green-700 mt-1">
            {appliedCoupon.is_free_month ? 'Primeiro mês grátis' : `${appliedCoupon.discount_percent}% de desconto`}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRemoveCoupon}
          className="text-green-600 hover:text-green-800"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Cupom de desconto</label>
      <div className="flex gap-2">
        <Input
          placeholder="Digite seu cupom"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
          className="flex-1"
        />
        <Button
          variant="outline"
          onClick={handleApplyCoupon}
          disabled={loading || !couponCode.trim()}
        >
          <Percent className="h-4 w-4 mr-2" />
          Aplicar
        </Button>
      </div>
    </div>
  );
}
