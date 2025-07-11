import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectFormModal } from "@/components/modal/project-form-modal";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Plus, FolderKanban, Users, Calendar, MoreVertical, Trash2, Edit } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Projects() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [projectToDelete, setProjectToDelete] = useState<any>(null);
  const [projectMembers, setProjectMembers] = useState<Record<string, any[]>>({});
  const [projectTaskCounts, setProjectTaskCounts] = useState<Record<string, number>>({});
  
  // Buscar projetos
  useEffect(() => {
    if (!user) return;
    
    const fetchProjects = async () => {
      setIsLoading(true);
      
      try {
        // Buscar projetos que o usuário é proprietário
        const { data: ownedProjects, error: ownedError } = await supabase
          .from('projects')
          .select('*')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false });
        
        if (ownedError) throw ownedError;

        // Buscar projetos onde o usuário é membro
        const { data: memberProjects, error: memberError } = await supabase
          .from('project_members')
          .select(`
            project_id,
            projects:project_id (*)
          `)
          .eq('user_id', user.id);
        
        if (memberError) throw memberError;

        // Combinar projetos próprios e projetos onde é membro
        const allProjects = [...(ownedProjects || [])];
        
        // Adicionar projetos onde é membro (evitando duplicatas)
        memberProjects?.forEach((member: any) => {
          if (member.projects && !allProjects.find(p => p.id === member.projects.id)) {
            allProjects.push(member.projects);
          }
        });
        
        setProjects(allProjects);
        
        // Buscar membros e contagem de tarefas para cada projeto
        if (allProjects.length > 0) {
          await Promise.all([
            fetchProjectMembers(allProjects.map(p => p.id)),
            fetchProjectTaskCounts(allProjects.map(p => p.id))
          ]);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
        toast({
          title: "Erro ao carregar projetos",
          description: "Não foi possível carregar seus projetos",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProjects();
    
    // Configurar subscription para atualizações em tempo real
    const projectsSubscription = supabase
      .channel('projects-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'projects',
        filter: `owner_id=eq.${user.id}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setProjects(prev => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setProjects(prev => prev.map(project => 
            project.id === payload.new.id ? { ...project, ...payload.new } : project
          ));
        } else if (payload.eventType === 'DELETE') {
          setProjects(prev => prev.filter(project => project.id !== payload.old.id));
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(projectsSubscription);
    };
  }, [user]);
  
  // Buscar membros dos projetos
  const fetchProjectMembers = async (projectIds: string[]) => {
    try {
      const { data, error } = await supabase
        .from('project_members')
        .select(`
          project_id,
          user_id,
          role,
          profiles(
            full_name,
            avatar_url
          )
        `)
        .in('project_id', projectIds);
        
      if (error) throw error;
      
      const membersByProject: Record<string, any[]> = {};
      
      data?.forEach(member => {
        if (!membersByProject[member.project_id]) {
          membersByProject[member.project_id] = [];
        }
        membersByProject[member.project_id].push({
          id: member.user_id,
          role: member.role,
          full_name: member.profiles?.full_name || 'Usuário',
          avatar_url: member.profiles?.avatar_url
        });
      });
      
      setProjectMembers(membersByProject);
    } catch (error) {
      console.error('Error fetching project members:', error);
    }
  };
  
  // Buscar contagem de tarefas dos projetos
  const fetchProjectTaskCounts = async (projectIds: string[]) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('project_id')
        .in('project_id', projectIds);
        
      if (error) throw error;
      
      const taskCountsByProject: Record<string, number> = {};
      
      data?.forEach(item => {
        if (!taskCountsByProject[item.project_id]) {
          taskCountsByProject[item.project_id] = 0;
        }
        taskCountsByProject[item.project_id]++;
      });
      
      setProjectTaskCounts(taskCountsByProject);
    } catch (error) {
      console.error('Error fetching task counts:', error);
    }
  };
  
  // Manipular criação de projeto
  const handleProjectCreated = (newProject: any) => {
    toast({
      title: "Projeto criado",
      description: "Seu projeto foi criado com sucesso",
    });
  };
  
  // Manipular atualização de projeto
  const handleProjectUpdated = (updatedProject: any) => {
    toast({
      title: "Projeto atualizado",
      description: "Seu projeto foi atualizado com sucesso",
    });
  };
  
  // Manipular exclusão de projeto
  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectToDelete.id);
        
      if (error) throw error;
      
      setProjects(prev => prev.filter(project => project.id !== projectToDelete.id));
      
      toast({
        title: "Projeto excluído",
        description: "O projeto foi excluído com sucesso",
      });
      
      setProjectToDelete(null);
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: "Erro ao excluir projeto",
        description: "Não foi possível excluir o projeto",
        variant: "destructive",
      });
    }
  };
  
  // Renderizar membros do projeto
  const renderProjectMembers = (projectId: string) => {
    const members = projectMembers[projectId] || [];
    const maxDisplay = 3;
    
    return (
      <div className="flex -space-x-2">
        {members.slice(0, maxDisplay).map((member, index) => (
          <Avatar key={index} className="h-8 w-8 border-2 border-background">
            <AvatarImage src={member.avatar_url} />
            <AvatarFallback>
              {member.full_name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
        ))}
        
        {members.length > maxDisplay && (
          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted text-xs font-medium">
            +{members.length - maxDisplay}
          </div>
        )}
      </div>
    );
  };
  
  // Renderizar cartões de projetos
  const renderProjectCards = () => {
    if (isLoading) {
      return (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando projetos...</p>
        </div>
      );
    }
    
    if (projects.length === 0) {
      return (
        <div className="text-center py-8">
          <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">Nenhum projeto encontrado</h3>
          <p className="text-muted-foreground">Crie seu primeiro projeto para começar</p>
          <Button 
            className="mt-4"
            onClick={() => setIsNewProjectModalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Projeto
          </Button>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map(project => (
          <Card key={project.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{project.name}</CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate(`/projects/${project.id}`)}>
                      <FolderKanban className="mr-2 h-4 w-4" />
                      Abrir
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSelectedProject(project)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setProjectToDelete(project)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <CardDescription className="line-clamp-2">
                {project.description || "Sem descrição"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>
                    {project.start_date ? (
                      <>
                        Início: {format(new Date(project.start_date), "dd/MM/yyyy", { locale: ptBR })}
                        {project.end_date && (
                          <> • Término: {format(new Date(project.end_date), "dd/MM/yyyy", { locale: ptBR })}</>
                        )}
                      </>
                    ) : (
                      "Sem data definida"
                    )}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm">
                    <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{(projectMembers[project.id] || []).length} membros</span>
                  </div>
                  
                  <Badge variant="outline">
                    {projectTaskCounts[project.id] || 0} tarefas
                  </Badge>
                </div>
                
                <div className="pt-2">
                  {renderProjectMembers(project.id)}
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/50 pt-3">
              <Button 
                variant="default" 
                className="w-full"
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <FolderKanban className="mr-2 h-4 w-4" />
                Abrir Projeto
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  };
  
  return (
    <AppLayout>
      <div className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Projetos</h1>
          <Button onClick={() => setIsNewProjectModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Projeto
          </Button>
        </div>
        
        {renderProjectCards()}
      </div>
      
      {/* Modal de novo projeto */}
      <ProjectFormModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onProjectCreated={handleProjectCreated}
      />
      
      {/* Modal de edição de projeto */}
      <ProjectFormModal
        isOpen={!!selectedProject}
        onClose={() => setSelectedProject(null)}
        onProjectUpdated={handleProjectUpdated}
        existingProject={selectedProject}
      />
      
      {/* Modal de confirmação de exclusão */}
      <Dialog open={!!projectToDelete} onOpenChange={(open) => !open && setProjectToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir projeto</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o projeto "{projectToDelete?.name}"?
              Esta ação não pode ser desfeita e todas as tarefas associadas serão excluídas.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProjectToDelete(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteProject}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
