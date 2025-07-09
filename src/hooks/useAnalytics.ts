import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AnalyticsData {
  tasksOverTime: Array<{
    name: string;
    completed: number;
    pending: number;
  }>;
  tasksByPriority: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  tasksByStatus: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  productivityByHour: Array<{
    hour: string;
    tasks: number;
  }>;
}

export interface AnalyticsStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  completionRate: number;
  averageTasksPerDay: number;
  streak: number;
}

export function useAnalytics(projectId?: string, period: 'week' | 'month' | 'year' = 'month') {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData>({
    tasksOverTime: [],
    tasksByPriority: [],
    tasksByStatus: [],
    productivityByHour: []
  });
  const [stats, setStats] = useState<AnalyticsStats>({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    completionRate: 0,
    averageTasksPerDay: 0,
    streak: 0
  });

  const fetchAnalyticsData = async () => {
    if (!user) return;

    setLoading(true);

    try {
      // Define date range based on period
      const now = new Date();
      let startDate = new Date();
      
      switch (period) {
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      // Build query
      let query = supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString());

      // Filter by project if specified
      if (projectId && projectId !== 'all') {
        query = query.eq('project_id', projectId);
      } else if (projectId === 'all') {
        // Include all tasks (both personal and project tasks)
      } else {
        // Default to personal tasks only
        query = query.is('project_id', null);
      }

      const { data: tasks, error } = await query;

      if (error) throw error;

      // Process tasks over time
      const tasksOverTime = generateTasksOverTime(tasks || [], period);

      // Process tasks by priority
      const priorityCounts = { high: 0, medium: 0, low: 0 };
      tasks?.forEach(task => {
        if (task.priority && priorityCounts.hasOwnProperty(task.priority)) {
          priorityCounts[task.priority as keyof typeof priorityCounts]++;
        }
      });

      const tasksByPriority = [
        { name: 'Alta', value: priorityCounts.high, color: '#ef4444' },
        { name: 'Média', value: priorityCounts.medium, color: '#f59e0b' },
        { name: 'Baixa', value: priorityCounts.low, color: '#3b82f6' },
      ];

      // Process tasks by status
      const statusCounts = { completed: 0, pending: 0, overdue: 0 };
      const currentDate = new Date();
      
      tasks?.forEach(task => {
        if (task.status === 'Concluído') {
          statusCounts.completed++;
        } else if (task.due_date && new Date(task.due_date) < currentDate) {
          statusCounts.overdue++;
        } else {
          statusCounts.pending++;
        }
      });

      const tasksByStatus = [
        { name: 'Concluídas', value: statusCounts.completed, color: '#22c55e' },
        { name: 'Pendentes', value: statusCounts.pending, color: '#f59e0b' },
        { name: 'Atrasadas', value: statusCounts.overdue, color: '#ef4444' },
      ];

      // Generate productivity by hour (simplified - based on created_at for now)
      const hourlyTasks = new Array(24).fill(0);
      tasks?.forEach(task => {
        const hour = new Date(task.created_at).getHours();
        hourlyTasks[hour]++;
      });

      const productivityByHour = hourlyTasks
        .map((count, index) => ({
          hour: `${index.toString().padStart(2, '0')}:00`,
          tasks: count
        }))
        .filter(item => item.tasks > 0); // Only show hours with activity

      // Calculate stats
      const totalTasks = tasks?.length || 0;
      const completedTasks = statusCounts.completed;
      const pendingTasks = statusCounts.pending + statusCounts.overdue;
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
      const daysInPeriod = period === 'week' ? 7 : period === 'month' ? 30 : 365;
      const averageTasksPerDay = totalTasks / daysInPeriod;

      // Calculate streak (simplified - consecutive days with completed tasks)
      const streak = await calculateStreak(user.id);

      setData({
        tasksOverTime,
        tasksByPriority,
        tasksByStatus,
        productivityByHour
      });

      setStats({
        totalTasks,
        completedTasks,
        pendingTasks,
        completionRate,
        averageTasksPerDay,
        streak
      });

    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateTasksOverTime = (tasks: any[], period: string) => {
    const now = new Date();
    const result = [];

    if (period === 'week') {
      // Generate data for last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' });
        
        const dayTasks = tasks.filter(task => {
          const taskDate = new Date(task.created_at);
          return taskDate.toDateString() === date.toDateString();
        });

        result.push({
          name: dayName,
          completed: dayTasks.filter(t => t.status === 'Concluído').length,
          pending: dayTasks.filter(t => t.status !== 'Concluído').length
        });
      }
    } else if (period === 'month') {
      // Generate data for last 4 weeks
      for (let i = 3; i >= 0; i--) {
        const startDate = new Date(now);
        startDate.setDate(startDate.getDate() - (i + 1) * 7);
        const endDate = new Date(now);
        endDate.setDate(endDate.getDate() - i * 7);
        
        const weekTasks = tasks.filter(task => {
          const taskDate = new Date(task.created_at);
          return taskDate >= startDate && taskDate < endDate;
        });

        result.push({
          name: `Semana ${4 - i}`,
          completed: weekTasks.filter(t => t.status === 'Concluído').length,
          pending: weekTasks.filter(t => t.status !== 'Concluído').length
        });
      }
    } else {
      // Generate data for last 12 months
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        const monthName = date.toLocaleDateString('pt-BR', { month: 'short' });
        
        const monthTasks = tasks.filter(task => {
          const taskDate = new Date(task.created_at);
          return taskDate.getMonth() === date.getMonth() && 
                 taskDate.getFullYear() === date.getFullYear();
        });

        result.push({
          name: monthName,
          completed: monthTasks.filter(t => t.status === 'Concluído').length,
          pending: monthTasks.filter(t => t.status !== 'Concluído').length
        });
      }
    }

    return result;
  };

  const calculateStreak = async (userId: string): Promise<number> => {
    try {
      // Get completed tasks from the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: tasks } = await supabase
        .from('tasks')
        .select('updated_at')
        .eq('user_id', userId)
        .eq('status', 'Concluído')
        .gte('updated_at', thirtyDaysAgo.toISOString())
        .order('updated_at', { ascending: false });

      if (!tasks || tasks.length === 0) return 0;

      // Group tasks by date
      const tasksByDate = new Map();
      tasks.forEach(task => {
        const date = new Date(task.updated_at).toDateString();
        tasksByDate.set(date, true);
      });

      // Calculate consecutive days from today
      let streak = 0;
      const today = new Date();
      
      for (let i = 0; i < 30; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        const dateString = checkDate.toDateString();
        
        if (tasksByDate.has(dateString)) {
          streak++;
        } else {
          break;
        }
      }

      return streak;
    } catch (error) {
      console.error('Error calculating streak:', error);
      return 0;
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [user, projectId, period]);

  return {
    data,
    stats,
    loading,
    refetch: fetchAnalyticsData
  };
}