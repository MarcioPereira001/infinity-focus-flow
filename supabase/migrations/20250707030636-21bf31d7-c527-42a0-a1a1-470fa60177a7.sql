-- Create profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  plan_status TEXT DEFAULT 'trial' CHECK (plan_status IN ('trial', 'pro', 'expired')),
  trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tasks table (sem coluna completed redundante)
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'Novo',
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  responsible_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project_members table
CREATE TABLE public.project_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Create kanban_columns table
CREATE TABLE public.kanban_columns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  color TEXT DEFAULT '#64748b',
  position INTEGER NOT NULL DEFAULT 0,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_columns ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create security definer function to check project access
CREATE OR REPLACE FUNCTION public.has_project_access(project_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_uuid 
    AND (p.owner_id = auth.uid() OR 
         EXISTS (
           SELECT 1 FROM public.project_members pm 
           WHERE pm.project_id = project_uuid 
           AND pm.user_id = auth.uid()
         ))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create policies for projects
CREATE POLICY "Users can view projects they own or are members of" 
ON public.projects 
FOR SELECT 
USING (owner_id = auth.uid() OR EXISTS (
  SELECT 1 FROM public.project_members pm 
  WHERE pm.project_id = id AND pm.user_id = auth.uid()
));

CREATE POLICY "Users can create their own projects" 
ON public.projects 
FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Project owners can update their projects" 
ON public.projects 
FOR UPDATE 
USING (auth.uid() = owner_id);

CREATE POLICY "Project owners can delete their projects" 
ON public.projects 
FOR DELETE 
USING (auth.uid() = owner_id);

-- Create policies for tasks
CREATE POLICY "Users can view tasks they have access to" 
ON public.tasks 
FOR SELECT 
USING (
  user_id = auth.uid() OR 
  responsible_id = auth.uid() OR 
  (project_id IS NULL AND user_id = auth.uid()) OR
  (project_id IS NOT NULL AND public.has_project_access(project_id))
);

CREATE POLICY "Users can create tasks" 
ON public.tasks 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND
  (project_id IS NULL OR public.has_project_access(project_id))
);

CREATE POLICY "Users can update tasks they have access to" 
ON public.tasks 
FOR UPDATE 
USING (
  user_id = auth.uid() OR 
  responsible_id = auth.uid() OR
  (project_id IS NOT NULL AND public.has_project_access(project_id))
);

CREATE POLICY "Users can delete tasks they created or have project access" 
ON public.tasks 
FOR DELETE 
USING (
  user_id = auth.uid() OR
  (project_id IS NOT NULL AND public.has_project_access(project_id))
);

-- Create policies for project_members (CORRIGIDA - owners e admins podem gerenciar)
CREATE POLICY "Users can view project members for projects they have access to" 
ON public.project_members 
FOR SELECT 
USING (public.has_project_access(project_id));

CREATE POLICY "Owners and Admins can manage members" 
ON public.project_members 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.project_members pm
  WHERE pm.project_id = project_members.project_id
    AND pm.user_id = auth.uid()
    AND (pm.role = 'owner' OR pm.role = 'admin')
));

-- Create policies for kanban_columns (CORRIGIDA - apenas owners e admins podem gerenciar)
CREATE POLICY "Users can view columns for projects they have access to" 
ON public.kanban_columns 
FOR SELECT 
USING (public.has_project_access(project_id));

CREATE POLICY "Owners and Admins can manage columns" 
ON public.kanban_columns 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.project_members pm
  WHERE pm.project_id = kanban_columns.project_id
    AND pm.user_id = auth.uid()
    AND (pm.role = 'owner' OR pm.role = 'admin')
));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_kanban_columns_updated_at
  BEFORE UPDATE ON public.kanban_columns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for all tables
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.projects REPLICA IDENTITY FULL;
ALTER TABLE public.tasks REPLICA IDENTITY FULL;
ALTER TABLE public.project_members REPLICA IDENTITY FULL;
ALTER TABLE public.kanban_columns REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.kanban_columns;

-- Insert default kanban columns for new projects
CREATE OR REPLACE FUNCTION public.create_default_columns()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.kanban_columns (title, color, position, project_id) VALUES
    ('Novo', '#64748b', 0, NEW.id),
    ('Em Andamento', '#f59e0b', 1, NEW.id),
    ('Aguardando Aprovação', '#8b5cf6', 2, NEW.id),
    ('Concluído', '#10b981', 3, NEW.id);
  
  -- Add owner as project member
  INSERT INTO public.project_members (project_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER create_default_columns_trigger
  AFTER INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.create_default_columns();