-- Criar tabelas para o sistema de gamificação

-- Tabela de estatísticas do usuário
CREATE TABLE public.user_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  level INTEGER NOT NULL DEFAULT 1,
  xp INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  tasks_completed INTEGER NOT NULL DEFAULT 0,
  projects_completed INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de níveis e recompensas
CREATE TABLE public.levels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  level INTEGER NOT NULL UNIQUE,
  title TEXT NOT NULL,
  xp_required INTEGER NOT NULL,
  rewards TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de conquistas (achievements)
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'trophy',
  category TEXT NOT NULL DEFAULT 'general',
  xp_reward INTEGER NOT NULL DEFAULT 50,
  condition_type TEXT NOT NULL,
  condition_value INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de badges
CREATE TABLE public.badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'award',
  rarity TEXT NOT NULL DEFAULT 'common',
  condition_type TEXT NOT NULL,
  condition_value INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de conquistas desbloqueadas pelos usuários
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_id UUID NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Tabela de badges desbloqueados pelos usuários
CREATE TABLE public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_id UUID NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para user_stats
CREATE POLICY "Users can view their own stats" ON public.user_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats" ON public.user_stats
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stats" ON public.user_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para levels (públicas)
CREATE POLICY "Levels are viewable by everyone" ON public.levels
  FOR SELECT USING (true);

-- Políticas RLS para achievements (públicas)
CREATE POLICY "Achievements are viewable by everyone" ON public.achievements
  FOR SELECT USING (true);

-- Políticas RLS para badges (públicas)
CREATE POLICY "Badges are viewable by everyone" ON public.badges
  FOR SELECT USING (true);

-- Políticas RLS para user_achievements
CREATE POLICY "Users can view their own achievements" ON public.user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements" ON public.user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para user_badges
CREATE POLICY "Users can view their own badges" ON public.user_badges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own badges" ON public.user_badges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Triggers para atualizar updated_at
CREATE TRIGGER update_user_stats_updated_at
  BEFORE UPDATE ON public.user_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para inicializar estatísticas do usuário
