import { useState } from "react";
import { KanbanColumn } from "./kanban-column";
import { TaskCard } from "./task-card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export interface KanbanTask {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  assignedTo?: string;
  tags?: string[];
  dueDate?: Date;
  comments?: number;
  attachments?: number;
}

export interface KanbanColumnData {
  id: string;
  title: string;
  color: string;
  tasks: KanbanTask[];
}

interface KanbanBoardProps {
  columns: KanbanColumnData[];
  onTaskMove?: (taskId: string, fromColumnId: string, toColumnId: string) => void;
  onTaskClick?: (task: KanbanTask) => void;
  onAddTask?: (columnId: string) => void;
  onEditColumn?: (columnId: string) => void;
}

export function KanbanBoard({ 
  columns, 
  onTaskMove, 
  onTaskClick, 
  onAddTask, 
  onEditColumn 
}: KanbanBoardProps) {
  const [draggedTask, setDraggedTask] = useState<{ task: KanbanTask; columnId: string } | null>(null);

  const handleDragStart = (task: KanbanTask, columnId: string) => {
    setDraggedTask({ task, columnId });
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
  };

  const handleDrop = (targetColumnId: string) => {
    if (draggedTask && draggedTask.columnId !== targetColumnId) {
      onTaskMove?.(draggedTask.task.id, draggedTask.columnId, targetColumnId);
    }
    setDraggedTask(null);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Kanban Board</h1>
        <Button className="btn-gradient">
          <Plus className="w-4 h-4 mr-2" />
          Nova Tarefa
        </Button>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-4">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            onDrop={handleDrop}
            onEditColumn={() => onEditColumn?.(column.id)}
            onAddTask={() => onAddTask?.(column.id)}
          >
            {column.tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={() => onTaskClick?.(task)}
                onDragStart={() => handleDragStart(task, column.id)}
                onDragEnd={handleDragEnd}
                isDragging={draggedTask?.task.id === task.id}
              />
            ))}
          </KanbanColumn>
        ))}
      </div>
    </div>
  );
}