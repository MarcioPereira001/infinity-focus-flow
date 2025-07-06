import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap } from "lucide-react";

interface CheckoutModalProps {
  isOpen: boolean;
  daysRemaining?: number;
}

const features = [
  "Tarefas e projetos ilimitados",
  "Colaboração em tempo real",
  "Dashboard avançado de analytics",
  "Sistema completo de gamificação",
  "Suporte prioritário 24/7",
  "Backup automático na nuvem",
  "Integrações com outras ferramentas"
];

export function CheckoutModal({ isOpen, daysRemaining = 0 }: CheckoutModalProps) {
  const handleUpgrade = () => {
    alert("Redirecionamento para checkout - Funcionalidade será implementada em breve!");
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
            <Crown className="w-8 h-8 text-primary-foreground" />
          </div>
          
          <div className="space-y-2">
            <DialogTitle className="text-2xl">
              {daysRemaining > 0 ? "Seu teste está acabando!" : "Seu teste expirou"}
            </DialogTitle>
            
            {daysRemaining > 0 ? (
              <p className="text-muted-foreground">
                Restam apenas <span className="font-semibold text-warning">{daysRemaining} dias</span> do seu período de teste gratuito.
              </p>
            ) : (
              <p className="text-muted-foreground">
                Continue aproveitando todos os recursos da Infinity Concentration
              </p>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Pricing Card */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
            <CardHeader className="text-center pb-4">
              <div className="flex items-center justify-center space-x-2">
                <CardTitle className="text-xl">Plano Pro</CardTitle>
                <Badge className="bg-primary">Mais Popular</Badge>
              </div>
              <div className="space-y-1">
                <div className="flex items-baseline justify-center space-x-1">
                  <span className="text-3xl font-bold">R$ 29,90</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  ou R$ 299,90/ano (economize 2 meses)
                </p>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-success" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <Button 
                className="w-full btn-gradient text-lg py-6"
                onClick={handleUpgrade}
              >
                <Zap className="mr-2 h-5 w-5" />
                Fazer Upgrade Agora
              </Button>
              
              <p className="text-xs text-center text-muted-foreground">
                Cancelamento a qualquer momento • Garantia de 30 dias
              </p>
            </CardContent>
          </Card>

          {/* Benefits highlight */}
          <div className="text-center space-y-2">
            <p className="text-sm font-medium">🚀 Desbloqueie todo o seu potencial</p>
            <p className="text-xs text-muted-foreground">
              Junte-se a mais de 10.000 profissionais que transformaram sua produtividade
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}