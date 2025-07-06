import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/header";
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
import { CalendarDays, Plus, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Mock data - will be replaced with real data from Supabase
const mockColumns: KanbanColumnData[] = [
  {
    id: "new",
    title: "Novo",
    color: "#64748b",
    tasks: [
      {
        id: "task-1",
        title: "Implementar autenticação",
        description: "Configurar sistema de login e registro",
        priority: "high",
        assignedTo: "João",
        tags: ["backend", "auth"],
        dueDate: new Date("2024-01-20"),
        comments: 3,
        attachments: 1
      }
    ]
  },
  {
    id: "in-progress",
    title: "Em Andamento", 
    color: "#f59e0b",
    tasks: [
      {
        id: "task-2",
        title: "Design do dashboard",
        description: "Criar interface do painel principal",
        priority: "medium",
        assignedTo: "Maria",
        tags: ["frontend", "ui"],
        dueDate: new Date("2024-01-15"),
        comments: 5,
        attachments: 2
      }
    ]
  },
  {
    id: "review",
    title: "Aguardando Aprovação",
    color: "#8b5cf6", 
    tasks: []
  },
  {
    id: "done",
    title: "Concluído",
    color: "#10b981",
    tasks: [
      {
        id: "task-3",
        title: "Setup inicial do projeto",
        description: "Configuração do ambiente de desenvolvimento",
        priority: "low",
        assignedTo: "Pedro",
        tags: ["setup"],
        comments: 1
      }
    ]
  }
];

export default function ProjectKanban() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [columns, setColumns] = useState<KanbanColumnData[]>(mockColumns);
  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskFormData, setTaskFormData] = useState({
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high",
    assignedTo: "",
    tags: [] as string[],
    dueDate: undefined as Date | undefined
  });

  const handleLogout = () => {
    navigate("/");
  };

  const handleTaskMove = (taskId: string, fromColumnId: string, toColumnId: string) => {
    setColumns(prevColumns => {
      const newColumns = [...prevColumns];
      
      // Find and remove task from source column
      const fromColumn = newColumns.find(col => col.id === fromColumnId);
      const toColumn = newColumns.find(col => col.id === toColumnId);
      
      if (fromColumn && toColumn) {
        const taskIndex = fromColumn.tasks.findIndex(task => task.id === taskId);
        if (taskIndex !== -1) {
          const [task] = fromColumn.tasks.splice(taskIndex, 1);
          toColumn.tasks.push(task);
        }
      }
      
      return newColumns;
    });
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

  const handleSaveTask = () => {
    if (selectedTask) {
      // Update existing task
      setColumns(prevColumns => 
        prevColumns.map(column => ({
          ...column,
          tasks: column.tasks.map(task => 
            task.id === selectedTask.id 
              ? { ...task, ...taskFormData }
              : task
          )
        }))
      );
    }
    setIsTaskModalOpen(false);
    setSelectedTask(null);
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

  return (
    <div className="min-h-screen bg-background">
      <Header isLoggedIn onLogout={handleLogout} />
      
      <main className="min-h-screen">
        <KanbanBoard
          columns={columns}
          onTaskMove={handleTaskMove}
          onTaskClick={handleTaskClick}
          onAddTask={(columnId) => console.log("Add task to column:", columnId)}
          onEditColumn={(columnId) => console.log("Edit column:", columnId)}
        />
      </main>

      {/* Task Detail Modal */}
      <Dialog open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTask ? "Editar Tarefa" : "Nova Tarefa"}
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