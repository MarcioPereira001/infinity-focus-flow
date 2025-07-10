
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function useTrialStatus() {
  const { profile } = useAuth();
  const [daysRemaining, setDaysRemaining] = useState<number>(0);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!profile?.trial_ends_at) return;

    const calculateDaysRemaining = () => {
      const trialEndDate = new Date(profile.trial_ends_at!);
      const currentDate = new Date();
      const diffTime = trialEndDate.getTime() - currentDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      setDaysRemaining(diffDays);

      // Mostrar modal se faltam 3 dias ou menos, ou se já expirou
      const shouldShowModal = diffDays <= 3 && profile.plan_status === 'trial';
      setShowModal(shouldShowModal);
    };

    calculateDaysRemaining();

    // Atualizar a cada hora
    const interval = setInterval(calculateDaysRemaining, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [profile]);

  const hideModal = () => {
    setShowModal(false);
  };

  return {
    daysRemaining,
    showModal,
    hideModal,
    isTrialExpired: daysRemaining <= 0,
    isTrialExpiring: daysRemaining <= 3 && daysRemaining > 0
  };
}
