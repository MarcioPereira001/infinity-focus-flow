import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, MessageCircle, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import type { KanbanTask } from "./kanban-board";

interface TaskCardProps {
  task: KanbanTask;
  onClick?: () => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
}

export function TaskCard({ 
  task, 
  onClick, 
  onDragStart, 
  onDragEnd, 
  isDragging 
}: TaskCardProps) {
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

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    onDragStart?.();
  };

  return (
    <div
      className={cn(
        "card-hover cursor-pointer select-none",
        isDragging && "opacity-50 rotate-2 scale-105"
      )}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
    >
      <div className="p-4 space-y-3">
        {/* Priority and Tags */}
        <div className="flex items-center justify-between">
          <Badge variant={getPriorityColor(task.priority) as any} className="text-xs">
            {task.priority === 'high' ? 'Alta' : 
             task.priority === 'medium' ? 'Média' : 'Baixa'}
          </Badge>
          
          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {task.tags.slice(0, 2).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {task.tags.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{task.tags.length - 2}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Title and Description */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm leading-tight">{task.title}</h4>
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 text-xs text-muted-foreground">
            {task.dueDate && (
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>{task.dueDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
              </div>
            )}
            
            {task.comments && task.comments > 0 && (
              <div className="flex items-center space-x-1">
                <MessageCircle className="h-3 w-3" />
                <span>{task.comments}</span>
              </div>
            )}
            
            {task.attachments && task.attachments > 0 && (
              <div className="flex items-center space-x-1">
                <Paperclip className="h-3 w-3" />
                <span>{task.attachments}</span>
              </div>
            )}
          </div>

          {task.assignedTo && (
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                {task.assignedTo.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>
    </div>
  );
}