
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  due_date?: string;
  project_id?: string;
  project?: { name: string };
  responsible?: { full_name: string };
  tags?: string[];
}

interface TaskItemProps {
  task: Task;
  onToggleComplete?: (taskId: string) => void;
  onEdit?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onClick?: () => void;
}

export function TaskItem({ task, onToggleComplete, onEdit, onDelete, onClick }: TaskItemProps) {
  const [isCompleted, setIsCompleted] = useState(task.status === 'Concluído');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggleComplete = async (event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (isUpdating) return;
    
    setIsUpdating(true);
    const newStatus = isCompleted ? 'Novo' : 'Concluído';
    
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id);
      
      if (error) throw error;
      
      setIsCompleted(!isCompleted);
      
      if (onToggleComplete) {
        onToggleComplete(task.id);
      }
      
      toast({
        title: newStatus === 'Concluído' ? "Tarefa concluída" : "Tarefa reaberta",
        description: newStatus === 'Concluído' ? 
          "A tarefa foi marcada como concluída" : 
          "A tarefa foi reaberta",
      });
      
    } catch (error: any) {
      console.error('Error updating task:', error);
      toast({
        title: "Erro ao atualizar tarefa",
        description: error.message || "Não foi possível atualizar o status da tarefa",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'priority-high';
      case 'medium':
        return 'priority-medium';
      case 'low':
        return 'priority-low';
      default:
        return '';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'secondary';
    }
  };

  return (
    <div 
      className={cn(
        "card-soft p-4 transition-all duration-200 cursor-pointer hover:shadow-md",
        getPriorityClass(task.priority),
        isCompleted && "opacity-60"
      )}
      onClick={handleCardClick}
    >
      <div className="flex items-start space-x-4">
        <Checkbox
          checked={isCompleted}
          onCheckedChange={handleToggleComplete}
          disabled={isUpdating}
          className="mt-1"
          onClick={(e) => e.stopPropagation()}
        />
        
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between">
            <h3 className={cn(
              "font-medium transition-all",
              isCompleted && "line-through text-muted-foreground"
            )}>
              {task.title}
            </h3>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(task.id);
                }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(task.id);
                  }}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {task.description && (
            <p className="text-sm text-muted-foreground">
              {task.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={getPriorityColor(task.priority) as any} className="text-xs">
              {task.priority === 'high' ? 'Alta' : 
               task.priority === 'medium' ? 'Média' : 'Baixa'}
            </Badge>

            {task.project?.name && (
              <Badge variant="outline" className="text-xs">
                {task.project.name}
              </Badge>
            )}

            {task.due_date && (
              <div className="flex items-center text-xs text-muted-foreground">
                <Calendar className="h-3 w-3 mr-1" />
                {new Date(task.due_date).toLocaleDateString('pt-BR')}
              </div>
            )}

            {task.tags?.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            
            <Badge variant="outline" className="text-xs">
              {task.status}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
