
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function useTrialNotifications() {
  const { user } = useAuth();
  const [hasShownNotification, setHasShownNotification] = useState(false);

  useEffect(() => {
    // Como removemos o sistema de planos, esta função agora apenas 
    // mantém a estrutura mas não exibe notificações
    if (user && !hasShownNotification) {
      setHasShownNotification(true);
    }
  }, [user, hasShownNotification]);

  return null;
}
