
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';

export type Project = Tables<'projects'>;
export type ProjectInsert = TablesInsert<'projects'>;
export type ProjectUpdate = TablesUpdate<'projects'>;

export type KanbanColumn = Tables<'kanban_columns'>;
export type ProjectMember = Tables<'project_members'> & {
  profiles?: Tables<'profiles'>;
};

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchProjects = async () => {
    if (!user) return;

    try {
      // Get projects where user is owner or member
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          project_members!inner(role)
        `)
        .or(`owner_id.eq.${user.id},project_members.user_id.eq.${user.id}`);

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (projectData: Omit<ProjectInsert, 'owner_id'>) => {
    if (!user) return { error: new Error('No user logged in') };

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          ...projectData,
          owner_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setProjects(prev => [...prev, data]);
      }

      return { data, error };
    } catch (error) {
      return { error };
    }
  };

  const updateProject = async (projectId: string, updates: ProjectUpdate) => {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId)
      .select()
      .single();

    if (!error && data) {
      setProjects(prev => prev.map(project => 
        project.id === projectId ? data : project
      ));
    }

    return { data, error };
  };

  const deleteProject = async (projectId: string) => {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (!error) {
      setProjects(prev => prev.filter(project => project.id !== projectId));
    }

    return { error };
  };

  useEffect(() => {
    fetchProjects();

    // Set up real-time subscription
    const channel = supabase
      .channel('projects-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
        },
        () => {
          fetchProjects();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    projects,
    loading,
    createProject,
    updateProject,
    deleteProject,
    refetch: fetchProjects,
  };
}

export function useProject(projectId?: string) {
  const [project, setProject] = useState<Project | null>(null);
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProject = async () => {
    if (!projectId) return;

    try {
      // Fetch project details
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;

      // Fetch columns
      const { data: columnsData, error: columnsError } = await supabase
        .from('kanban_columns')
        .select('*')
        .eq('project_id', projectId)
        .order('position');

      if (columnsError) throw columnsError;

      // Fetch members with profile data using correct syntax
      const { data: membersData, error: membersError } = await supabase
        .from('project_members')
        .select(`
          *,
          profiles(*)
        `)
        .eq('project_id', projectId);

      if (membersError) throw membersError;

      setProject(projectData);
      setColumns(columnsData || []);
      setMembers(membersData || []);
    } catch (error) {
      console.error('Error fetching project:', error);
    } finally {
      setLoading(false);
    }
  };

  const addMember = async (email: string, role: 'admin' | 'member') => {
    if (!projectId) return { error: new Error('No project ID') };

    try {
      // Find user by email from profiles table
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .ilike('full_name', `%${email}%`);

      if (profileError) throw profileError;
      if (!profiles || profiles.length === 0) {
        return { error: new Error('User not found') };
      }

      const profile = profiles[0];

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('project_members')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', profile.user_id)
        .single();

      if (existingMember) {
        return { error: new Error('User is already a member') };
      }

      const { data, error } = await supabase
        .from('project_members')
        .insert({
          project_id: projectId,
          user_id: profile.user_id,
          role,
        })
        .select(`
          *,
          profiles(*)
        `)
        .single();

      if (!error && data) {
        setMembers(prev => [...prev, data]);
      }

      return { data, error };
    } catch (error) {
      return { error };
    }
  };

  const removeMember = async (memberId: string) => {
    const { error } = await supabase
      .from('project_members')
      .delete()
      .eq('id', memberId);

    if (!error) {
      setMembers(prev => prev.filter(member => member.id !== memberId));
    }

    return { error };
  };

  const updateColumn = async (columnId: string, updates: Partial<KanbanColumn>) => {
    const { data, error } = await supabase
      .from('kanban_columns')
      .update(updates)
      .eq('id', columnId)
      .select()
      .single();

    if (!error && data) {
      setColumns(prev => prev.map(col => 
        col.id === columnId ? data : col
      ));
    }

    return { data, error };
  };

  useEffect(() => {
    fetchProject();

    if (!projectId) return;

    // Set up real-time subscriptions
    const projectChannel = supabase
      .channel(`project-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'kanban_columns',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          fetchProject();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_members',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          fetchProject();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(projectChannel);
    };
  }, [projectId]);

  return {
    project,
    columns,
    members,
    loading,
    addMember,
    removeMember,
    updateColumn,
    refetch: fetchProject,
  };
}
