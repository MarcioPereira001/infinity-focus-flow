-- Adicionar soft delete para todas as tabelas principais
ALTER TABLE public.tasks 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN notification_type TEXT DEFAULT 'none',
ADD COLUMN notification_frequency TEXT DEFAULT 'daily',
ADD COLUMN notification_days INTEGER[] DEFAULT NULL,
ADD COLUMN notification_time TIME DEFAULT '09:00:00';

ALTER TABLE public.projects 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.goals 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;

-- Atualizar user_settings para incluir configurações de notificação e segurança
ALTER TABLE public.user_settings 
ADD COLUMN push_notifications BOOLEAN DEFAULT true,
ADD COLUMN task_deadline_notifications BOOLEAN DEFAULT true,
ADD COLUMN project_update_notifications BOOLEAN DEFAULT true,
ADD COLUMN goal_reminder_notifications BOOLEAN DEFAULT true,
ADD COLUMN security_two_factor BOOLEAN DEFAULT false,
ADD COLUMN security_login_alerts BOOLEAN DEFAULT true,
ADD COLUMN security_activity_log BOOLEAN DEFAULT false;

-- Criar tabela para gerenciar a lixeira
CREATE TABLE public.trash_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  item_type TEXT NOT NULL, -- 'task', 'project', 'goal'
  item_id UUID NOT NULL,
  item_data JSONB NOT NULL, -- dados do item deletado
  deleted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela trash_items
ALTER TABLE public.trash_items ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para trash_items
CREATE POLICY "Users can view their own trash items" 
ON public.trash_items 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own trash items" 
ON public.trash_items 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trash items" 
ON public.trash_items 
FOR DELETE 
USING (auth.uid() = user_id);

-- Criar função para limpeza automática da lixeira
CREATE OR REPLACE FUNCTION public.cleanup_expired_trash()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Deletar itens expirados da lixeira
  DELETE FROM public.trash_items 
  WHERE expires_at < now();
END;
$$;

-- Criar bucket para avatars se não existir
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas para o bucket de avatars
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);