
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export function useTrialNotifications() {
  const { profile } = useAuth();

  useEffect(() => {
    if (!profile?.trial_ends_at || profile.plan_status !== 'trial') return;

    const trialEndDate = new Date(profile.trial_ends_at);
    const currentDate = new Date();
    const diffTime = trialEndDate.getTime() - currentDate.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Notificação quando faltam exatamente 7, 3 e 1 dias
    const shouldNotify = [7, 3, 1].includes(daysRemaining);
    
    if (shouldNotify) {
      const message = daysRemaining === 1 
        ? "Último dia do seu trial! Faça upgrade para continuar."
        : `Seu trial expira em ${daysRemaining} dias. Considere fazer upgrade.`;

      toast({
        title: "Lembrete de Trial",
        description: message,
        duration: 5000,
      });
    }

    // Notificação quando o trial expira
    if (daysRemaining <= 0) {
      toast({
        title: "Trial Expirado",
        description: "Seu período de teste expirou. Faça upgrade para continuar usando todos os recursos.",
        variant: "destructive",
        duration: 8000,
      });
    }
  }, [profile]);
}
