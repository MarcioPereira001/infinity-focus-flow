
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
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated?: (task: any) => void;
  onTaskUpdated?: (task: any) => void;
  existingTask?: any;
  projectId?: string;
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
  const [status, setStatus] = useState("Novo");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [isIndefinite, setIsIndefinite] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | undefined>(projectId);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  
  // Estados para dados relacionados
  const [projects, setProjects] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  
  // Carregar dados existentes para edição
  useEffect(() => {
    if (existingTask) {
      setTitle(existingTask.title || "");
      setDescription(existingTask.description || "");
      setPriority(existingTask.priority || "medium");
      setStatus(existingTask.status || "Novo");
      setIsIndefinite(existingTask.is_indefinite || false);
      setSelectedGoals(existingTask.goal_ids || []);
      
      if (existingTask.start_date) {
        setStartDate(new Date(existingTask.start_date));
      }
      
      if (existingTask.due_date) {
        setDueDate(new Date(existingTask.due_date));
      }
      
      setSelectedProject(existingTask.project_id);
    } else {
      resetForm();
      
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
    setStatus("Novo");
    setStartDate(undefined);
    setDueDate(undefined);
    setIsIndefinite(false);
    setSelectedProject(projectId);
    setSelectedGoals([]);
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
    
    if (!isIndefinite && startDate && dueDate && startDate >= dueDate) {
      toast({
        title: "Datas inválidas",
        description: "A data de término deve ser posterior à data de início",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };
  
  // Manipular seleção de metas
  const handleGoalToggle = (goalId: string) => {
    setSelectedGoals(prev => 
      prev.includes(goalId) 
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
  };
  
  // Salvar tarefa
  const handleSaveTask = async () => {
    if (!validateForm() || !user) return;
    
    setIsLoading(true);
    
    try {
      const taskData: any = {
        title,
        description,
        priority,
        status,
        user_id: user.id,
        project_id: selectedProject || null,
        start_date: !isIndefinite && startDate ? startDate.toISOString() : null,
        due_date: !isIndefinite && dueDate ? dueDate.toISOString() : null,
        is_indefinite: isIndefinite,
        goal_ids: selectedGoals.length > 0 ? selectedGoals : null,
        updated_at: new Date().toISOString(),
      };
      
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
  
  if (!isOpen) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar tarefa" : "Nova tarefa"}</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="basic">Básico</TabsTrigger>
            <TabsTrigger value="advanced">Avançado</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-4">
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
                      <SelectItem value="Novo">Novo</SelectItem>
                      <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                      <SelectItem value="Aguardando Aprovação">Aguardando Aprovação</SelectItem>
                      <SelectItem value="Concluído">Concluído</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="advanced" className="space-y-4">
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
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="indefinite"
                  checked={isIndefinite}
                  onCheckedChange={setIsIndefinite}
                />
                <Label htmlFor="indefinite">Tarefa por tempo indeterminado</Label>
              </div>
              
              {!isIndefinite && (
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
              )}
              
              {goals.length > 0 && (
                <div className="space-y-2">
                  <Label>Metas relacionadas</Label>
                  <div className="max-h-32 overflow-y-auto border rounded p-2 space-y-2">
                    {goals.map((goal) => (
                      <div key={goal.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`goal-${goal.id}`}
                          checked={selectedGoals.includes(goal.id)}
                          onCheckedChange={() => handleGoalToggle(goal.id)}
                        />
                        <Label
                          htmlFor={`goal-${goal.id}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {goal.title}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
