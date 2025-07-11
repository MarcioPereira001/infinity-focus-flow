
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';

export type Goal = Tables<'goals'>;
export type GoalInsert = TablesInsert<'goals'>;
export type GoalUpdate = TablesUpdate<'goals'>;

export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchGoals = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const createGoal = async (goalData: Omit<GoalInsert, 'user_id'>) => {
    if (!user) return { error: new Error('No user logged in') };

    const { data, error } = await supabase
      .from('goals')
      .insert({
        ...goalData,
        user_id: user.id,
      })
      .select()
      .single();

    if (!error && data) {
      setGoals(prev => [...prev, data]);
    }

    return { data, error };
  };

  const updateGoal = async (goalId: string, updates: GoalUpdate) => {
    const { data, error } = await supabase
      .from('goals')
      .update(updates)
      .eq('id', goalId)
      .select()
      .single();

    if (!error && data) {
      setGoals(prev => prev.map(goal => 
        goal.id === goalId ? data : goal
      ));
    }

    return { data, error };
  };

  const deleteGoal = async (goalId: string) => {
    // Soft delete - apenas marcar como deletado
    const { error } = await supabase
      .from('goals')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', goalId);

    if (!error) {
      setGoals(prev => prev.filter(goal => goal.id !== goalId));
    }

    return { error };
  };

  // Filtrar metas por status
  const getFilteredGoals = (filter: 'active' | 'completed' | 'all') => {
    const today = new Date();
    
    return goals.filter(goal => {
      const isCompleted = goal.current_value >= (goal.target_value || 1);
      const isActive = !isCompleted && (!goal.end_date || new Date(goal.end_date) >= today);
      
      switch (filter) {
        case 'active':
          return isActive;
        case 'completed':
          return isCompleted;
        case 'all':
        default:
          return true;
      }
    });
  };

  useEffect(() => {
    fetchGoals();

    // Set up real-time subscription
    const channel = supabase
      .channel('goals-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'goals',
        },
        () => {
          fetchGoals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    goals,
    loading,
    createGoal,
    updateGoal,
    deleteGoal,
    refetch: fetchGoals,
    getFilteredGoals,
  };
}
