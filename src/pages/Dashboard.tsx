import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskItem } from "@/components/dashboard/task-item";
import { TaskFormModal } from "@/components/modal/task-form-modal";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Calendar, CheckCircle2, Clock } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Dashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  
  // Buscar tarefas
  useEffect(() => {
    if (!user) return;
    
    const fetchTasks = async () => {
      setIsLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select(`
            *,
            projects:project_id (name),
            goals:goal_id (title)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        setTasks(data || []);
      } catch (error) {
        console.error('Error fetching tasks:', error);
        toast({
          title: "Erro ao carregar tarefas",
          description: "Não foi possível carregar suas tarefas",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTasks();
    
    // Configurar subscription para atualizações em tempo real
    const tasksSubscription = supabase
      .channel('tasks-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setTasks(prev => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setTasks(prev => prev.map(task => 
            task.id === payload.new.id ? { ...task, ...payload.new } : task
          ));
        } else if (payload.eventType === 'DELETE') {
          setTasks(prev => prev.filter(task => task.id !== payload.old.id));
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(tasksSubscription);
    };
  }, [user]);
  
  // Filtrar tarefas com base na aba ativa
  const filteredTasks = tasks.filter(task => {
    if (activeTab === 'all') return true;
    if (activeTab === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const taskDate = task.due_date ? new Date(task.due_date) : null;
      if (taskDate) {
        taskDate.setHours(0, 0, 0, 0);
        return taskDate.getTime() === today.getTime();
      }
      return false;
    }
    if (activeTab === 'upcoming') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const taskDate = task.due_date ? new Date(task.due_date) : null;
      if (taskDate) {
        taskDate.setHours(0, 0, 0, 0);
        return taskDate.getTime() > today.getTime();
      }
      return false;
    }
    if (activeTab === 'completed') {
      return task.status === 'completed';
    }
    return true;
  });
  
  // Manipular criação de tarefa
  const handleTaskCreated = (newTask: any) => {
    // A atualização é feita automaticamente pela subscription
    toast({
      title: "Tarefa criada",
      description: "Sua tarefa foi criada com sucesso",
    });
  };
  
  // Manipular atualização de tarefa
  const handleTaskUpdated = (updatedTask: any) => {
    // A atualização é feita automaticamente pela subscription
    toast({
      title: "Tarefa atualizada",
      description: "Sua tarefa foi atualizada com sucesso",
    });
  };
  
  // Manipular clique em tarefa para edição
  const handleTaskClick = (task: any) => {
    setSelectedTask(task);
  };
  
  // Manipular fechamento do modal de edição
  const handleEditModalClose = () => {
    setSelectedTask(null);
  };
  
  // Renderizar estatísticas
  const renderStats = () => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const pendingTasks = tasks.filter(task => task.status === 'pending').length;
    const inProgressTasks = tasks.filter(task => task.status === 'in_progress').length;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Tarefas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Concluídas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedTasks}</div>
            <div className="text-xs text-muted-foreground">
              {totalTasks > 0 ? `${Math.round((completedTasks / totalTasks) * 100)}%` : '0%'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{pendingTasks + inProgressTasks}</div>
            <div className="text-xs text-muted-foreground">
              {inProgressTasks} em progresso
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };
  
  // Renderizar tarefas para hoje
  const renderTodayTasks = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayTasks = tasks.filter(task => {
      const taskDate = task.due_date ? new Date(task.due_date) : null;
      if (taskDate) {
        taskDate.setHours(0, 0, 0, 0);
        return taskDate.getTime() === today.getTime();
      }
      return false;
    });
    
    if (todayTasks.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tarefas para Hoje</CardTitle>
            <CardDescription>
              {format(today, "EEEE, d 'de' MMMM", { locale: ptBR })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6 text-muted-foreground">
              Nenhuma tarefa para hoje
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setIsNewTaskModalOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Adicionar tarefa para hoje
            </Button>
          </CardFooter>
        </Card>
      );
    }
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tarefas para Hoje</CardTitle>
          <CardDescription>
            {format(today, "EEEE, d 'de' MMMM", { locale: ptBR })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {todayTasks.map(task => (
              <TaskItem 
                key={task.id} 
                task={task} 
                onClick={() => handleTaskClick(task)}
              />
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setIsNewTaskModalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar tarefa para hoje
          </Button>
        </CardFooter>
      </Card>
    );
  };
  
  return (
    <AppLayout>
      <div className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Button onClick={() => setIsNewTaskModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Tarefa
          </Button>
        </div>
        
        {renderStats()}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">Todas</TabsTrigger>
                <TabsTrigger value="today">Hoje</TabsTrigger>
                <TabsTrigger value="upcoming">Próximas</TabsTrigger>
                <TabsTrigger value="completed">Concluídas</TabsTrigger>
              </TabsList>
              
              <TabsContent value={activeTab} className="space-y-4">
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Carregando tarefas...</p>
                  </div>
                ) : filteredTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Nenhuma tarefa encontrada</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setIsNewTaskModalOpen(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Criar nova tarefa
                    </Button>
                  </div>
                ) : (
                  filteredTasks.map(task => (
                    <TaskItem 
                      key={task.id} 
                      task={task} 
                      onClick={() => handleTaskClick(task)}
                    />
                  ))
                )}
              </TabsContent>
            </Tabs>
          </div>
          
          <div>
            {renderTodayTasks()}
          </div>
        </div>
      </div>
      
      {/* Modal de nova tarefa */}
      <TaskFormModal
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
        onTaskCreated={handleTaskCreated}
      />
      
      {/* Modal de edição de tarefa */}
      <TaskFormModal
        isOpen={!!selectedTask}
        onClose={handleEditModalClose}
        onTaskUpdated={handleTaskUpdated}
        existingTask={selectedTask}
      />
    </AppLayout>
  );
}
