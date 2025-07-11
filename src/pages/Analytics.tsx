import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from "recharts";
import { Calendar, TrendingUp, Target, CheckCircle2, Clock, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTasks } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { useGoals } from "@/hooks/useGoals";
import { GoalFormModal } from "@/components/modal/goal-form-modal";

export default function Analytics() {
  const { user } = useAuth();
  const { tasks } = useTasks();
  const { projects } = useProjects();
  const { goals, getFilteredGoals } = useGoals();
  const [timeFilter, setTimeFilter] = useState("thisMonth");
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);

  // Calcular estatísticas das metas
  const activeGoals = getFilteredGoals('active');
  const completedGoals = getFilteredGoals('completed');
  const allGoals = getFilteredGoals('all');

  // Dados para gráficos
  const tasksByStatus = [
    { name: 'Novo', value: tasks.filter(t => t.status === 'Novo').length, color: '#64748b' },
    { name: 'Em Andamento', value: tasks.filter(t => t.status === 'Em Andamento').length, color: '#f59e0b' },
    { name: 'Aguardando', value: tasks.filter(t => t.status === 'Aguardando Aprovação').length, color: '#8b5cf6' },
    { name: 'Concluído', value: tasks.filter(t => t.status === 'Concluído').length, color: '#10b981' }
  ];

  const tasksByPriority = [
    { name: 'Alta', value: tasks.filter(t => t.priority === 'high').length, color: '#ef4444' },
    { name: 'Média', value: tasks.filter(t => t.priority === 'medium').length, color: '#f59e0b' },
    { name: 'Baixa', value: tasks.filter(t => t.priority === 'low').length, color: '#10b981' }
  ];

  const projectProgress = projects.map(project => {
    const projectTasks = tasks.filter(t => t.project_id === project.id);
    const completedTasks = projectTasks.filter(t => t.status === 'Concluído').length;
    const totalTasks = projectTasks.length;
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    return {
      name: project.name,
      progress: Math.round(progress),
      completed: completedTasks,
      total: totalTasks
    };
  });

  const handleGoalCreated = () => {
    setIsGoalModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Análise detalhada do seu desempenho e progresso
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="thisWeek">Esta semana</SelectItem>
              <SelectItem value="thisMonth">Este mês</SelectItem>
              <SelectItem value="thisQuarter">Este trimestre</SelectItem>
              <SelectItem value="thisYear">Este ano</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="tasks">Tarefas</TabsTrigger>
          <TabsTrigger value="projects">Projetos</TabsTrigger>
          <TabsTrigger value="goals">Metas e Objetivos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="card-soft">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Total de Tarefas</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tasks.length}</div>
                <p className="text-xs text-muted-foreground">
                  {tasks.filter(t => t.status === 'Concluído').length} concluídas
                </p>
              </CardContent>
            </Card>

            <Card className="card-soft">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Projetos Ativos</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{projects.length}</div>
                <p className="text-xs text-muted-foreground">
                  Em andamento
                </p>
              </CardContent>
            </Card>

            <Card className="card-soft">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Metas Ativas</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeGoals.length}</div>
                <p className="text-xs text-muted-foreground">
                  {completedGoals.length} concluídas
                </p>
              </CardContent>
            </Card>

            <Card className="card-soft">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'Concluído').length / tasks.length) * 100) : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Tarefas concluídas
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="card-soft">
              <CardHeader>
                <CardTitle>Distribuição por Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={tasksByStatus}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {tasksByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="card-soft">
              <CardHeader>
                <CardTitle>Distribuição por Prioridade</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={tasksByPriority}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {tasksByPriority.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          {/* Conteúdo de análise de tarefas */}
          <Card className="card-soft">
            <CardHeader>
              <CardTitle>Visão Geral das Tarefas</CardTitle>
              <CardDescription>
                Estatísticas gerais sobre suas tarefas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Total de Tarefas</p>
                  <div className="text-2xl font-bold">{tasks.length}</div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Tarefas Concluídas</p>
                  <div className="text-2xl font-bold">
                    {tasks.filter(t => t.status === 'Concluído').length}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Tarefas Pendentes</p>
                  <div className="text-2xl font-bold">
                    {tasks.filter(t => t.status !== 'Concluído').length}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-soft">
            <CardHeader>
              <CardTitle>Tarefas Concluídas por Dia</CardTitle>
              <CardDescription>
                Acompanhe o número de tarefas concluídas ao longo do tempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={[]}> {/* Adicione seus dados aqui */}
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="uv" stroke="#8884d8" fill="#8884d8" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <Card className="card-soft">
            <CardHeader>
              <CardTitle>Progresso dos Projetos</CardTitle>
              <CardDescription>
                Acompanhe o progresso de cada projeto baseado nas tarefas concluídas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={projectProgress}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="progress" fill="#3b82f6" name="Progresso (%)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => {
              const projectTasks = tasks.filter(t => t.project_id === project.id);
              const completedTasks = projectTasks.filter(t => t.status === 'Concluído').length;
              const progress = projectTasks.length > 0 ? (completedTasks / projectTasks.length) * 100 : 0;
              
              return (
                <Card key={project.id} className="card-soft">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{project.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {project.description || "Sem descrição"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progresso</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{completedTasks} de {projectTasks.length} tarefas</span>
                        <Badge variant="outline" className="text-xs">
                          {project.priority === 'high' ? 'Alta' : 
                           project.priority === 'medium' ? 'Média' : 'Baixa'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="goals" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Metas e Objetivos</h2>
              <p className="text-muted-foreground">
                Gerencie e acompanhe suas metas de longo prazo
              </p>
            </div>
            <Button onClick={() => setIsGoalModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Meta
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="card-soft">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Metas Ativas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{activeGoals.length}</div>
                <p className="text-sm text-muted-foreground">Em andamento</p>
              </CardContent>
            </Card>

            <Card className="card-soft">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Metas Concluídas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-success">{completedGoals.length}</div>
                <p className="text-sm text-muted-foreground">Finalizadas</p>
              </CardContent>
            </Card>

            <Card className="card-soft">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Todas as Metas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{allGoals.length}</div>
                <p className="text-sm text-muted-foreground">Total criadas</p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            {allGoals.map((goal) => {
              const progress = goal.target_value && goal.target_value > 0 
                ? (goal.current_value || 0) / goal.target_value * 100 
                : 0;
              const isCompleted = progress >= 100;
              
              return (
                <Card key={goal.id} className="card-soft">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{goal.title}</CardTitle>
                        <CardDescription className="line-clamp-2 mt-1">
                          {goal.description}
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={isCompleted ? "default" : "outline"}
                          className={isCompleted ? "bg-success text-success-foreground" : ""}
                        >
                          {isCompleted ? "Concluída" : "Ativa"}
                        </Badge>
                        <Badge variant="outline">
                          {goal.priority === 'high' ? 'Alta' : 
                           goal.priority === 'medium' ? 'Média' : 'Baixa'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progresso</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{goal.current_value || 0} de {goal.target_value || 1}</span>
                        {goal.end_date && (
                          <span>
                            Termina em {new Date(goal.end_date).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            {allGoals.length === 0 && (
              <Card className="card-soft">
                <CardContent className="py-8 text-center">
                  <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nenhuma meta criada</h3>
                  <p className="text-muted-foreground mb-4">
                    Crie sua primeira meta para começar a acompanhar seus objetivos
                  </p>
                  <Button onClick={() => setIsGoalModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Meta
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <GoalFormModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        onGoalCreated={handleGoalCreated}
      />
    </div>
  );
}
