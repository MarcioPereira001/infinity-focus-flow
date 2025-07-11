import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  email_notifications: boolean;
  task_reminders: boolean;
  project_updates: boolean;
  reminder_time: string;
  push_notifications: boolean;
  task_deadline_notifications: boolean;
  project_update_notifications: boolean;
  goal_reminder_notifications: boolean;
  security_two_factor: boolean;
  security_login_alerts: boolean;
  security_activity_log: boolean;
  created_at: string;
  updated_at: string;
}

export function useUserSettings() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setProfile(data);
      } else {
        // Criar perfil se não existir
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            full_name: user.email?.split('@')[0] || null
          })
          .select()
          .single();

        if (createError) throw createError;
        setProfile(newProfile);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchSettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setSettings(data);
      } else {
        // Criar configurações se não existir
        const { data: newSettings, error: createError } = await supabase
          .from('user_settings')
          .insert({
            user_id: user.id
          })
          .select()
          .single();

        if (createError) throw createError;
        setSettings(newSettings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) return { error: new Error('No user or profile') };

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      setProfile(data);
      
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso",
      });

      return { data, error: null };
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message,
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const updateSettings = async (updates: Partial<UserSettings>) => {
    if (!user || !settings) return { error: new Error('No user or settings') };

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      setSettings(data);
      
      toast({
        title: "Configurações salvas",
        description: "Suas preferências foram atualizadas",
      });

      return { data, error: null };
    } catch (error: any) {
      console.error('Error updating settings:', error);
      toast({
        title: "Erro ao salvar configurações",
        description: error.message,
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return { error: new Error('No user logged in') };

    setUploading(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload do arquivo
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Atualizar perfil com nova URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
      
      toast({
        title: "Avatar atualizado",
        description: "Sua foto de perfil foi alterada com sucesso",
      });

      return { data: publicUrl, error: null };
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Erro ao fazer upload",
        description: error.message,
        variant: "destructive",
      });
      return { data: null, error };
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchSettings();
    }
  }, [user]);

  return {
    profile,
    settings,
    loading,
    uploading,
    updateProfile,
    updateSettings,
    uploadAvatar,
    refetch: () => {
      fetchProfile();
      fetchSettings();
    },
  };
}