
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Zap, Crown } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  description: string;
  features: string[];
  popular?: boolean;
  icon: any;
  badge?: string;
}

interface PlanSelectorProps {
  selectedPlan: string | null;
  onPlanSelect: (planId: string) => void;
  appliedCoupon?: any;
}

const plans: Plan[] = [
  {
    id: 'basic',
    name: 'Básico',
    price: 19.90,
    description: 'Perfeito para começar a organizar suas tarefas',
    icon: Check,
    features: [
      'Até 5 projetos',
      'Tarefas ilimitadas',
      'Dashboard básico',
      'Suporte por email',
      'Backup automático'
    ]
  },
  {
    id: 'pro',
    name: 'Profissional',
    price: 39.90,
    originalPrice: 49.90,
    description: 'Para profissionais que precisam de mais recursos',
    icon: Star,
    popular: true,
    badge: 'Mais Popular',
    features: [
      'Projetos ilimitados',
      'Relatórios avançados',
      'Gamificação completa',
      'Integrações premium',
      'Suporte prioritário',
      'Temas personalizados',
      'Colaboração em equipe'
    ]
  },
  {
    id: 'enterprise',
    name: 'Empresarial',
    price: 79.90,
    description: 'Para equipes e empresas que precisam de controle total',
    icon: Crown,
    badge: 'Empresarial',
    features: [
      'Todos os recursos Pro',
      'SSO e autenticação avançada',
      'API personalizada',
      'Onboarding dedicado',
      'SLA garantido',
      'Consultoria estratégica',
      'Relatórios customizados'
    ]
  }
];

export function PlanSelector({ selectedPlan, onPlanSelect, appliedCoupon }: PlanSelectorProps) {
  const calculatePrice = (plan: Plan) => {
    let finalPrice = plan.price;
    
    if (appliedCoupon?.is_free_month) {
      return 0;
    }
    
    if (appliedCoupon?.discount_percent) {
      finalPrice = plan.price * (1 - appliedCoupon.discount_percent / 100);
    }
    
    return finalPrice;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {plans.map((plan) => {
        const Icon = plan.icon;
        const isSelected = selectedPlan === plan.id;
        const finalPrice = calculatePrice(plan);
        const hasDiscount = finalPrice < plan.price;

        return (
          <Card 
            key={plan.id} 
            className={`relative cursor-pointer transition-all hover:shadow-lg ${
              isSelected 
                ? 'ring-2 ring-primary border-primary' 
                : 'hover:border-primary/50'
            } ${plan.popular ? 'scale-105' : ''}`}
            onClick={() => onPlanSelect(plan.id)}
          >
            {plan.badge && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className={`${plan.popular ? 'bg-primary' : 'bg-accent'} text-white px-3 py-1`}>
                  {plan.badge}
                </Badge>
              </div>
            )}

            <CardHeader className="text-center">
              <div className="flex justify-center mb-2">
                <Icon className={`h-8 w-8 ${plan.popular ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-2">
                  {hasDiscount && plan.originalPrice && (
                    <span className="text-sm text-muted-foreground line-through">
                      R$ {plan.originalPrice.toFixed(2)}
                    </span>
                  )}
                  <span className={`text-3xl font-bold ${hasDiscount ? 'text-green-600' : ''}`}>
                    {appliedCoupon?.is_free_month ? 'Grátis' : `R$ ${finalPrice.toFixed(2)}`}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">por mês</p>
                
                {appliedCoupon?.is_free_month && (
                  <p className="text-xs text-green-600 font-medium">
                    Depois R$ {plan.price.toFixed(2)}/mês
                  </p>
                )}
              </div>
            </CardHeader>

            <CardContent>
              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                className="w-full" 
                variant={isSelected ? "default" : "outline"}
                size="lg"
              >
                {isSelected ? 'Selecionado' : 'Selecionar Plano'}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
