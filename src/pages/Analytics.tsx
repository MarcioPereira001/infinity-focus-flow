import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Calendar, Clock, CheckCircle, XCircle, BarChart2, PieChart as PieChartIcon, TrendingUp, Target } from "lucide-react";

// Dados simulados para demonstração
const DUMMY_DATA = {
  weeklyTasks: [
    { name: 'Seg', completed: 4, pending: 2 },
    { name: 'Ter', completed: 3, pending: 1 },
    { name: 'Qua', completed: 5, pending: 3 },
    { name: 'Qui', completed: 2, pending: 4 },
    { name: 'Sex', completed: 6, pending: 1 },
    { name: 'Sáb', completed: 3, pending: 0 },
    { name: 'Dom', completed: 1, pending: 1 },
  ],
  monthlyTasks: [
    { name: 'Semana 1', completed: 15, pending: 5 },
    { name: 'Semana 2', completed: 12, pending: 8 },
    { name: 'Semana 3', completed: 18, pending: 3 },
    { name: 'Semana 4', completed: 10, pending: 7 },
  ],
  yearlyTasks: [
    { name: 'Jan', completed: 45, pending: 15 },
    { name: 'Fev', completed: 38, pending: 12 },
    { name: 'Mar', completed: 52, pending: 18 },
    { name: 'Abr', completed: 40, pending: 10 },
    { name: 'Mai', completed: 55, pending: 20 },
    { name: 'Jun', completed: 48, pending: 15 },
    { name: 'Jul', completed: 60, pending: 12 },
    { name: 'Ago', completed: 45, pending: 18 },
    { name: 'Set', completed: 50, pending: 15 },
    { name: 'Out', completed: 55, pending: 10 },
    { name: 'Nov', completed: 48, pending: 12 },
    { name: 'Dez', completed: 52, pending: 15 },
  ],
  tasksByPriority: [
    { name: 'Alta', value: 12, color: '#ef4444' },
    { name: 'Média', value: 25, color: '#f59e0b' },
    { name: 'Baixa', value: 18, color: '#3b82f6' },
  ],
  tasksByStatus: [
    { name: 'Concluídas', value: 45, color: '#22c55e' },
    { name: 'Pendentes', value: 30, color: '#f59e0b' },
    { name: 'Atrasadas', value: 10, color: '#ef4444' },
  ],
  productivityByHour: [
    { hour: '08:00', tasks: 2 },
    { hour: '09:00', tasks: 3 },
    { hour: '10:00', tasks: 5 },
    { hour: '11:00', tasks: 4 },
    { hour: '12:00', tasks: 1 },
    { hour: '13:00', tasks: 2 },
    { hour: '14:00', tasks: 6 },
    { hour: '15:00', tasks: 4 },
    { hour: '16:00', tasks: 3 },
    { hour: '17:00', tasks: 2 },
    { hour: '18:00', tasks: 1 },
    { hour: '19:00', tasks: 0 },
  ],
};

