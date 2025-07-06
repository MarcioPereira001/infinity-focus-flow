import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Target, CheckCircle, Clock, Trophy, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Analytics() {
  const navigate = useNavigate();
  const [selectedProject, setSelectedProject] = useState("all");
  const [selectedPeriod, setSelectedPeriod] = useState("month");

  const handleLogout = () => {
    navigate("/");
  };

  // Mock data - will be replaced with real data from Supabase
  const stats = {
    tasksCompleted: 47,
    totalTasks: 63,
    productivityScore: 85,
    weeklyGoal: 50,
    completedThisWeek: 12,
    streak: 7
  };

  const goals = [
    {
      id: "1",
      title: "Completar 50 tarefas este mês",
      progress: 75,
      current: 37,
      target: 50,
      icon: Target
    },
    {
      id: "2", 
      title: "Manter streak de 10 dias",
      progress: 70,
      current: 7,
      target: 10,
      icon: Zap
    },
    {
      id: "3",
      title: "Finalizar 3 projetos importantes",
      progress: 33,
      current: 1,
      target: 3,
      icon: Trophy
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header isLoggedIn onLogout={handleLogout} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Analytics</h1>
              <p className="text-muted-foreground">
                Acompanhe sua evolução e conquistas
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filtrar por projeto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os projetos</SelectItem>
                <SelectItem value="project1">Projeto Alpha</SelectItem>
                <SelectItem value="project2">App Mobile</SelectItem>
                <SelectItem value="personal">Tarefas Pessoais</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Esta semana</SelectItem>
                <SelectItem value="month">Este mês</SelectItem>
                <SelectItem value="quarter">Este trimestre</SelectItem>
                <SelectItem value="year">Este ano</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="goals">Metas e Objetivos</TabsTrigger>
              <TabsTrigger value="gamification">Gamificação</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Overview Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="card-soft">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Tarefas Concluídas
                    </CardTitle>
                    <CheckCircle className="h-4 w-4 text-success" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.tasksCompleted}</div>
                    <p className="text-xs text-muted-foreground">
                      de {stats.totalTasks} tarefas totais
                    </p>
                  </CardContent>
                </Card>

                <Card className="card-soft">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Score de Produtividade
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.productivityScore}%</div>
                    <p className="text-xs text-muted-foreground">
                      +12% vs mês anterior
                    </p>
                  </CardContent>
                </Card>

                <Card className="card-soft">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Meta Semanal
                    </CardTitle>
                    <Target className="h-4 w-4 text-warning" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.completedThisWeek}/{stats.weeklyGoal}</div>
                    <p className="text-xs text-muted-foreground">
                      Tarefas esta semana
                    </p>
                  </CardContent>
                </Card>

                <Card className="card-soft">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Streak Atual
                    </CardTitle>
                    <Clock className="h-4 w-4 text-secondary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.streak} dias</div>
                    <p className="text-xs text-muted-foreground">
                      Sequência de produtividade
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Progress Chart Placeholder */}
              <Card className="card-soft">
                <CardHeader>
                  <CardTitle>Progresso ao Longo do Tempo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Gráfico de evolução será exibido aqui</p>
                      <p className="text-sm">Dados serão carregados via Supabase</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="goals" className="space-y-6">
              <div className="grid gap-6">
                {goals.map((goal) => (
                  <Card key={goal.id} className="card-soft">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <goal.icon className="h-5 w-5 text-primary" />
                          </div>
                          <CardTitle className="text-lg">{goal.title}</CardTitle>
                        </div>
                        <Badge variant="outline">
                          {goal.current}/{goal.target}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progresso</span>
                          <span>{goal.progress}%</span>
                        </div>
                        <Progress value={goal.progress} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="gamification" className="space-y-6">
              <div className="text-center py-12">
                <Trophy className="h-16 w-16 mx-auto mb-4 text-primary opacity-50" />
                <h3 className="text-xl font-semibold mb-2">Sistema de Gamificação</h3>
                <p className="text-muted-foreground">
                  Conquistas, badges e rankings serão implementados aqui
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}