import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Trophy, Star, Award, Zap, Target, CheckCircle, Clock, Medal } from 'lucide-react';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: any;
  progress: number;
  unlocked: boolean;
  unlocked_at?: string;
}

export interface GameBadge {
  id: string;
  title: string;
  description: string;
  icon: any;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlocked: boolean;
}

export interface Level {
  level: number;
  title: string;
  xp_required: number;
  rewards: string[];
}

export interface UserStats {
  level: number;
  xp: number;
  next_level_xp: number;
  streak: number;
  tasks_completed: number;
  projects_completed: number;
}

export function useGamification() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState<UserStats>({
    level: 1,
    xp: 0,
    next_level_xp: 100,
    streak: 0,
    tasks_completed: 0,
    projects_completed: 0
  });
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [badges, setBadges] = useState<GameBadge[]>([]);

  // Define levels system
  const levels: Level[] = [
    {
      level: 1,
      title: "Iniciante",
      xp_required: 0,
      rewards: ["Acesso ao sistema básico"]
    },
    {
      level: 2,
      title: "Aprendiz",
      xp_required: 100,
      rewards: ["Badge 'Iniciante'", "+1 projeto"]
    },
    {
      level: 3,
      title: "Praticante",
      xp_required: 250,
      rewards: ["Temas personalizados", "+2 projetos"]
    },
    {
      level: 4,
      title: "Especialista",
      xp_required: 500,
      rewards: ["Badge 'Especialista'", "Estatísticas avançadas"]
    },
    {
      level: 5,
      title: "Mestre",
      xp_required: 1000,
      rewards: ["Badge 'Mestre'", "Recursos exclusivos"]
    }
  ];

  const fetchGamificationData = async () => {
    if (!user) return;

    setLoading(true);

    try {
      // Fetch user's tasks and projects
      const [tasksResult, projectsResult] = await Promise.all([
        supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id),
        supabase
          .from('projects')
          .select('*')
          .eq('owner_id', user.id)
      ]);

      const tasks = tasksResult.data || [];
      const projects = projectsResult.data || [];

      // Calculate basic stats
      const completedTasks = tasks.filter(task => task.status === 'Concluído');
      const tasksCompletedCount = completedTasks.length;
      const projectsCompletedCount = projects.length; // Simplified - consider all created projects as completed

      // Calculate XP (simplified system)
      const xp = (tasksCompletedCount * 10) + (projectsCompletedCount * 50);
      
      // Calculate level based on XP
      let currentLevel = 1;
      let nextLevelXP = 100;
      
      for (const level of levels) {
        if (xp >= level.xp_required) {
          currentLevel = level.level;
          const nextLevel = levels.find(l => l.level === currentLevel + 1);
          nextLevelXP = nextLevel ? nextLevel.xp_required : level.xp_required;
        }
      }

      // Calculate streak
      const streak = await calculateStreak(user.id);

      // Set user stats
      setUserStats({
        level: currentLevel,
        xp,
        next_level_xp: nextLevelXP,
        streak,
        tasks_completed: tasksCompletedCount,
        projects_completed: projectsCompletedCount
      });

      // Generate achievements based on actual data
      const achievementsList: Achievement[] = [
        {
          id: "1",
          title: "Primeiro Passo",
          description: "Complete sua primeira tarefa",
          icon: CheckCircle,
          progress: tasksCompletedCount > 0 ? 100 : 0,
          unlocked: tasksCompletedCount > 0,
          unlocked_at: tasksCompletedCount > 0 ? completedTasks[0]?.updated_at : undefined
        },
        {
          id: "2",
          title: "Produtividade Constante",
          description: "Mantenha um streak de 7 dias",
          icon: Zap,
          progress: Math.min((streak / 7) * 100, 100),
          unlocked: streak >= 7
        },
        {
          id: "3",
          title: "Mestre de Projetos",
          description: "Complete 5 projetos",
          icon: Trophy,
          progress: Math.min((projectsCompletedCount / 5) * 100, 100),
          unlocked: projectsCompletedCount >= 5
        },
        {
          id: "4",
          title: "Maratonista",
          description: "Mantenha um streak de 30 dias",
          icon: Clock,
          progress: Math.min((streak / 30) * 100, 100),
          unlocked: streak >= 30
        },
        {
          id: "5",
          title: "Especialista em Tarefas",
          description: "Complete 100 tarefas",
          icon: Target,
          progress: Math.min((tasksCompletedCount / 100) * 100, 100),
          unlocked: tasksCompletedCount >= 100
        }
      ];

      // Generate badges based on achievements
      const badgesList: GameBadge[] = [
        {
          id: "1",
          title: "Iniciante",
          description: "Começou sua jornada de produtividade",
          icon: Star,
          rarity: 'common',
          unlocked: tasksCompletedCount > 0
        },
        {
          id: "2",
          title: "Consistente",
          description: "Manteve um streak de 7 dias",
          icon: Zap,
          rarity: 'rare',
          unlocked: streak >= 7
        },
        {
          id: "3",
          title: "Produtivo",
          description: "Completou 50 tarefas",
          icon: CheckCircle,
          rarity: 'rare',
          unlocked: tasksCompletedCount >= 50
        },
        {
          id: "4",
          title: "Gerente de Projetos",
          description: "Completou 5 projetos",
          icon: Trophy,
          rarity: 'epic',
          unlocked: projectsCompletedCount >= 5
        },
        {
          id: "5",
          title: "Mestre do Foco",
          description: "Manteve um streak de 30 dias",
          icon: Medal,
          rarity: 'legendary',
          unlocked: streak >= 30
        }
      ];

      setAchievements(achievementsList);
      setBadges(badgesList);

    } catch (error) {
      console.error('Error fetching gamification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStreak = async (userId: string): Promise<number> => {
    try {
      // Get completed tasks from the last 60 days
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const { data: tasks } = await supabase
        .from('tasks')
        .select('updated_at')
        .eq('user_id', userId)
        .eq('status', 'Concluído')
        .gte('updated_at', sixtyDaysAgo.toISOString())
        .order('updated_at', { ascending: false });

      if (!tasks || tasks.length === 0) return 0;

      // Group tasks by date
      const tasksByDate = new Map();
      tasks.forEach(task => {
        const date = new Date(task.updated_at).toDateString();
        tasksByDate.set(date, true);
      });

      // Calculate consecutive days from today backwards
      let streak = 0;
      const today = new Date();
      
      for (let i = 0; i < 60; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        const dateString = checkDate.toDateString();
        
        if (tasksByDate.has(dateString)) {
          streak++;
        } else if (i > 0) { // Don't break on first day (today) if no tasks
          break;
        }
      }

      return streak;
    } catch (error) {
      console.error('Error calculating streak:', error);
      return 0;
    }
  };

  // Award XP for completing tasks (to be called from other components)
  const awardXP = async (amount: number, reason: string) => {
    if (!user) return;

    try {
      // In a real implementation, you'd store XP in a separate table
      // For now, we'll just refetch the data to recalculate
      await fetchGamificationData();
    } catch (error) {
      console.error('Error awarding XP:', error);
    }
  };

  useEffect(() => {
    fetchGamificationData();
  }, [user]);

  return {
    userStats,
    achievements,
    badges,
    levels,
    loading,
    awardXP,
    refetch: fetchGamificationData
  };
}