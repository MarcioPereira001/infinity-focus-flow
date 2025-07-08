import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  const [isLoading, setIsLoading] = useState(false);
  
  // Carregar dados existentes para edição
  useEffect(() => {
    if (existingProject) {
      setName(existingProject.name || "");
      setDescription(existingProject.description || "");
    } else {
      resetForm();
    }
  }, [existingProject]);
  
  // Resetar formulário
  const resetForm = () => {
    setName("");
    setDescription("");
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
    
    return true;
  };
  
  // Salvar projeto
  const handleSaveProject = async () => {
    if (!validateForm() || !user) return;
    
    setIsLoading(true);
    
    try {
      const projectData = {
        name,
        description,
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar projeto" : "Novo projeto"}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
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