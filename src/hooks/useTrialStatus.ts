
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function useTrialStatus() {
  const { profile } = useAuth();
  const [daysRemaining, setDaysRemaining] = useState<number>(0);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Since we removed the trial system, this hook no longer performs any operations
    // Just maintaining the interface for backward compatibility
    setDaysRemaining(0);
    setShowModal(false);
  }, [profile]);

  const hideModal = () => {
    setShowModal(false);
  };

  return {
    daysRemaining: 0,
    showModal: false,
    hideModal,
    isTrialExpired: false,
    isTrialExpiring: false
  };
}
