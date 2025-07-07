import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle } from "lucide-react";

interface CheckoutModalProps {
  isOpen: boolean;
  daysRemaining: number;
}

export function CheckoutModal({ isOpen, daysRemaining }: CheckoutModalProps) {
  const navigate = useNavigate();
  
  const handleUpgradeClick = () => {
    navigate('/checkout');
  };
  
  // Se não estiver aberto, não renderiza nada
  if (!isOpen) return null;
  
  // Determinar se é uma expiração ou um aviso
  const isExpired = daysRemaining <= 0;
  
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[425px]" onEscapeKeyDown={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center justify-center mb-2">
            {isExpired ? (
              <AlertTriangle className="h-12 w-12 text-warning" />
            ) : (
              <Badge variant="outline" className="bg-warning/10 text-warning px-3 py-1">
                {daysRemaining} dias restantes
              </Badge>
            )}
          </div>
          <DialogTitle className="text-center text-xl">
            {isExpired ? "Seu período de teste expirou" : "Seu período de teste está acabando"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {isExpired 
              ? "Para continuar usando todos os recursos do Infinity Focus Flow, faça upgrade para o plano Pro." 
              : `Você tem ${daysRemaining} dias restantes no seu período de teste. Faça upgrade agora para não perder acesso aos recursos premium.`
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="rounded-lg border p-4">
            <h4 className="font-medium mb-2 flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-primary" />
              Plano Pro - R$ 29,90/mês
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Tarefas e projetos ilimitados</li>
              <li>• Colaboração em tempo real</li>
              <li>• Dashboard avançado</li>
              <li>• Suporte prioritário</li>
            </ul>
          </div>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-col gap-2">
          <Button onClick={handleUpgradeClick} className="w-full btn-gradient">
            Fazer Upgrade Agora
          </Button>
          {!isExpired && (
            <Button variant="outline" className="w-full" onClick={() => navigate('/dashboard')}>
              Continuar com o Teste Gratuito
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
