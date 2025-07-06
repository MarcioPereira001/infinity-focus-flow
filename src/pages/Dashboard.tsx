import { useState } from "react";
import { Header } from "@/components/layout/header";
import { TaskItem, Task } from "@/components/dashboard/task-item";
import { TaskFilters, TimeFilter, TaskTab } from "@/components/dashboard/task-filters";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Mock data - will be replaced with real data from Supabase
const mockTasks: Task[] = [
  {
    id: "1",
    title: "Implementar sistema de autenticação",
    description: "Configurar login e registro de usuários",
    completed: false,
    priority: "high",
    dueDate: new Date("2024-01-15"),
    projectName: "App Mobile",
    tags: ["frontend", "auth"]
  },
  {
    id: "2", 
    title: "Revisar documentação do projeto",
    description: "Atualizar README e documentação técnica",
    completed: true,
    priority: "medium",
    dueDate: new Date("2024-01-10"),
    tags: ["docs"]
  },
  {
    id: "3",
    title: "Preparar apresentação para cliente",
    completed: false,
    priority: "high",
    dueDate: new Date("2024-01-20"),
    projectName: "Projeto Alpha",
    tags: ["apresentação", "cliente"]
  }
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [activeTab, setActiveTab] = useState<TaskTab>("all");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("daily");
  const [dateRange, setDateRange] = useState<{ from: Date; to?: Date }>();

  const handleLogout = () => {
    navigate("/");
  };

  const handleToggleComplete = (taskId: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const handleEditTask = (taskId: string) => {
    console.log("Edit task:", taskId);
    // Will be implemented with task modal
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  const filteredTasks = tasks.filter(task => {
    switch (activeTab) {
      case "personal":
        return !task.projectName;
      case "shared":
        return !!task.projectName;
      default:
        return true;
    }
  });

  return (
    <div className="min-h-screen bg-background">
      <Header isLoggedIn onLogout={handleLogout} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground">
                Gerencie suas tarefas e acompanhe seu progresso
              </p>
            </div>
            
            <Button className="btn-gradient">
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
                <Button className="btn-gradient">
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
        </div>
      </main>
    </div>
  );
}