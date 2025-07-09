import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { KanbanBoard, KanbanColumnData, KanbanTask } from "@/components/kanban/kanban-board";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarDays, Plus, X, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useProject } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTasks";

export default function ProjectKanban() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { project, columns, loading } = useProject(id);
  const { tasks, updateTask, createTask } = useTasks(id);
  const [kanbanColumns, setKanbanColumns] = useState<KanbanColumnData[]>([]);
  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isNewTask, setIsNewTask] = useState(false);
  const [newTaskColumnId, setNewTaskColumnId] = useState<string>("");
  const [taskFormData, setTaskFormData] = useState({
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high",
    assignedTo: "",
    tags: [] as string[],
    dueDate: undefined as Date | undefined
  });

  // Transform columns and tasks data
  useEffect(() => {
    if (columns && tasks) {
      const transformedColumns: KanbanColumnData[] = columns.map(column => ({
        id: column.id,
        title: column.title,
        color: column.color || '#64748b',
        tasks: tasks
          .filter(task => task.status === column.title)
          .map(task => ({
            id: task.id,
            title: task.title,
            description: task.description || "",
            priority: task.priority as "low" | "medium" | "high",
            assignedTo: (task as any).responsible?.full_name || "",
            tags: task.tags || [],
            dueDate: task.due_date ? new Date(task.due_date) : undefined,
            comments: 0,
            attachments: 0
          }))
      }));
      setKanbanColumns(transformedColumns);
    }
  }, [columns, tasks]);

  const handleTaskMove = async (taskId: string, fromColumnId: string, toColumnId: string) => {
    try {
      // Find the target column to get its title (which represents the status)
      const toColumn = columns.find(col => col.id === toColumnId);
      if (!toColumn) return;

      // Update task status using the useTasks hook
      const { error } = await updateTask(taskId, { status: toColumn.title });
      
      if (error) throw error;

      toast({
        title: "Tarefa movida com sucesso!",
      });
    } catch (error) {
      console.error('Error moving task:', error);
      toast({
        title: "Erro ao mover tarefa",
        description: "Não foi possível mover a tarefa",
        variant: "destructive",
      });
    }
  };

  const handleTaskClick = (task: KanbanTask) => {
    setSelectedTask(task);
    setTaskFormData({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      assignedTo: task.assignedTo || "",
      tags: task.tags || [],
      dueDate: task.dueDate
    });
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async () => {
    try {
      if (isNewTask) {
        // Create new task
        const targetColumn = columns.find(col => col.id === newTaskColumnId);
        if (!targetColumn) return;

        const { error } = await createTask({
          title: taskFormData.title,
          description: taskFormData.description || null,
          priority: taskFormData.priority,
          status: targetColumn.title,
          due_date: taskFormData.dueDate?.toISOString() || null,
          tags: taskFormData.tags,
          project_id: id!,
        });

        if (error) throw error;

        toast({
          title: "Tarefa criada com sucesso!",
        });
      } else if (selectedTask) {
        // Update existing task
        const { error } = await updateTask(selectedTask.id, {
          title: taskFormData.title,
          description: taskFormData.description || null,
          priority: taskFormData.priority,
          due_date: taskFormData.dueDate?.toISOString() || null,
          tags: taskFormData.tags,
        });

        if (error) throw error;

        toast({
          title: "Tarefa atualizada com sucesso!",
        });
      }

      setIsTaskModalOpen(false);
      setSelectedTask(null);
      setIsNewTask(false);
      setNewTaskColumnId("");
      setTaskFormData({
        title: "",
        description: "",
        priority: "medium",
        assignedTo: "",
        tags: [],
        dueDate: undefined
      });
    } catch (error) {
      console.error('Error saving task:', error);
      toast({
        title: "Erro ao salvar tarefa",
        description: "Não foi possível salvar a tarefa",
        variant: "destructive",
      });
    }
  };

  const addTag = (tag: string) => {
    if (tag && !taskFormData.tags.includes(tag)) {
      setTaskFormData({
        ...taskFormData,
        tags: [...taskFormData.tags, tag]
      });
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTaskFormData({
      ...taskFormData,
      tags: taskFormData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleAddTask = (columnId: string) => {
    setNewTaskColumnId(columnId);
    setIsNewTask(true);
    setSelectedTask(null);
    setTaskFormData({
      title: "",
      description: "",
      priority: "medium",
      assignedTo: "",
      tags: [],
      dueDate: undefined
    });
    setIsTaskModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Projeto não encontrado</h2>
        <p className="text-muted-foreground mb-4">
          O projeto que você está procurando não existe ou você não tem permissão para acessá-lo.
        </p>
        <Button onClick={() => navigate('/projects')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Projetos
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/projects')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <p className="text-muted-foreground">
              Gerencie as tarefas do projeto usando o quadro Kanban
            </p>
          </div>
        </div>
      </div>

      <div className="min-h-[600px]">
        <KanbanBoard
          columns={kanbanColumns}
          onTaskMove={handleTaskMove}
          onTaskClick={handleTaskClick}
          onAddTask={handleAddTask}
          onEditColumn={(columnId) => console.log("Edit column:", columnId)}
        />
      </div>

      {/* Task Detail Modal */}
      <Dialog open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isNewTask ? "Nova Tarefa" : "Editar Tarefa"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="task-title">Título</Label>
              <Input
                id="task-title"
                value={taskFormData.title}
                onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
                placeholder="Digite o título da tarefa"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-description">Descrição</Label>
              <Textarea
                id="task-description"
                value={taskFormData.description}
                onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
                placeholder="Descreva a tarefa detalhadamente"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select 
                  value={taskFormData.priority} 
                  onValueChange={(value: any) => setTaskFormData({ ...taskFormData, priority: value })}
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

              <div className="space-y-2">
                <Label htmlFor="assigned-to">Responsável</Label>
                <Input
                  id="assigned-to"
                  value={taskFormData.assignedTo}
                  onChange={(e) => setTaskFormData({ ...taskFormData, assignedTo: e.target.value })}
                  placeholder="Nome do responsável"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Data de vencimento</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {taskFormData.dueDate ? 
                      format(taskFormData.dueDate, "dd/MM/yyyy", { locale: ptBR }) : 
                      "Selecionar data"
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={taskFormData.dueDate}
                    onSelect={(date) => setTaskFormData({ ...taskFormData, dueDate: date })}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Etiquetas</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {taskFormData.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Adicionar etiqueta"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addTag(e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                    addTag(input.value);
                    input.value = '';
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsTaskModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveTask} className="btn-gradient">
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
