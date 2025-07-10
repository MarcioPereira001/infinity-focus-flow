import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTasks } from "@/hooks/useTasks";
import { useGamification } from "@/hooks/useGamification";
import { useTrialStatus } from "@/hooks/useTrialStatus";
import { TaskFilters, TimeFilter, TaskTab } from "@/components/dashboard/task-filters";
import { TaskItem } from "@/components/dashboard/task-item";
import { CheckoutModal } from "@/components/modal/checkout-modal";
import { TrialBanner } from "@/components/dashboard/trial-banner";
import { TaskFormModal } from "@/components/modal/task-form-modal";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { user, profile } = useAuth();
  const { tasks, loading, createTask, updateTask, deleteTask } = useTasks();
  const { userStats, achievements, badges } = useGamification();
  const { daysRemaining, showModal, isTrialExpired, isTrialExpiring } = useTrialStatus();
  const [activeTab, setActiveTab] = useState<TaskTab>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('daily');
  const [dateRange, setDateRange] = useState<{ from: Date; to?: Date } | undefined>(undefined);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);

  const handleTabChange = (tab: TaskTab) => {
    setActiveTab(tab);
  };

  const handleTimeFilterChange = (filter: TimeFilter) => {
    setTimeFilter(filter);
    if (filter !== 'custom') {
      setDateRange(undefined);
    }
  };

  const handleDateRangeChange = (range: { from: Date; to?: Date }) => {
    setDateRange(range);
  };

  const handleCreateTask = async (taskData: any) => {
    await createTask(taskData);
    setIsTaskModalOpen(false);
  };

  const handleUpdateTask = async (taskId: string, taskData: any) => {
    await updateTask(taskId, taskData);
    setIsTaskModalOpen(false);
    setEditingTask(null);
  };

  const handleDeleteTask = async (taskId: string) => {
    await deleteTask(taskId);
  };

  const handleEditTask = (task: any) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Modal de Trial */}
      <CheckoutModal 
        isOpen={showModal} 
        daysRemaining={daysRemaining}
      />

      {/* Banner de Trial */}
      {(isTrialExpiring || isTrialExpired) && profile?.plan_status === 'trial' && (
        <TrialBanner 
          daysRemaining={daysRemaining}
          isExpired={isTrialExpired}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Bem-vindo de volta, {profile?.full_name || user.email}! 
            {profile?.plan_status === 'trial' && !isTrialExpired && (
              <span className="ml-2 text-primary font-medium">
                Trial ativo ({daysRemaining} dias restantes)
              </span>
            )}
          </p>
        </div>
        
        <Button onClick={() => setIsTaskModalOpen(true)} className="btn-gradient">
          <Plus className="h-4 w-4 mr-2" />
          Nova Tarefa
        </Button>
      </div>

      {/* Gamification Stats */}
      {userStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card-soft">
            <h3 className="text-lg font-semibold">Level</h3>
            <p className="text-2xl font-bold">{userStats.level}</p>
          </div>
          <div className="card-soft">
            <h3 className="text-lg font-semibold">XP</h3>
            <p className="text-2xl font-bold">{userStats.xp}</p>
          </div>
          <div className="card-soft">
            <h3 className="text-lg font-semibold">Tasks Completed</h3>
            <p className="text-2xl font-bold">{userStats.tasks_completed}</p>
          </div>
          <div className="card-soft">
            <h3 className="text-lg font-semibold">Streak</h3>
            <p className="text-2xl font-bold">{userStats.streak}</p>
          </div>
        </div>
      )}

      {/* Task Filters */}
      <TaskFilters
        activeTab={activeTab}
        onTabChange={handleTabChange}
        timeFilter={timeFilter}
        onTimeFilterChange={handleTimeFilterChange}
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
      />

      {/* Task List */}
      {loading ? (
        <p>Loading tasks...</p>
      ) : (
        <div className="space-y-4">
          {tasks?.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onEdit={() => handleEditTask(task)}
              onDelete={handleDeleteTask}
            />
          ))}
        </div>
      )}

      {/* Task Modal */}
      <TaskFormModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        task={editingTask}
        onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
      />
    </div>
  );
}
