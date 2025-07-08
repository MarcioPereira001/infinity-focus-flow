import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Clock, Bell, Target, Link as LinkIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

// Tipos
interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated?: (task: any) => void;
  onTaskUpdated?: (task: any) => void;
  existingTask?: any;
  projectId?: string;
}

interface Project {
  id: string;
  name: string;
}

interface Goal {
  id: string;
  title: string;
}

export function TaskFormModal({
  isOpen,
  onClose,
  onTaskCreated,
  onTaskUpdated,
  existingTask,
  projectId
}: TaskFormModalProps) {
  const { user } = useAuth();
  const isEditing = !!existingTask;
  
  // Estados do formulário
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [status, setStatus] = useState("pending");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [selectedProject, setSelectedProject] = useState<string | undefined>(projectId);
  const [selectedGoal, setSelectedGoal] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados para opções avançadas
  const [enableReminder, setEnableReminder] = useState(false);
  const [reminderDate, setReminderDate] = useState<Date | undefined>(undefined);
  const [reminderTime, setReminderTime] = useState("09:00");
  const [repeatFrequency, setRepeatFrequency] = useState("none");
  const [customDays, setCustomDays] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState("basic");
  
  // Estados para dados relacionados
  const [projects, setProjects] = useState<Project[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  
  // Carregar dados existentes para edição
  useEffect(() => {
    if (existingTask) {
      setTitle(existingTask.title || "");
      setDescription(existingTask.description || "");
      setPriority(existingTask.priority || "medium");
      setStatus(existingTask.status || "pending");
      
      if (existingTask.due_date) {
        setDueDate(new Date(existingTask.due_date));
      }
      
      if (existingTask.start_date) {
        setStartDate(new Date(existingTask.start_date));
      }
      
      setSelectedProject(existingTask.project_id);
      setSelectedGoal(existingTask.goal_id);
      
      // Configurações de lembrete
      setEnableReminder(!!existingTask.reminder_date);
      if (existingTask.reminder_date) {
        const reminderDateTime = new Date(existingTask.reminder_date);
        setReminderDate(reminderDateTime);
        setReminderTime(
          reminderDateTime.getHours().toString().padStart(2, '0') + 
          ':' + 
          reminderDateTime.getMinutes().toString().padStart(2, '0')
        );
      }
      
      setRepeatFrequency(existingTask.repeat_frequency || "none");
      setCustomDays(existingTask.custom_days || []);
    } else {
      // Valores padrão para nova tarefa
      resetForm();
      
      // Se estiver criando a partir de um projeto, pré-seleciona o projeto
      if (projectId) {
        setSelectedProject(projectId);
      }
    }
  }, [existingTask, projectId]);
  
  // Carregar projetos e metas
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        // Buscar projetos
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('id, name')
          .or(`owner_id.eq.${user.id},project_members(user_id).eq.${user.id}`)
          .order('created_at', { ascending: false });
          
        if (projectsError) throw projectsError;
        setProjects(projectsData || []);
        
        // Buscar metas
        const { data: goalsData, error: goalsError } = await supabase
          .from('goals')
          .select('id, title')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        if (goalsError) throw goalsError;
        setGoals(goalsData || []);
        
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar projetos e metas",
          variant: "destructive",
        });
      }
    };
    
    fetchData();
  }, [user]);
  
  // Resetar formulário
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPriority("medium");
    setStatus("pending");
    setDueDate(undefined);
    setStartDate(undefined);
    setSelectedProject(projectId);
    setSelectedGoal(undefined);
    setEnableReminder(false);
    setReminderDate(undefined);
    setReminderTime("09:00");
    setRepeatFrequency("none");
    setCustomDays([]);
    setActiveTab("basic");
  };
  
  // Validar formulário
  const validateForm = () => {
    if (!title.trim()) {
      toast({
        title: "Título obrigatório",
        description: "Por favor, informe um título para a tarefa",
        variant: "destructive",
      });
      return false;
    }
    
    if (startDate && dueDate && startDate > dueDate) {
      toast({
        title: "Datas inválidas",
        description: "A data de início deve ser anterior à data de término",
        variant: "destructive",
      });
      return false;
    }
    
    if (enableReminder && !reminderDate) {
      toast({
        title: "Data de lembrete obrigatória",
        description: "Por favor, informe uma data para o lembrete",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };
  
  // Salvar tarefa
  const handleSaveTask = async () => {
    if (!validateForm() || !user) return;
    
    setIsLoading(true);
    
    try {
      // Preparar dados da tarefa
      const taskData: any = {
        title,
        description,
        priority,
        status,
        user_id: user.id,
        project_id: selectedProject || null,
        goal_id: selectedGoal || null,
        updated_at: new Date().toISOString(),
      };
      
      // Datas
      if (startDate) {
        taskData.start_date = startDate.toISOString();
      }
      
      if (dueDate) {
        taskData.due_date = dueDate.toISOString();
      }
      
      // Configurações de lembrete
      if (enableReminder && reminderDate) {
        const [hours, minutes] = reminderTime.split(':').map(Number);
        const reminderDateTime = new Date(reminderDate);
        reminderDateTime.setHours(hours, minutes, 0, 0);
        taskData.reminder_date = reminderDateTime.toISOString();
      } else {
        taskData.reminder_date = null;
      }
      
      // Configurações de repetição
      taskData.repeat_frequency = repeatFrequency;
      if (repeatFrequency === 'custom' && customDays.length > 0) {
        taskData.custom_days = customDays;
      } else {
        taskData.custom_days = null;
      }
      
      let result;
      
      if (isEditing) {
        // Atualizar tarefa existente
        const { data, error } = await supabase
          .from('tasks')
          .update(taskData)
          .eq('id', existingTask.id)
          .select()
          .single();
          
        if (error) throw error;
        result = data;
        
        toast({
          title: "Tarefa atualizada",
          description: "A tarefa foi atualizada com sucesso",
        });
        
        if (onTaskUpdated) {
          onTaskUpdated(result);
        }
      } else {
        // Criar nova tarefa
        taskData.created_at = new Date().toISOString();
        
        const { data, error } = await supabase
          .from('tasks')
          .insert(taskData)
          .select()
          .single();
          
        if (error) throw error;
        result = data;
        
        toast({
          title: "Tarefa criada",
          description: "A tarefa foi criada com sucesso",
        });
        
        if (onTaskCreated) {
          onTaskCreated(result);
        }
      }
      
      // Solicitar permissão para notificações se habilitado
      if (enableReminder && "Notification" in window) {
        if (Notification.permission !== "granted") {
          await Notification.requestPermission();
        }
      }
      
      onClose();
      resetForm();
      
    } catch (error: any) {
      console.error('Error saving task:', error);
      toast({
        title: "Erro ao salvar tarefa",
        description: error.message || "Ocorreu um erro ao salvar a tarefa",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Manipular dias personalizados para repetição
  const handleCustomDayToggle = (day: number) => {
    if (customDays.includes(day)) {
      setCustomDays(customDays.filter(d => d !== day));
    } else {
      setCustomDays([...customDays, day]);
    }
  };
  
  // Renderizar seletor de dias da semana
  const renderWeekdaySelector = () => {
    const weekdays = [
      { value: 0, label: "Dom" },
      { value: 1, label: "Seg" },
      { value: 2, label: "Ter" },
      { value: 3, label: "Qua" },
      { value: 4, label: "Qui" },
      { value: 5, label: "Sex" },
      { value: 6, label: "Sáb" },
    ];
    
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {weekdays.map((day) => (
          <Button
            key={day.value}
            type="button"
            variant={customDays.includes(day.value) ? "default" : "outline"}
            size="sm"
            onClick={() => handleCustomDayToggle(day.value)}
            className="w-12"
          >
            {day.label}
          </Button>
        ))}
      </div>
    );
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar tarefa" : "Nova tarefa"}</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="basic">Básico</TabsTrigger>
            <TabsTrigger value="schedule">Agendamento</TabsTrigger>
            <TabsTrigger value="advanced">Avançado</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-4">
            {/* Informações básicas */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Digite o título da tarefa"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva a tarefa em detalhes"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Prioridade</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger id="priority">
                      <SelectValue placeholder="Selecione a prioridade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="in_progress">Em progresso</SelectItem>
                      <SelectItem value="completed">Concluída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="schedule" className="space-y-4">
            {/* Agendamento */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data de início</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? (
                          format(startDate, "dd/MM/yyyy", { locale: ptBR })
                        ) : (
                          <span>Selecionar data</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <Label>Data de término</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dueDate ? (
                          format(dueDate, "dd/MM/yyyy", { locale: ptBR })
                        ) : (
                          <span>Selecionar data</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dueDate}
                        onSelect={setDueDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="reminder-switch">Lembrete</Label>
                  <Switch
                    id="reminder-switch"
                    checked={enableReminder}
                    onCheckedChange={setEnableReminder}
                  />
                </div>
                
                {enableReminder && (
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {reminderDate ? (
                              format(reminderDate, "dd/MM/yyyy", { locale: ptBR })
                            ) : (
                              <span>Data do lembrete</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={reminderDate}
                            onSelect={setReminderDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <Input
                        type="time"
                        value={reminderTime}
                        onChange={(e) => setReminderTime(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="repeat">Repetir</Label>
                <Select value={repeatFrequency} onValueChange={setRepeatFrequency}>
                  <SelectTrigger id="repeat">
                    <SelectValue placeholder="Selecione a frequência" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Não repetir</SelectItem>
                    <SelectItem value="daily">Diariamente</SelectItem>
                    <SelectItem value="weekdays">Dias úteis (Seg-Sex)</SelectItem>
                    <SelectItem value="weekly">Semanalmente</SelectItem>
                    <SelectItem value="biweekly">Quinzenalmente</SelectItem>
                    <SelectItem value="monthly">Mensalmente</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
                
                {repeatFrequency === 'custom' && renderWeekdaySelector()}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="advanced" className="space-y-4">
            {/* Opções avançadas */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="project">Projeto</Label>
                <Select 
                  value={selectedProject || ""} 
                  onValueChange={(value) => setSelectedProject(value || undefined)}
                >
                  <SelectTrigger id="project">
                    <SelectValue placeholder="Selecione um projeto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="goal">Meta/Objetivo</Label>
                <Select 
                  value={selectedGoal || ""} 
                  onValueChange={(value) => setSelectedGoal(value || undefined)}
                >
                  <SelectTrigger id="goal">
                    <SelectValue placeholder="Selecione uma meta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum</SelectItem>
                    {goals.map((goal) => (
                      <SelectItem key={goal.id} value={goal.id}>
                        {goal.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Notificações</Label>
                <div className="rounded-md border p-4 space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch id="notify-email" />
                    <Label htmlFor="notify-email">Notificar por email</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="notify-browser" defaultChecked />
                    <Label htmlFor="notify-browser">Notificar no navegador</Label>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSaveTask} disabled={isLoading}>
            {isLoading ? "Salvando..." : isEditing ? "Atualizar" : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