CREATE OR REPLACE FUNCTION public.initialize_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_stats (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para inicializar stats quando um perfil é criado
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_user_stats();

-- Função para atualizar XP e verificar conquistas
CREATE OR REPLACE FUNCTION public.update_user_gamification()
RETURNS TRIGGER AS $$
DECLARE
  user_stats_record RECORD;
  new_level INTEGER;
  achievement_record RECORD;
  badge_record RECORD;
BEGIN
  -- Buscar estatísticas atuais do usuário
  SELECT * INTO user_stats_record FROM public.user_stats WHERE user_id = NEW.user_id;
  
  -- Se não existir, criar
  IF user_stats_record IS NULL THEN
    INSERT INTO public.user_stats (user_id) VALUES (NEW.user_id);
    SELECT * INTO user_stats_record FROM public.user_stats WHERE user_id = NEW.user_id;
  END IF;
  
  -- Atualizar contadores baseado no tipo de evento
  IF TG_TABLE_NAME = 'tasks' AND NEW.status = 'completed' AND (OLD IS NULL OR OLD.status != 'completed') THEN
    -- Tarefa completada
    UPDATE public.user_stats 
    SET 
      tasks_completed = tasks_completed + 1,
      xp = xp + 25,
      last_activity_date = CURRENT_DATE,
      updated_at = now()
    WHERE user_id = NEW.user_id;
    
    -- Atualizar streak
    UPDATE public.user_stats 
    SET streak = CASE 
      WHEN last_activity_date = CURRENT_DATE - INTERVAL '1 day' THEN streak + 1
      WHEN last_activity_date = CURRENT_DATE THEN streak
      ELSE 1
    END
    WHERE user_id = NEW.user_id;
    
  ELSIF TG_TABLE_NAME = 'projects' AND NEW.owner_id = NEW.owner_id THEN
    -- Projeto completado (assumindo que há uma coluna status)
    UPDATE public.user_stats 
    SET 
      projects_completed = projects_completed + 1,
      xp = xp + 100,
      last_activity_date = CURRENT_DATE,
      updated_at = now()
    WHERE user_id = NEW.owner_id;
  END IF;
  
  -- Verificar mudança de nível
  SELECT level INTO new_level FROM public.levels 
  WHERE xp_required <= (SELECT xp FROM public.user_stats WHERE user_id = NEW.user_id)
  ORDER BY level DESC LIMIT 1;
  
  IF new_level IS NOT NULL AND new_level > user_stats_record.level THEN
    UPDATE public.user_stats SET level = new_level WHERE user_id = NEW.user_id;
  END IF;
  
  -- Verificar conquistas
  FOR achievement_record IN 
    SELECT a.* FROM public.achievements a
    WHERE NOT EXISTS (
      SELECT 1 FROM public.user_achievements ua 
      WHERE ua.user_id = NEW.user_id AND ua.achievement_id = a.id
    )
  LOOP
    DECLARE
      user_value INTEGER;
    BEGIN
      -- Buscar valor atual do usuário para a condição
      CASE achievement_record.condition_type
        WHEN 'tasks_completed' THEN
          SELECT tasks_completed INTO user_value FROM public.user_stats WHERE user_id = NEW.user_id;
        WHEN 'streak' THEN
          SELECT streak INTO user_value FROM public.user_stats WHERE user_id = NEW.user_id;
        WHEN 'projects_completed' THEN
          SELECT projects_completed INTO user_value FROM public.user_stats WHERE user_id = NEW.user_id;
        ELSE
          user_value := 0;
      END CASE;
      
      -- Se atingiu a condição, desbloquear conquista
      IF user_value >= achievement_record.condition_value THEN
        INSERT INTO public.user_achievements (user_id, achievement_id) 
        VALUES (NEW.user_id, achievement_record.id)
        ON CONFLICT (user_id, achievement_id) DO NOTHING;
        
        -- Adicionar XP da conquista
        UPDATE public.user_stats 
        SET xp = xp + achievement_record.xp_reward
        WHERE user_id = NEW.user_id;
      END IF;
    END;
  END LOOP;
  
  -- Verificar badges (similar às conquistas)
  FOR badge_record IN 
    SELECT b.* FROM public.badges b
    WHERE NOT EXISTS (
      SELECT 1 FROM public.user_badges ub 
      WHERE ub.user_id = NEW.user_id AND ub.badge_id = b.id
    )
  LOOP
    DECLARE
      user_value INTEGER;
    BEGIN
      CASE badge_record.condition_type
        WHEN 'tasks_completed' THEN
          SELECT tasks_completed INTO user_value FROM public.user_stats WHERE user_id = NEW.user_id;
        WHEN 'streak' THEN
          SELECT streak INTO user_value FROM public.user_stats WHERE user_id = NEW.user_id;
        WHEN 'projects_completed' THEN
          SELECT projects_completed INTO user_value FROM public.user_stats WHERE user_id = NEW.user_id;
        ELSE
          user_value := 0;
      END CASE;
      
      IF user_value >= badge_record.condition_value THEN
        INSERT INTO public.user_badges (user_id, badge_id) 
        VALUES (NEW.user_id, badge_record.id)
        ON CONFLICT (user_id, badge_id) DO NOTHING;
      END IF;
    END;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers para atualizar gamificação
CREATE TRIGGER update_gamification_on_task_complete
  AFTER UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_gamification();

-- Inserir dados iniciais

-- Níveis
INSERT INTO public.levels (level, title, xp_required, rewards) VALUES
(1, 'Iniciante', 0, '{"Acesso ao dashboard básico"}'),
(2, 'Organizador', 100, '{"Temas personalizados", "5 projetos"}'),
(3, 'Produtivo', 300, '{"10 projetos", "Relatórios básicos"}'),
(4, 'Especialista', 600, '{"15 projetos", "Relatórios avançados"}'),
(5, 'Mestre', 1000, '{"Projetos ilimitados", "Integrações premium"}'),
(6, 'Lenda', 1500, '{"Badge exclusivo", "Suporte prioritário"}');

-- Conquistas
INSERT INTO public.achievements (title, description, icon, category, xp_reward, condition_type, condition_value) VALUES
('Primeira Tarefa', 'Complete sua primeira tarefa', 'check-circle', 'tasks', 50, 'tasks_completed', 1),
('Produtivo', 'Complete 10 tarefas', 'zap', 'tasks', 100, 'tasks_completed', 10),
('Máquina de Produtividade', 'Complete 50 tarefas', 'cpu', 'tasks', 200, 'tasks_completed', 50),
('Sequência de 7 dias', 'Mantenha uma sequência de 7 dias', 'flame', 'streak', 150, 'streak', 7),
('Sequência de 30 dias', 'Mantenha uma sequência de 30 dias', 'fire', 'streak', 300, 'streak', 30),
('Primeiro Projeto', 'Complete seu primeiro projeto', 'folder-check', 'projects', 100, 'projects_completed', 1),
('Gerente de Projetos', 'Complete 5 projetos', 'briefcase', 'projects', 250, 'projects_completed', 5);

-- Badges
INSERT INTO public.badges (title, description, icon, rarity, condition_type, condition_value) VALUES
('Iniciante', 'Complete sua primeira tarefa', 'star', 'common', 'tasks_completed', 1),
('Trabalhador', 'Complete 25 tarefas', 'hammer', 'rare', 'tasks_completed', 25),
('Mestre das Tarefas', 'Complete 100 tarefas', 'crown', 'epic', 'tasks_completed', 100),
('Lenda da Produtividade', 'Complete 500 tarefas', 'trophy', 'legendary', 'tasks_completed', 500),
('Constante', 'Sequência de 14 dias', 'calendar', 'rare', 'streak', 14),
('Incansável', 'Sequência de 50 dias', 'zap', 'epic', 'streak', 50),
('Organizador', 'Complete 3 projetos', 'folder', 'rare', 'projects_completed', 3);