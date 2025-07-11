
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Trophy, Star, Award, Zap, Target, CheckCircle, Clock, Medal } from 'lucide-react';

export interface UserStats {
  id: string;
  user_id: string;
  level: number;
  xp: number;
  streak: number;
  tasks_completed: number;
  projects_completed: number;
  last_activity_date: string | null;
  next_level_xp: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: any;
  xp_reward: number;
  condition_type: string;
  condition_value: number;
  unlocked: boolean;
  unlocked_at?: string;
  progress: number;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  rarity: string;
  icon: any;
  condition_type: string;
  condition_value: number;
  unlocked: boolean;
  unlocked_at?: string;
}

export interface Level {
  id: string;
  level: number;
  title: string;
  xp_required: number;
  rewards: string[];
}

export function useGamification() {
  const { user } = useAuth();
  const [userStats, setUserStats] = useState<UserStats>({
    id: '',
    user_id: '',
    level: 1,
    xp: 0,
    streak: 0,
    tasks_completed: 0,
    projects_completed: 0,
    last_activity_date: null,
    next_level_xp: 100
  });
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);

  // Mapear ícones
  const iconMap: Record<string, any> = {
    trophy: Trophy,
    star: Star,
    award: Award,
    zap: Zap,
    target: Target,
    check: CheckCircle,
    clock: Clock,
    medal: Medal
  };

  const fetchUserStats = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        // Calcular XP necessário para o próximo nível
        const nextLevel = await supabase
          .from('levels')
          .select('xp_required')
          .gt('level', data.level)
          .order('level', { ascending: true })
          .limit(1)
          .single();

        setUserStats({
          ...data,
          next_level_xp: nextLevel.data?.xp_required || data.xp + 100
        });
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const fetchAchievements = async () => {
    if (!user) return;

    try {
      // Buscar todas as conquistas
      const { data: allAchievements, error: achievementsError } = await supabase
        .from('achievements')
        .select('*')
        .order('created_at', { ascending: true });

      if (achievementsError) throw achievementsError;

      // Buscar conquistas desbloqueadas pelo usuário
      const { data: userAchievements, error: userAchievementsError } = await supabase
        .from('user_achievements')
        .select('achievement_id, unlocked_at')
        .eq('user_id', user.id);

      if (userAchievementsError) throw userAchievementsError;

      // Combinar dados
      const achievementsWithStatus = (allAchievements || []).map(achievement => {
        const userAchievement = userAchievements?.find(ua => ua.achievement_id === achievement.id);
        const isUnlocked = !!userAchievement;
        
        // Calcular progresso baseado no tipo de condição
        let progress = 0;
        if (achievement.condition_type === 'tasks_completed') {
          progress = Math.min((userStats.tasks_completed / achievement.condition_value) * 100, 100);
        } else if (achievement.condition_type === 'streak') {
          progress = Math.min((userStats.streak / achievement.condition_value) * 100, 100);
        } else if (achievement.condition_type === 'projects_completed') {
          progress = Math.min((userStats.projects_completed / achievement.condition_value) * 100, 100);
        }

        return {
          ...achievement,
          icon: iconMap[achievement.icon] || Trophy,
          unlocked: isUnlocked,
          unlocked_at: userAchievement?.unlocked_at,
          progress: isUnlocked ? 100 : progress
        };
      });

      setAchievements(achievementsWithStatus);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    }
  };

  const fetchBadges = async () => {
    if (!user) return;

    try {
      // Buscar todas as badges
      const { data: allBadges, error: badgesError } = await supabase
        .from('badges')
        .select('*')
        .order('created_at', { ascending: true });

      if (badgesError) throw badgesError;

      // Buscar badges desbloqueadas pelo usuário
      const { data: userBadges, error: userBadgesError } = await supabase
        .from('user_badges')
        .select('badge_id, unlocked_at')
        .eq('user_id', user.id);

      if (userBadgesError) throw userBadgesError;

      // Combinar dados
      const badgesWithStatus = (allBadges || []).map(badge => {
        const userBadge = userBadges?.find(ub => ub.badge_id === badge.id);
        const isUnlocked = !!userBadge;

        return {
          ...badge,
          icon: iconMap[badge.icon] || Award,
          unlocked: isUnlocked,
          unlocked_at: userBadge?.unlocked_at
        };
      });

      setBadges(badgesWithStatus);
    } catch (error) {
      console.error('Error fetching badges:', error);
    }
  };

  const fetchLevels = async () => {
    try {
      const { data, error } = await supabase
        .from('levels')
        .select('*')
        .order('level', { ascending: true });

      if (error) throw error;
      setLevels(data || []);
    } catch (error) {
      console.error('Error fetching levels:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      setLoading(true);
      try {
        await Promise.all([
          fetchUserStats(),
          fetchLevels()
        ]);
        
        // Aguardar stats serem carregadas antes de buscar achievements e badges
        setTimeout(async () => {
          await Promise.all([
            fetchAchievements(),
            fetchBadges()
          ]);
          setLoading(false);
        }, 100);
      } catch (error) {
        console.error('Error fetching gamification data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  return {
    userStats,
    achievements,
    badges,
    levels,
    loading,
    refetch: async () => {
      if (user) {
        await fetchUserStats();
        await fetchAchievements();
        await fetchBadges();
        await fetchLevels();
      }
    }
  };
}