export default function Analytics() {
  const { user } = useAuth();
  const [selectedProject, setSelectedProject] = useState("all");
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  
  // Dados para os gráficos
  const [chartData, setChartData] = useState({
    tasksOverTime: [] as any[],
    tasksByPriority: [] as any[],
    tasksByStatus: [] as any[],
    productivityByHour: [] as any[],
  });
  
  // Estatísticas gerais
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    completionRate: 0,
    averageTasksPerDay: 0,
    streak: 0,
  });
  
  // Fetch user's projects
  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        setProjects(data || []);
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
    
    fetchProjects();
  }, [user]);
  
  // Fetch analytics data
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      if (!user) return;
      
      setLoading(true);
      
      try {
        // Aqui seria uma chamada ao Supabase para buscar os dados reais
        // Por enquanto, vamos usar dados simulados
        
        // Simular carregamento
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Determinar quais dados usar com base no período selecionado
        let tasksOverTime;
        switch (selectedPeriod) {
          case 'week':
            tasksOverTime = DUMMY_DATA.weeklyTasks;
            break;
          case 'month':
            tasksOverTime = DUMMY_DATA.monthlyTasks;
            break;
          case 'year':
            tasksOverTime = DUMMY_DATA.yearlyTasks;
            break;
          default:
            tasksOverTime = DUMMY_DATA.monthlyTasks;
        }
        
        // Atualizar os dados dos gráficos
        setChartData({
          tasksOverTime,
          tasksByPriority: DUMMY_DATA.tasksByPriority,
          tasksByStatus: DUMMY_DATA.tasksByStatus,
          productivityByHour: DUMMY_DATA.productivityByHour,
        });
        
        // Calcular estatísticas
        const totalTasks = tasksOverTime.reduce((sum, day) => sum + day.completed + day.pending, 0);
        const completedTasks = tasksOverTime.reduce((sum, day) => sum + day.completed, 0);
        const pendingTasks = tasksOverTime.reduce((sum, day) => sum + day.pending, 0);
        const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        const averageTasksPerDay = totalTasks / tasksOverTime.length;
        
        setStats({
          totalTasks,
          completedTasks,
          pendingTasks,
          completionRate,
          averageTasksPerDay,
          streak: 7, // Valor simulado
        });
        
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar os dados de análise",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalyticsData();
  }, [user, selectedProject, selectedPeriod]);
  
  // Renderizar gráfico de tarefas ao longo do tempo
  const renderTasksOverTimeChart = () => {
    try {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData.tasksOverTime} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="completed" name="Concluídas" stackId="a" fill="#22c55e" />
            <Bar dataKey="pending" name="Pendentes" stackId="a" fill="#f59e0b" />
          </BarChart>
        </ResponsiveContainer>
      );
    } catch (error) {
      console.error('Error rendering chart:', error);
      return (
        <div className="flex items-center justify-center h-[300px] bg-muted/20 rounded-md">
          <p className="text-muted-foreground">Erro ao renderizar gráfico</p>
        </div>
      );
    }
  };
  
  // Renderizar gráfico de tarefas por prioridade
  const renderTasksByPriorityChart = () => {
    try {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData.tasksByPriority}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {chartData.tasksByPriority.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      );
    } catch (error) {
      console.error('Error rendering chart:', error);
      return (
        <div className="flex items-center justify-center h-[300px] bg-muted/20 rounded-md">
          <p className="text-muted-foreground">Erro ao renderizar gráfico</p>
        </div>
      );
    }
  };
  
  // Renderizar gráfico de tarefas por status
  const renderTasksByStatusChart = () => {
    try {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData.tasksByStatus}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {chartData.tasksByStatus.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      );
    } catch (error) {
      console.error('Error rendering chart:', error);
      return (
        <div className="flex items-center justify-center h-[300px] bg-muted/20 rounded-md">
          <p className="text-muted-foreground">Erro ao renderizar gráfico</p>
        </div>
      );
    }
  };
  
  // Renderizar gráfico de produtividade por hora
  const renderProductivityByHourChart = () => {
    try {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData.productivityByHour} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="tasks" name="Tarefas" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      );
    } catch (error) {
      console.error('Error rendering chart:', error);
      return (
        <div className="flex items-center justify-center h-[300px] bg-muted/20 rounded-md">
          <p className="text-muted-foreground">Erro ao renderizar gráfico</p>
        </div>
      );
    }
  };
  
  if (loading && projects.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">
          Acompanhe seu progresso e produtividade
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Selecione um projeto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os projetos</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Selecione um período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Esta semana</SelectItem>
                <SelectItem value="month">Este mês</SelectItem>
                <SelectItem value="year">Este ano</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button variant="outline" size="sm">
          <Calendar className="h-4 w-4 mr-2" />
          Exportar relatório
        </Button>
      </div>
      
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Visão geral</TabsTrigger>
          <TabsTrigger value="tasks">Tarefas</TabsTrigger>
          <TabsTrigger value="productivity">Produtividade</TabsTrigger>
          <TabsTrigger value="goals">Metas e objetivos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {/* Cards de estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="card-soft">
              <CardHeader className="pb-2">
                <div className="flex items-center space-x-2">
                  <BarChart2 className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">Total de tarefas</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalTasks}</div>
                <p className="text-sm text-muted-foreground">
                  {selectedPeriod === 'week' ? 'Nesta semana' : selectedPeriod === 'month' ? 'Neste mês' : 'Neste ano'}
                </p>
              </CardContent>
            </Card>
            
            <Card className="card-soft">
              <CardHeader className="pb-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <CardTitle className="text-base">Taxa de conclusão</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.completionRate.toFixed(0)}%</div>
                <div className="mt-2">
                  <Progress value={stats.completionRate} className="h-2" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="card-soft">
              <CardHeader className="pb-2">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-warning" />
                  <CardTitle className="text-base">Média diária</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.averageTasksPerDay.toFixed(1)}</div>
                <p className="text-sm text-muted-foreground">
                  Tarefas por dia
                </p>
              </CardContent>
            </Card>
            
            <Card className="card-soft">
              <CardHeader className="pb-2">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">Streak atual</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.streak}</div>
                <p className="text-sm text-muted-foreground">
                  Dias consecutivos
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Gráfico principal */}
          <Card className="card-soft">
            <CardHeader>
              <CardTitle>Tarefas ao longo do tempo</CardTitle>
              <CardDescription>
                Distribuição de tarefas concluídas e pendentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderTasksOverTimeChart()}
            </CardContent>
          </Card>
          
          {/* Gráficos secundários */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="card-soft">
              <CardHeader>
                <CardTitle>Tarefas por prioridade</CardTitle>
                <CardDescription>
                  Distribuição de tarefas por nível de prioridade
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderTasksByPriorityChart()}
              </CardContent>
            </Card>
            
            <Card className="card-soft">
              <CardHeader>
                <CardTitle>Tarefas por status</CardTitle>
                <CardDescription>
                  Distribuição de tarefas por status atual
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderTasksByStatusChart()}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="tasks" className="space-y-6">
          <Card className="card-soft">
            <CardHeader>
              <CardTitle>Análise de tarefas</CardTitle>
              <CardDescription>
                Informações detalhadas sobre suas tarefas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Tarefas concluídas</h4>
                    <div className="text-3xl font-bold">{stats.completedTasks}</div>
                    <Badge variant="outline" className="bg-success/10 text-success">
                      {((stats.completedTasks / stats.totalTasks) * 100).toFixed(0)}% do total
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Tarefas pendentes</h4>
                    <div className="text-3xl font-bold">{stats.pendingTasks}</div>
                    <Badge variant="outline" className="bg-warning/10 text-warning">
                      {((stats.pendingTasks / stats.totalTasks) * 100).toFixed(0)}% do total
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Tempo médio de conclusão</h4>
                    <div className="text-3xl font-bold">2.3 dias</div>
                    <Badge variant="outline" className="bg-primary/10 text-primary">
                      Por tarefa
                    </Badge>
                  </div>
                </div>
                
                <div className="pt-4">
                  {renderTasksOverTimeChart()}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="productivity" className="space-y-6">
          <Card className="card-soft">
            <CardHeader>
              <CardTitle>Produtividade por hora do dia</CardTitle>
              <CardDescription>
                Número de tarefas concluídas por hora do dia
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderProductivityByHourChart()}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="goals" className="space-y-6">
          <Card className="card-soft">
            <CardHeader>
              <CardTitle>Metas e objetivos</CardTitle>
              <CardDescription>
                Acompanhe seu progresso em direção às suas metas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <Button variant="outline" size="sm">
                    <Target className="h-4 w-4 mr-2" />
                    Nova meta
                  </Button>
                  <Select defaultValue="active">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as metas</SelectItem>
                      <SelectItem value="active">Metas ativas</SelectItem>
                      <SelectItem value="completed">Metas concluídas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-4">
                  <Card className="border-primary/30">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between">
                        <CardTitle>Concluir projeto X</CardTitle>
                        <Badge>Em progresso</Badge>
                      </div>
                      <CardDescription>
                        Prazo: 15/08/2025
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progresso</span>
                          <span>75%</span>
                        </div>
                        <Progress value={75} className="h-2" />
                        <p className="text-sm text-muted-foreground">
                          15 de 20 tarefas concluídas
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
