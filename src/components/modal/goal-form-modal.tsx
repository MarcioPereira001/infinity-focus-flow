
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface GoalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoalCreated?: (goal: any) => void;
  onGoalUpdated?: (goal: any) => void;
  existingGoal?: any;
}

export function GoalFormModal({
  isOpen,
  onClose,
  onGoalCreated,
  onGoalUpdated,
  existingGoal
}: GoalFormModalProps) {
  const { user } = useAuth();
  const isEditing = !!existingGoal;
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [targetValue, setTargetValue] = useState<number>(1);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  
  // Carregar projetos e tarefas
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
        
        // Buscar tarefas
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('id, title')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        if (tasksError) throw tasksError;
        setTasks(tasksData || []);
        
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    
    fetchData();
  }, [user]);
  
  // Carregar dados existentes para edição
  useEffect(() => {
    if (existingGoal) {
      setTitle(existingGoal.title || "");
      setDescription(existingGoal.description || "");
      setPriority(existingGoal.priority || "medium");
      setTargetValue(existingGoal.target_value || 1);
      setSelectedProjects(existingGoal.project_ids || []);
      setSelectedTasks(existingGoal.task_ids || []);
      
      if (existingGoal.start_date) {
        setStartDate(new Date(existingGoal.start_date));
      }
      if (existingGoal.end_date) {
        setEndDate(new Date(existingGoal.end_date));
      }
    } else {
      resetForm();
    }
  }, [existingGoal]);
  
  // Resetar formulário
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPriority("medium");
    setStartDate(undefined);
    setEndDate(undefined);
    setTargetValue(1);
    setSelectedProjects([]);
    setSelectedTasks([]);
  };
  
  // Validar formulário
  const validateForm = () => {
    if (!title.trim()) {
      toast({
        title: "Título obrigatório",
        description: "Por favor, informe um título para a meta",
        variant: "destructive",
      });
      return false;
    }
    
    if (startDate && endDate && startDate >= endDate) {
      toast({
        title: "Datas inválidas",
        description: "A data de término deve ser posterior à data de início",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };
  
  // Manipular seleção de projetos
  const handleProjectToggle = (projectId: string) => {
    setSelectedProjects(prev => 
      prev.includes(projectId) 
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };
  
  // Manipular seleção de tarefas
  const handleTaskToggle = (taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };
  
  // Salvar meta
  const handleSaveGoal = async () => {
    if (!validateForm() || !user) return;
    
    setIsLoading(true);
    
    try {
      const goalData = {
        title,
        description,
        priority,
        start_date: startDate ? startDate.toISOString() : null,
        end_date: endDate ? endDate.toISOString() : null,
        target_value: targetValue,
        current_value: 0,
        project_ids: selectedProjects.length > 0 ? selectedProjects : null,
        task_ids: selectedTasks.length > 0 ? selectedTasks : null,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      };
      
      let result;
      
      if (isEditing) {
        // Atualizar meta existente
        const { data, error } = await supabase
          .from('goals')
          .update(goalData)
          .eq('id', existingGoal.id)
          .select()
          .single();
          
        if (error) throw error;
        result = data;
        
        toast({
          title: "Meta atualizada",
          description: "A meta foi atualizada com sucesso",
        });
        
        if (onGoalUpdated) {
          onGoalUpdated(result);
        }
      } else {
        // Criar nova meta
        const newGoalData = {
          ...goalData,
          created_at: new Date().toISOString(),
        };
        
        const { data, error } = await supabase
          .from('goals')
          .insert(newGoalData)
          .select()
          .single();
          
        if (error) throw error;
        result = data;
        
        toast({
          title: "Meta criada",
          description: "A meta foi criada com sucesso",
        });
        
        if (onGoalCreated) {
          onGoalCreated(result);
        }
      }
      
      onClose();
      resetForm();
      
    } catch (error: any) {
      console.error('Error saving goal:', error);
      toast({
        title: "Erro ao salvar meta",
        description: error.message || "Ocorreu um erro ao salvar a meta",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar meta" : "Nova meta"}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          {/* Informações básicas */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título da meta</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Digite o título da meta"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva a meta em detalhes"
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
                <Label htmlFor="targetValue">Valor alvo</Label>
                <Input
                  id="targetValue"
                  type="number"
                  min="1"
                  value={targetValue}
                  onChange={(e) => setTargetValue(parseInt(e.target.value) || 1)}
                  placeholder="1"
                />
              </div>
            </div>
          </div>
          
          {/* Datas */}
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
                    {endDate ? (
                      format(endDate, "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      <span>Selecionar data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          {/* Seleção de projetos */}
          {projects.length > 0 && (
            <div className="space-y-2">
              <Label>Projetos relacionados</Label>
              <div className="max-h-32 overflow-y-auto border rounded p-2 space-y-2">
                {projects.map((project) => (
                  <div key={project.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`project-${project.id}`}
                      checked={selectedProjects.includes(project.id)}
                      onCheckedChange={() => handleProjectToggle(project.id)}
                    />
                    <Label
                      htmlFor={`project-${project.id}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {project.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Seleção de tarefas */}
          {tasks.length > 0 && (
            <div className="space-y-2">
              <Label>Tarefas relacionadas</Label>
              <div className="max-h-32 overflow-y-auto border rounded p-2 space-y-2">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`task-${task.id}`}
                      checked={selectedTasks.includes(task.id)}
                      onCheckedChange={() => handleTaskToggle(task.id)}
                    />
                    <Label
                      htmlFor={`task-${task.id}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {task.title}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSaveGoal} disabled={isLoading}>
            {isLoading ? "Salvando..." : isEditing ? "Atualizar" : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
