import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Trophy, Star, Award, Zap, Target, CheckCircle, Clock, Medal, Flame, FolderCheck, Briefcase, Calendar, Hammer, Crown, Cpu } from 'lucide-react';

// Mapeamento de ícones para strings
const iconMap: Record<string, any> = {
  'trophy': Trophy,
  'star': Star,
  'award': Award,
  'zap': Zap,
  'target': Target,
  'check-circle': CheckCircle,
  'clock': Clock,
  'medal': Medal,
  'flame': Flame,
  'fire': Flame,
  'folder-check': FolderCheck,
  'briefcase': Briefcase,
  'calendar': Calendar,
  'hammer': Hammer,
  'crown': Crown,
  'cpu': Cpu,
};

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
  const [levels, setLevels] = useState<Level[]>([]);

  const fetchGamificationData = async () => {
    if (!user) return;

    setLoading(true);

    try {
      // Buscar dados das tabelas reais
      const [
        userStatsResult,
        levelsResult,
        achievementsResult,
        badgesResult,
        userAchievementsResult,
        userBadgesResult
      ] = await Promise.all([
        supabase
          .from('user_stats')
          .select('*')
          .eq('user_id', user.id)
          .single(),
        supabase
          .from('levels')
          .select('*')
          .order('level'),
        supabase
          .from('achievements')
          .select('*'),
        supabase
          .from('badges')
          .select('*'),
        supabase
          .from('user_achievements')
          .select('*, achievements(*)')
          .eq('user_id', user.id),
        supabase
          .from('user_badges')
          .select('*, badges(*)')
          .eq('user_id', user.id)
      ]);

      // Processar estatísticas do usuário
      const stats = userStatsResult.data;
      if (stats) {
        // Encontrar próximo nível
        const levelsData = levelsResult.data || [];
        const nextLevel = levelsData.find(l => l.level === stats.level + 1);
        const nextLevelXP = nextLevel ? nextLevel.xp_required : stats.xp;

        setUserStats({
          level: stats.level,
          xp: stats.xp,
          next_level_xp: nextLevelXP,
          streak: stats.streak,
          tasks_completed: stats.tasks_completed,
          projects_completed: stats.projects_completed
        });

        setLevels(levelsData);
      }

      // Processar conquistas
      const allAchievements = achievementsResult.data || [];
      const unlockedAchievements = new Set(
        (userAchievementsResult.data || []).map(ua => ua.achievement_id)
      );

      const processedAchievements: Achievement[] = allAchievements.map(achievement => {
        const isUnlocked = unlockedAchievements.has(achievement.id);
        const userAchievement = (userAchievementsResult.data || []).find(
          ua => ua.achievement_id === achievement.id
        );

        // Calcular progresso baseado no tipo de condição
        let progress = 0;
        if (stats) {
          switch (achievement.condition_type) {
            case 'tasks_completed':
              progress = Math.min((stats.tasks_completed / achievement.condition_value) * 100, 100);
              break;
            case 'streak':
              progress = Math.min((stats.streak / achievement.condition_value) * 100, 100);
              break;
            case 'projects_completed':
              progress = Math.min((stats.projects_completed / achievement.condition_value) * 100, 100);
              break;
            default:
              progress = isUnlocked ? 100 : 0;
          }
        }

        return {
          id: achievement.id,
          title: achievement.title,
          description: achievement.description,
          icon: iconMap[achievement.icon] || Trophy,
          progress: Math.round(progress),
          unlocked: isUnlocked,
          unlocked_at: userAchievement?.unlocked_at
        };
      });

      // Processar badges
      const allBadges = badgesResult.data || [];
      const unlockedBadges = new Set(
        (userBadgesResult.data || []).map(ub => ub.badge_id)
      );

      const processedBadges: GameBadge[] = allBadges.map(badge => ({
        id: badge.id,
        title: badge.title,
        description: badge.description,
        icon: iconMap[badge.icon] || Award,
        rarity: badge.rarity as 'common' | 'rare' | 'epic' | 'legendary',
        unlocked: unlockedBadges.has(badge.id)
      }));

      setAchievements(processedAchievements);
      setBadges(processedBadges);

    } catch (error) {
      console.error('Error fetching gamification data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Função para atualizar estatísticas manualmente (será chamada pelos triggers automaticamente)
  const refreshStats = async () => {
    await fetchGamificationData();
  };

  useEffect(() => {
    fetchGamificationData();

    // Configurar subscription para atualizações em tempo real
    const channel = supabase
      .channel('gamification-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_stats',
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          fetchGamificationData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_achievements',
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          fetchGamificationData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_badges',
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          fetchGamificationData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    userStats,
    achievements,
    badges,
    levels,
    loading,
    refreshStats,
    refetch: fetchGamificationData
  };
}