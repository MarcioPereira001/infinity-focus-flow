
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
import { CalendarIcon, Plus, Copy, Check } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated?: (project: any) => void;
  onProjectUpdated?: (project: any) => void;
  existingProject?: any;
}

export function ProjectFormModal({
  isOpen,
  onClose,
  onProjectCreated,
  onProjectUpdated,
  existingProject
}: ProjectFormModalProps) {
  const { user } = useAuth();
  const isEditing = !!existingProject;
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [isIndefinite, setIsIndefinite] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [projectMembers, setProjectMembers] = useState<any[]>([]);
  const [inviteLink, setInviteLink] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  
  // Carregar dados existentes para edição
  useEffect(() => {
    if (existingProject) {
      setName(existingProject.name || "");
      setDescription(existingProject.description || "");
      setPriority(existingProject.priority || "medium");
      setIsIndefinite(existingProject.is_indefinite || false);
      
      if (existingProject.start_date) {
        setStartDate(new Date(existingProject.start_date));
      }
      if (existingProject.end_date) {
        setEndDate(new Date(existingProject.end_date));
      }
      
      // Gerar link de convite para projeto existente
      setInviteLink(`${window.location.origin}/invite/${existingProject.id}`);
      
      // Buscar membros do projeto
      fetchProjectMembers(existingProject.id);
    } else {
      resetForm();
    }
  }, [existingProject]);
  
  const fetchProjectMembers = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('project_members')
        .select(`
          *,
          profiles:user_id (full_name)
        `)
        .eq('project_id', projectId);
        
      if (error) throw error;
      setProjectMembers(data || []);
    } catch (error) {
      console.error('Error fetching project members:', error);
    }
  };
  
  // Resetar formulário
  const resetForm = () => {
    setName("");
    setDescription("");
    setPriority("medium");
    setStartDate(undefined);
    setEndDate(undefined);
    setIsIndefinite(false);
    setMemberEmail("");
    setProjectMembers([]);
    setInviteLink("");
    setLinkCopied(false);
  };
  
  // Validar formulário
  const validateForm = () => {
    if (!name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe um nome para o projeto",
        variant: "destructive",
      });
      return false;
    }
    
    if (!isIndefinite && startDate && endDate && startDate >= endDate) {
      toast({
        title: "Datas inválidas",
        description: "A data de término deve ser posterior à data de início",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };
  
  // Adicionar membro por email
  const handleAddMember = async () => {
    if (!memberEmail.trim() || !existingProject) return;
    
    try {
      // Buscar usuário por email
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .ilike('full_name', `%${memberEmail}%`);
        
      if (profileError) throw profileError;
      
      if (!profiles || profiles.length === 0) {
        toast({
          title: "Usuário não encontrado",
          description: "Não foi possível encontrar um usuário com esse email",
          variant: "destructive",
        });
        return;
      }
      
      const profile = profiles[0];
      
      // Verificar se já é membro
      const isAlreadyMember = projectMembers.some(member => member.user_id === profile.user_id);
      if (isAlreadyMember) {
        toast({
          title: "Usuário já é membro",
          description: "Este usuário já faz parte do projeto",
          variant: "destructive",
        });
        return;
      }
      
      // Adicionar como membro
      const { data, error } = await supabase
        .from('project_members')
        .insert({
          project_id: existingProject.id,
          user_id: profile.user_id,
          role: 'member'
        })
        .select(`
          *,
          profiles:user_id (full_name)
        `)
        .single();
        
      if (error) throw error;
      
      setProjectMembers(prev => [...prev, data]);
      setMemberEmail("");
      
      toast({
        title: "Membro adicionado",
        description: "O usuário foi adicionado ao projeto com sucesso",
      });
      
    } catch (error: any) {
      console.error('Error adding member:', error);
      toast({
        title: "Erro ao adicionar membro",
        description: error.message || "Não foi possível adicionar o membro",
        variant: "destructive",
      });
    }
  };
  
  // Copiar link de convite
  const handleCopyInviteLink = async () => {
    if (!inviteLink) return;
    
    try {
      await navigator.clipboard.writeText(inviteLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
      
      toast({
        title: "Link copiado",
        description: "O link de convite foi copiado para a área de transferência",
      });
    } catch (error) {
      toast({
        title: "Erro ao copiar link",
        description: "Não foi possível copiar o link",
        variant: "destructive",
      });
    }
  };
  
  // Salvar projeto
  const handleSaveProject = async () => {
    if (!validateForm() || !user) return;
    
    setIsLoading(true);
    
    try {
      const projectData = {
        name,
        description,
        priority,
        start_date: !isIndefinite && startDate ? startDate.toISOString() : null,
        end_date: !isIndefinite && endDate ? endDate.toISOString() : null,
        is_indefinite: isIndefinite,
        updated_at: new Date().toISOString(),
      };
      
      let result;
      
      if (isEditing) {
        // Atualizar projeto existente
        const { data, error } = await supabase
          .from('projects')
          .update(projectData)
          .eq('id', existingProject.id)
          .select()
          .single();
          
        if (error) throw error;
        result = data;
        
        toast({
          title: "Projeto atualizado",
          description: "O projeto foi atualizado com sucesso",
        });
        
        if (onProjectUpdated) {
          onProjectUpdated(result);
        }
      } else {
        // Criar novo projeto
        const newProjectData = {
          ...projectData,
          owner_id: user.id,
          created_at: new Date().toISOString(),
        };
        
        const { data, error } = await supabase
          .from('projects')
          .insert(newProjectData)
          .select()
          .single();
          
        if (error) throw error;
        result = data;
        
        // Gerar link de convite para o novo projeto
        setInviteLink(`${window.location.origin}/invite/${result.id}`);
        
        toast({
          title: "Projeto criado",
          description: "O projeto foi criado com sucesso",
        });
        
        if (onProjectCreated) {
          onProjectCreated(result);
        }
      }
      
      onClose();
      resetForm();
      
    } catch (error: any) {
      console.error('Error saving project:', error);
      toast({
        title: "Erro ao salvar projeto",
        description: error.message || "Ocorreu um erro ao salvar o projeto",
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
          <DialogTitle>{isEditing ? "Editar projeto" : "Novo projeto"}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          {/* Informações básicas */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do projeto</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Digite o nome do projeto"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o projeto (opcional)"
                rows={3}
              />
            </div>
            
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
          </div>
          
          {/* Configurações de tempo */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="indefinite"
                checked={isIndefinite}
                onCheckedChange={setIsIndefinite}
              />
              <Label htmlFor="indefinite">Projeto por tempo indeterminado</Label>
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
            )}
          </div>
          
          {/* Gerenciamento de membros */}
          {(isEditing || inviteLink) && (
            <div className="space-y-4">
              <Label>Membros do projeto</Label>
              
              {/* Link de convite */}
              {inviteLink && (
                <div className="space-y-2">
                  <Label className="text-sm">Link de convite</Label>
                  <div className="flex space-x-2">
                    <Input
                      value={inviteLink}
                      readOnly
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCopyInviteLink}
                      className="shrink-0"
                    >
                      {linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Adicionar membro por email */}
              {isEditing && (
                <div className="space-y-2">
                  <Label className="text-sm">Adicionar membro</Label>
                  <div className="flex space-x-2">
                    <Input
                      value={memberEmail}
                      onChange={(e) => setMemberEmail(e.target.value)}
                      placeholder="Email ou nome do usuário"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddMember}
                      className="shrink-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Lista de membros */}
              {projectMembers.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm">Membros atuais</Label>
                  <div className="space-y-1">
                    {projectMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm">{member.profiles?.full_name || 'Usuário'}</span>
                        <span className="text-xs text-muted-foreground capitalize">{member.role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSaveProject} disabled={isLoading}>
            {isLoading ? "Salvando..." : isEditing ? "Atualizar" : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
