
-- Adicionar colunas faltantes na tabela projects
ALTER TABLE public.projects 
ADD COLUMN description TEXT,
ADD COLUMN priority TEXT DEFAULT 'medium',
ADD COLUMN start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN is_indefinite BOOLEAN DEFAULT false;

-- Adicionar colunas faltantes na tabela goals
ALTER TABLE public.goals 
ADD COLUMN priority TEXT DEFAULT 'medium',
ADD COLUMN project_ids UUID[],
ADD COLUMN task_ids UUID[];

-- Adicionar colunas faltantes na tabela tasks
ALTER TABLE public.tasks 
ADD COLUMN start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN goal_ids UUID[],
ADD COLUMN is_indefinite BOOLEAN DEFAULT false;

-- Atualizar trigger para updated_at nas tabelas
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Adicionar trigger para projects se não existir
DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON public.projects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Adicionar trigger para goals se não existir
DROP TRIGGER IF EXISTS update_goals_updated_at ON public.goals;
CREATE TRIGGER update_goals_updated_at 
    BEFORE UPDATE ON public.goals 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
