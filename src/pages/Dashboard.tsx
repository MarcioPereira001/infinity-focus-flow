
import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Plus, CheckCircle, Clock, AlertCircle, Calendar, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0,
    totalProjects: 0,
    totalGoals: 0,
  });
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Buscar estatísticas do dashboard
  useEffect(() => {
    if (!user) return;
    
    const fetchDashboardData = async () => {
      try {
        // Buscar estatísticas de tarefas
        const { data: tasks, error: tasksError } = await supabase
          .from('tasks')
          .select('status, due_date')
          .eq('user_id', user.id);
        
        if (tasksError) throw tasksError;

        // Buscar projetos
        const { data: projects, error: projectsError } = await supabase
          .from('projects')
          .select('id, name, created_at')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (projectsError) throw projectsError;

        // Buscar metas
        const { data: goals, error: goalsError } = await supabase
          .from('goals')
          .select('*')
          .eq('user_id', user.id);
        
        if (goalsError) throw goalsError;

        // Buscar tarefas recentes
        const { data: recentTasksData, error: recentTasksError } = await supabase
          .from('tasks')
          .select('*, projects(name)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (recentTasksError) throw recentTasksError;

        // Calcular estatísticas
        const totalTasks = tasks?.length || 0;
        const completedTasks = tasks?.filter(task => task.status === 'Concluído').length || 0;
        const pendingTasks = tasks?.filter(task => task.status !== 'Concluído').length || 0;
        const overdueTasks = tasks?.filter(task => {
          if (!task.due_date || task.status === 'Concluído') return false;
          return new Date(task.due_date) < new Date();
        }).length || 0;

        setStats({
          totalTasks,
          completedTasks,
          pendingTasks,
          overdueTasks,
          totalProjects: projects?.length || 0,
          totalGoals: goals?.length || 0,
        });

        setRecentTasks(recentTasksData || []);
        setRecentProjects(projects || []);
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar os dados do dashboard",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [user]);

  const getTaskStatusBadge = (status: string) => {
    switch (status) {
      case 'Concluído':
        return <Badge variant="default" className="bg-green-100 text-green-800">Concluído</Badge>;
      case 'Em Andamento':
        return <Badge variant="secondary">Em Andamento</Badge>;
      case 'Aguardando Aprovação':
        return <Badge variant="outline">Aguardando</Badge>;
      default:
        return <Badge variant="outline">Novo</Badge>;
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="container py-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo de volta, {profile?.full_name || user?.email}!
          </p>
        </div>

        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Tarefas</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTasks}</div>
              <p className="text-xs text-muted-foreground">
                {stats.completedTasks} concluídas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tarefas Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingTasks}</div>
              <p className="text-xs text-muted-foreground">
                {stats.overdueTasks} em atraso
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projetos</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProjects}</div>
              <p className="text-xs text-muted-foreground">
                Projetos ativos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Metas</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalGoals}</div>
              <p className="text-xs text-muted-foreground">
                Metas definidas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Progresso geral */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Progresso Geral</CardTitle>
            <CardDescription>
              Seu progresso de conclusão de tarefas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tarefas Concluídas</span>
                <span className="text-sm text-muted-foreground">
                  {stats.completedTasks} de {stats.totalTasks}
                </span>
              </div>
              <Progress 
                value={stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0} 
                className="w-full" 
              />
            </div>
          </CardContent>
        </Card>

        {/* Grid de tarefas recentes e projetos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tarefas Recentes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Tarefas Recentes</CardTitle>
                <CardDescription>Suas últimas tarefas criadas</CardDescription>
              </div>
              <Button asChild size="sm">
                <Link to="/dashboard">
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Tarefa
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTasks.length > 0 ? (
                  recentTasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{task.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {task.projects?.name || 'Sem projeto'}
                        </p>
                      </div>
                      {getTaskStatusBadge(task.status)}
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    Nenhuma tarefa encontrada
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Projetos Recentes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Projetos Recentes</CardTitle>
                <CardDescription>Seus projetos mais recentes</CardDescription>
              </div>
              <Button asChild size="sm">
                <Link to="/projects">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Projeto
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentProjects.length > 0 ? (
                  recentProjects.map((project) => (
                    <div key={project.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{project.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Criado em {new Date(project.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/projects/${project.id}`}>
                          Abrir
                        </Link>
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    Nenhum projeto encontrado
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
