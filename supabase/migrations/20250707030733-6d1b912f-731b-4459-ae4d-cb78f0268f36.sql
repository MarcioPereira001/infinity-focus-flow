-- Remove a coluna completed redundante da tabela tasks
ALTER TABLE public.tasks DROP COLUMN IF EXISTS completed;

-- Atualizar política para project_members - permitir que owners e admins gerenciem membros
DROP POLICY IF EXISTS "Project owners can manage members" ON public.project_members;
DROP POLICY IF EXISTS "Owners and Admins can manage members" ON public.project_members;

CREATE POLICY "Owners and Admins can manage members" 
ON public.project_members 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.project_members pm
  WHERE pm.project_id = project_members.project_id
    AND pm.user_id = auth.uid()
    AND (pm.role = 'owner' OR pm.role = 'admin')
));

-- Atualizar política para kanban_columns - apenas owners e admins podem gerenciar colunas
DROP POLICY IF EXISTS "Users can manage columns for projects they have access to" ON public.kanban_columns;
DROP POLICY IF EXISTS "Owners and Admins can manage columns" ON public.kanban_columns;

CREATE POLICY "Owners and Admins can manage columns" 
ON public.kanban_columns 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.project_members pm
  WHERE pm.project_id = kanban_columns.project_id
    AND pm.user_id = auth.uid()
    AND (pm.role = 'owner' OR pm.role = 'admin')
));