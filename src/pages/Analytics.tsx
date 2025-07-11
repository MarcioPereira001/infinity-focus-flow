
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Target, Plus, Calendar, CheckCircle, Clock, TrendingUp, TrendingDown, Award, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { GoalFormModal } from "@/components/modal/goal-form-modal";
import { useGoals } from "@/hooks/useGoals";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Analytics() {
  const { user } = useAuth();
  const { goals, loading: goalsLoading, createGoal, updateGoal, deleteGoal } = useGoals();
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>({
    tasks: {
      total: 0,
      completed: 0,
      pending: 0,
      overdue: 0
    },
    projects: {
      total: 0,
      active: 0,
      completed: 0
    },
    productivity: {
      weeklyCompletion: [],
      tasksByPriority: [],
      tasksByStatus: []
    }
  });
  const [loading, setLoading] = useState(true);

  // Carregar dados de analytics
  useEffect(() => {
    if (!user) return;

    const fetchAnalytics = async () => {
      setLoading(true);
      
      try {
        // Buscar tarefas
        const { data: tasks, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id);

        if (tasksError) throw tasksError;

        // Buscar projetos
        const { data: projects, error: projectsError } = await supabase
          .from('projects')
          .select('*')
          .eq('owner_id', user.id);

        if (projectsError) throw projectsError;

        // Processar dados
        const now = new Date();
        const completedTasks = tasks?.filter(task => task.status === 'Concluído') || [];
        const pendingTasks = tasks?.filter(task => task.status !== 'Concluído') || [];
        const overdueTasks = tasks?.filter(task => 
          task.due_date && new Date(task.due_date) < now && task.status !== 'Concluído'
        ) || [];

        // Agrupar tarefas por prioridade
        const tasksByPriority = [
          { name: 'Alta', value: tasks?.filter(task => task.priority === 'high').length || 0, color: '#ef4444' },
          { name: 'Média', value: tasks?.filter(task => task.priority === 'medium').length || 0, color: '#f59e0b' },
          { name: 'Baixa', value: tasks?.filter(task => task.priority === 'low').length || 0, color: '#10b981' }
        ];

        // Agrupar tarefas por status
        const tasksByStatus = [
          { name: 'Concluído', value: completedTasks.length, color: '#10b981' },
          { name: 'Em Andamento', value: tasks?.filter(task => task.status === 'Em Andamento').length || 0, color: '#f59e0b' },
          { name: 'Novo', value: tasks?.filter(task => task.status === 'Novo').length || 0, color: '#6b7280' }
        ];

        // Dados de completion semanal (últimos 7 dias)
        const weeklyCompletion = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dayTasks = completedTasks.filter(task => {
            const taskDate = new Date(task.updated_at);
            return taskDate.toDateString() === date.toDateString();
          });
          
          weeklyCompletion.push({
            name: format(date, 'dd/MM', { locale: ptBR }),
            completed: dayTasks.length
          });
        }

        setAnalytics({
          tasks: {
            total: tasks?.length || 0,
            completed: completedTasks.length,
            pending: pendingTasks.length,
            overdue: overdueTasks.length
          },
          projects: {
            total: projects?.length || 0,
            active: projects?.filter(p => !p.end_date || new Date(p.end_date) > now).length || 0,
            completed: projects?.filter(p => p.end_date && new Date(p.end_date) <= now).length || 0
          },
          productivity: {
            weeklyCompletion,
            tasksByPriority,
            tasksByStatus
          }
        });

      } catch (error) {
        console.error('Error fetching analytics:', error);
        toast({
          title: "Erro ao carregar analytics",
          description: "Não foi possível carregar os dados de analytics",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [user]);

  const handleGoalCreated = async (goalData: any) => {
    try {
      await createGoal(goalData);
      toast({
        title: "Meta criada",
        description: "Sua meta foi criada com sucesso",
      });
      setIsGoalModalOpen(false);
    } catch (error) {
      toast({
        title: "Erro ao criar meta",
        description: "Não foi possível criar a meta",
        variant: "destructive",
      });
    }
  };

  const handleGoalUpdated = async (goalData: any) => {
    try {
      await updateGoal(selectedGoal.id, goalData);
      toast({
        title: "Meta atualizada",
        description: "Sua meta foi atualizada com sucesso",
      });
      setSelectedGoal(null);
    } catch (error) {
      toast({
        title: "Erro ao atualizar meta",
        description: "Não foi possível atualizar a meta",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics & Metas</h1>
          <p className="text-muted-foreground">
            Acompanhe seu progresso e defina suas metas
          </p>
        </div>
        <Button onClick={() => setIsGoalModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Meta
        </Button>
      </div>

      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="goals">Metas</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-6">
          {/* Cards de resumo */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="card-soft">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Total de Tarefas</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.tasks.total}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics.tasks.completed} concluídas
                </p>
              </CardContent>
            </Card>

            <Card className="card-soft">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
                  <TrendingUp className="h-4 w-4 text-success" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.tasks.total > 0 
                    ? Math.round((analytics.tasks.completed / analytics.tasks.total) * 100) 
                    : 0}%
                </div>
                <Progress 
                  value={analytics.tasks.total > 0 
                    ? (analytics.tasks.completed / analytics.tasks.total) * 100 
                    : 0} 
                  className="mt-2" 
                />
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
                <div className="text-2xl font-bold">{analytics.projects.active}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics.projects.total} total
                </p>
              </CardContent>
            </Card>

            <Card className="card-soft">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Tarefas Atrasadas</CardTitle>
                  <Clock className="h-4 w-4 text-warning" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">{analytics.tasks.overdue}</div>
                <p className="text-xs text-muted-foreground">
                  Precisam de atenção
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="card-soft">
              <CardHeader>
                <CardTitle>Conclusões da Semana</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.productivity.weeklyCompletion}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="completed" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="card-soft">
              <CardHeader>
                <CardTitle>Tarefas por Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.productivity.tasksByStatus}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label
                    >
                      {analytics.productivity.tasksByStatus.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="card-soft">
            <CardHeader>
              <CardTitle>Distribuição por Prioridade</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.productivity.tasksByPriority}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="space-y-6">
          {goalsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Carregando metas...</p>
            </div>
          ) : goals.length === 0 ? (
            <div className="text-center py-8">
              <Target className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">Nenhuma meta encontrada</h3>
              <p className="text-muted-foreground">Crie sua primeira meta para começar</p>
              <Button 
                className="mt-4"
                onClick={() => setIsGoalModalOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Nova Meta
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {goals.map(goal => {
                const progress = goal.target_value > 0 
                  ? Math.min((goal.current_value / goal.target_value) * 100, 100)
                  : 0;
                
                return (
                  <Card key={goal.id} className="card-soft cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setSelectedGoal(goal)}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{goal.title}</CardTitle>
                        <Badge variant={goal.priority === 'high' ? 'destructive' : 
                                     goal.priority === 'medium' ? 'default' : 'secondary'}>
                          {goal.priority === 'high' ? 'Alta' :
                           goal.priority === 'medium' ? 'Média' : 'Baixa'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{goal.description}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>Progresso</span>
                            <span>{goal.current_value} / {goal.target_value}</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                          <p className="text-xs text-muted-foreground mt-1">
                            {Math.round(progress)}% concluído
                          </p>
                        </div>
                        
                        {goal.end_date && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="mr-2 h-4 w-4" />
                            <span>
                              Prazo: {format(new Date(goal.end_date), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal de Meta */}
      <GoalFormModal
        isOpen={isGoalModalOpen || !!selectedGoal}
        onClose={() => {
          setIsGoalModalOpen(false);
          setSelectedGoal(null);
        }}
        onGoalCreated={handleGoalCreated}
        onGoalUpdated={handleGoalUpdated}
        existingGoal={selectedGoal}
      />
    </div>
  );
}
