import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { KanbanColumnData } from "./kanban-board";

interface KanbanColumnProps {
  column: KanbanColumnData;
  children: React.ReactNode;
  onDrop: (columnId: string) => void;
  onEditColumn?: () => void;
  onAddTask?: () => void;
}

export function KanbanColumn({ 
  column, 
  children, 
  onDrop, 
  onEditColumn, 
  onAddTask 
}: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    onDrop(column.id);
  };

  return (
    <div className="flex-shrink-0 w-80">
      <div className="card-soft h-full">
        {/* Column Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: column.color }}
              />
              <h3 className="font-semibold">{column.title}</h3>
              <Badge variant="secondary" className="text-xs">
                {column.tasks.length}
              </Badge>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={onEditColumn}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            onClick={onAddTask}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar tarefa
          </Button>
        </div>

        {/* Tasks Container */}
        <div
          className={cn(
            "p-4 space-y-3 min-h-[200px] transition-colors",
            isDragOver && "bg-primary/5 border-primary/20"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {children}
          
          {column.tasks.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <p className="text-sm">Nenhuma tarefa</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}