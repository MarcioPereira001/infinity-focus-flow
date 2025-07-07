import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, FolderKanban, Users, Calendar, MoreHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface Project {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  task_count?: number;
  member_count?: number;
}

export default function Projects() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  const fetchProjects = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          tasks(count),
          project_members(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to include counts
      const projectsWithCounts = data?.map(project => ({
        ...project,
        task_count: project.tasks?.[0]?.count || 0,
        member_count: project.project_members?.[0]?.count || 0,
      })) || [];

      setProjects(projectsWithCounts);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Erro ao carregar projetos",
        description: "Não foi possível carregar a lista de projetos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    if (!user || !newProjectName.trim()) return;

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: newProjectName.trim(),
          owner_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Projeto criado com sucesso!",
        description: `O projeto "${newProjectName}" foi criado.`,
      });

      setIsNewProjectModalOpen(false);
      setNewProjectName("");
      fetchProjects(); // Refresh the list
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Erro ao criar projeto",
        description: "Não foi possível criar o projeto",
        variant: "destructive",
      });
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      toast({
        title: "Projeto excluído com sucesso!",
      });

      fetchProjects(); // Refresh the list
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: "Erro ao excluir projeto",
        description: "Não foi possível excluir o projeto",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projetos</h1>
          <p className="text-muted-foreground">
            Gerencie seus projetos e colabore com sua equipe
          </p>
        </div>
        
        <Button className="btn-gradient" onClick={() => setIsNewProjectModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Projeto
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <FolderKanban className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum projeto encontrado</h3>
          <p className="text-muted-foreground mb-4">
            Crie seu primeiro projeto para começar a organizar suas tarefas
          </p>
          <Button className="btn-gradient" onClick={() => setIsNewProjectModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Criar primeiro projeto
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1">{project.name}</CardTitle>
                    <CardDescription className="flex items-center text-sm">
                      <Calendar className="w-3 h-3 mr-1" />
                      Criado em {new Date(project.created_at).toLocaleDateString('pt-BR')}
                    </CardDescription>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/projects/${project.id}`)}>
                        Abrir Projeto
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => deleteProject(project.id)}
                        className="text-destructive"
                      >
                        Excluir Projeto
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <div className="flex items-center">
                    <FolderKanban className="w-4 h-4 mr-1" />
                    {project.task_count || 0} tarefas
                  </div>
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    {project.member_count || 0} membros
                  </div>
                </div>
                
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  Abrir Projeto
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New Project Modal */}
      <Dialog open={isNewProjectModalOpen} onOpenChange={setIsNewProjectModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Projeto</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Nome do Projeto</Label>
              <Input
                id="project-name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Digite o nome do projeto"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    createProject();
                  }
                }}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setIsNewProjectModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                onClick={createProject} 
                className="btn-gradient"
                disabled={!newProjectName.trim()}
              >
                Criar Projeto
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
