import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';

export type Task = Tables<'tasks'>;
export type TaskInsert = TablesInsert<'tasks'>;
export type TaskUpdate = TablesUpdate<'tasks'>;

export function useTasks(projectId?: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchTasks = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('tasks')
        .select(`
          *,
          responsible:profiles!tasks_responsible_id_fkey(full_name),
          project:projects(name)
        `)
        .eq('user_id', user.id)
        .is('deleted_at', null);

      if (projectId) {
        query = query.eq('project_id', projectId);
      } else {
        // For dashboard, filter out project tasks to show only personal tasks
        query = query.is('project_id', null);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter tasks by criteria for Dashboard
  const getFilteredTasks = (filter: 'today' | 'upcoming' | 'overdue' | 'completed' | 'all') => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return tasks.filter(task => {
      switch (filter) {
        case 'today':
          if (!task.due_date) return false;
          const taskDate = new Date(task.due_date);
          taskDate.setHours(0, 0, 0, 0);
          return taskDate.getTime() === today.getTime();
        
        case 'upcoming':
          if (!task.due_date) return false;
          const upcomingDate = new Date(task.due_date);
          upcomingDate.setHours(0, 0, 0, 0);
          return upcomingDate.getTime() > today.getTime();
        
        case 'overdue':
          if (!task.due_date || task.status === 'completed') return false;
          const overdueDate = new Date(task.due_date);
          overdueDate.setHours(0, 0, 0, 0);
          return overdueDate.getTime() < today.getTime();
        
        case 'completed':
          return task.status === 'completed';
        
        case 'all':
        default:
          return true;
      }
    });
  };

  const createTask = async (taskData: Omit<TaskInsert, 'user_id'>) => {
    if (!user) return { error: new Error('No user logged in') };

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...taskData,
        user_id: user.id,
      })
      .select(`
        *,
        responsible:profiles!tasks_responsible_id_fkey(full_name),
        project:projects(name)
      `)
      .single();

    if (!error && data) {
      setTasks(prev => [...prev, data]);
    }

    return { data, error };
  };

  const updateTask = async (taskId: string, updates: TaskUpdate) => {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select(`
        *,
        responsible:profiles!tasks_responsible_id_fkey(full_name),
        project:projects(name)
      `)
      .single();

    if (!error && data) {
      setTasks(prev => prev.map(task => 
        task.id === taskId ? data : task
      ));
    }

    return { data, error };
  };

  const deleteTask = async (taskId: string) => {
    // Soft delete - apenas marcar como deletado
    const { error } = await supabase
      .from('tasks')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', taskId);

    if (!error) {
      setTasks(prev => prev.filter(task => task.id !== taskId));
    }

    return { error };
  };

  useEffect(() => {
    fetchTasks();

    // Set up real-time subscription
    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          ...(projectId && { filter: `project_id=eq.${projectId}` }),
        },
        () => {
          // Refetch tasks when changes occur
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, projectId]);

  return {
    tasks,
    loading,
    createTask,
    updateTask,
    deleteTask,
    refetch: fetchTasks,
    getFilteredTasks,
  };
}