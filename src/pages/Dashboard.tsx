import { useState } from "react";
import { TaskItem, Task } from "@/components/dashboard/task-item";
import { TaskFilters, TimeFilter, TaskTab } from "@/components/dashboard/task-filters";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTasks } from "@/hooks/useTasks";
import { toast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { profile } = useAuth();
  const { tasks, loading, createTask, updateTask, deleteTask } = useTasks();
  
  const [activeTab, setActiveTab] = useState<TaskTab>("all");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("daily");
  const [dateRange, setDateRange] = useState<{ from: Date; to?: Date }>();
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [newTaskData, setNewTaskData] = useState({
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high",
  });

  const handleToggleComplete = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const newStatus = task.status === 'Concluído' ? 'Novo' : 'Concluído';
      
      const { error } = await updateTask(taskId, { status: newStatus });
      
      if (error) {
        toast({
          title: "Erro ao atualizar tarefa",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Tarefa atualizada com sucesso!",
        });
      }
    } catch (error) {
      console.error('Error toggling task completion:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao atualizar a tarefa",
        variant: "destructive",
      });
    }
  };

  const handleEditTask = (taskId: string) => {
    console.log("Edit task:", taskId);
    // Will be implemented with task modal
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await deleteTask(taskId);
      
      if (error) {
        toast({
          title: "Erro ao deletar tarefa",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Tarefa deletada com sucesso!",
        });
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao deletar a tarefa",
        variant: "destructive",
      });
    }
  };

  const handleCreateTask = async () => {
    if (!newTaskData.title.trim()) {
      toast({
        title: "Título obrigatório",
        description: "Por favor, digite um título para a tarefa",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await createTask({
        title: newTaskData.title.trim(),
        description: newTaskData.description.trim() || null,
        priority: newTaskData.priority,
        status: 'Novo',
        project_id: null, // Personal task
      });

      if (error) {
        toast({
          title: "Erro ao criar tarefa",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Tarefa criada com sucesso!",
        });
        setIsNewTaskModalOpen(false);
        setNewTaskData({ title: "", description: "", priority: "medium" });
      }
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao criar a tarefa",
        variant: "destructive",
      });
    }
  };

  // Transform Supabase tasks to component tasks with safe data handling
  const transformedTasks: Task[] = tasks.map(task => {
    try {
      return {
        id: task.id,
        title: task.title || 'Tarefa sem título',
        description: task.description || undefined,
        completed: task.status === 'Concluído',
        priority: (task.priority as "low" | "medium" | "high") || 'medium',
        dueDate: task.due_date ? new Date(task.due_date) : undefined,
        projectName: (task as any).project?.name || undefined,
        tags: task.tags || [],
      };
    } catch (error) {
      console.error('Error transforming task:', task, error);
      // Return a safe fallback task
      return {
        id: task.id || 'unknown',
        title: 'Erro ao carregar tarefa',
        description: undefined,
        completed: false,
        priority: 'medium' as const,
        dueDate: undefined,
        projectName: undefined,
        tags: [],
      };
    }
  });

  const filteredTasks = transformedTasks.filter(task => {
    try {
      switch (activeTab) {
        case "personal":
          return !task.projectName;
        case "shared":
          return !!task.projectName;
        default:
          return true;
      }
    } catch (error) {
      console.error('Error filtering task:', task, error);
      return false;
    }
  });

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
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Gerencie suas tarefas e acompanhe seu progresso
          </p>
        </div>
        
        <Button className="btn-gradient" onClick={() => setIsNewTaskModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Tarefa
        </Button>
      </div>

      <TaskFilters
        activeTab={activeTab}
        onTabChange={setActiveTab}
        timeFilter={timeFilter}
        onTimeFilterChange={setTimeFilter}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
      />

      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              Nenhuma tarefa encontrada
            </p>
            <Button className="btn-gradient" onClick={() => setIsNewTaskModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar primeira tarefa
            </Button>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggleComplete={handleToggleComplete}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
            />
          ))
        )}
      </div>

      {/* New Task Modal */}
      <Dialog open={isNewTaskModalOpen} onOpenChange={setIsNewTaskModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Tarefa</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">Título</Label>
              <Input
                id="task-title"
                value={newTaskData.title}
                onChange={(e) => setNewTaskData({ ...newTaskData, title: e.target.value })}
                placeholder="Digite o título da tarefa"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-description">Descrição</Label>
              <Textarea
                id="task-description"
                value={newTaskData.description}
                onChange={(e) => setNewTaskData({ ...newTaskData, description: e.target.value })}
                placeholder="Descreva a tarefa (opcional)"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select 
                value={newTaskData.priority} 
                onValueChange={(value: any) => setNewTaskData({ ...newTaskData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setIsNewTaskModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button onClick={handleCreateTask} className="btn-gradient">
                Criar Tarefa
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
