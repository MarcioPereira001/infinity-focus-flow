
import { AlertTriangle, Crown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

interface TrialBannerProps {
  daysRemaining: number;
  isExpired: boolean;
}

export function TrialBanner({ daysRemaining, isExpired }: TrialBannerProps) {
  const navigate = useNavigate();
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed && !isExpired) return null;

  const getBannerColor = () => {
    if (isExpired) return "bg-destructive/10 border-destructive/20 text-destructive";
    if (daysRemaining <= 1) return "bg-warning/10 border-warning/20 text-warning";
    return "bg-primary/10 border-primary/20 text-primary";
  };

  const getIcon = () => {
    if (isExpired || daysRemaining <= 1) {
      return <AlertTriangle className="h-4 w-4" />;
    }
    return <Crown className="h-4 w-4" />;
  };

  const getMessage = () => {
    if (isExpired) {
      return "Seu trial expirou. Faça upgrade para continuar usando todos os recursos.";
    }
    if (daysRemaining === 1) {
      return "Último dia de trial! Não perca o acesso aos recursos premium.";
    }
    return `${daysRemaining} dias restantes no seu trial. Faça upgrade para continuar.`;
  };

  return (
    <div className={`rounded-lg border p-3 mb-6 ${getBannerColor()}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getIcon()}
          <div className="flex-1">
            <p className="text-sm font-medium">
              {getMessage()}
            </p>
          </div>
          <Badge variant="outline" className="ml-2">
            {isExpired ? "Expirado" : `${daysRemaining} dias`}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => navigate('/checkout')}
          >
            Fazer Upgrade
          </Button>
          
          {!isExpired && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDismissed(true)}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
