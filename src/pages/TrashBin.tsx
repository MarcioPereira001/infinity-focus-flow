import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, RotateCcw, AlertCircle, CheckCircle2, FolderKanban, ListTodo, Target } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function TrashBin() {
  const { user } = useAuth();
  const [trashItems, setTrashItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  
  // Buscar itens da lixeira
  useEffect(() => {
    if (!user) return;
    
    const fetchTrashItems = async () => {
      setIsLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('trash_items')
          .select('*')
          .order('deleted_at', { ascending: false });
          
        if (error) throw error;
        
        setTrashItems(data || []);
      } catch (error) {
        console.error('Error fetching trash items:', error);
        toast({
          title: "Erro ao carregar lixeira",
          description: "Não foi possível carregar os itens da lixeira",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTrashItems();
  }, [user]);
  
  // Filtrar itens com base na aba ativa
  const filteredItems = trashItems.filter(item => {
    if (activeTab === 'all') return true;
    return item.item_type === activeTab;
  });
  
  // Restaurar item da lixeira
  const handleRestoreItem = async (item: any) => {
    if (!user) return;
    
    setIsRestoring(true);
    
    try {
      // Chamar a função de restauração
      const { data, error } = await supabase
        .rpc('restore_from_trash', {
          p_trash_id: item.id
        });
        
      if (error) throw error;
      
      // Remover o item da lista
      setTrashItems(prev => prev.filter(i => i.id !== item.id));
      
      // Fechar o modal
      setSelectedItem(null);
      
      toast({
        title: "Item restaurado",
        description: "O item foi restaurado com sucesso",
      });
    } catch (error: any) {
      console.error('Error restoring item:', error);
      toast({
        title: "Erro ao restaurar item",
        description: error.message || "Não foi possível restaurar o item",
        variant: "destructive",
      });
    } finally {
      setIsRestoring(false);
    }
  };
  
  // Excluir permanentemente um item
  const handleDeleteItem = async (item: any) => {
    if (!user) return;
    
    setIsDeleting(true);
    
    try {
      // Excluir o item da lixeira
      const { error } = await supabase
        .from('trash_items')
        .delete()
        .eq('id', item.id);
        
      if (error) throw error;
      
      // Remover o item da lista
      setTrashItems(prev => prev.filter(i => i.id !== item.id));
      
      // Fechar o modal
      setSelectedItem(null);
      
      toast({
        title: "Item excluído",
        description: "O item foi excluído permanentemente",
      });
    } catch (error: any) {
      console.error('Error deleting item:', error);
      toast({
        title: "Erro ao excluir item",
        description: error.message || "Não foi possível excluir o item",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Esvaziar a lixeira
  const handleEmptyTrash = async () => {
    if (!user) return;
    
    setIsDeleting(true);
    
    try {
      // Excluir todos os itens da lixeira
      const { error } = await supabase
        .from('trash_items')
        .delete()
        .is('user_id', user.id);
        
      if (error) throw error;
      
      // Limpar a lista
      setTrashItems([]);
      
      // Fechar o modal
      setConfirmDeleteAll(false);
      
      toast({
        title: "Lixeira esvaziada",
        description: "Todos os itens foram excluídos permanentemente",
      });
    } catch (error: any) {
      console.error('Error emptying trash:', error);
      toast({
        title: "Erro ao esvaziar lixeira",
        description: error.message || "Não foi possível esvaziar a lixeira",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Renderizar ícone com base no tipo de item
  const renderItemIcon = (itemType: string) => {
    switch (itemType) {
      case 'task':
        return <ListTodo className="h-5 w-5 text-blue-500" />;
      case 'project':
        return <FolderKanban className="h-5 w-5 text-purple-500" />;
      case 'goal':
        return <Target className="h-5 w-5 text-green-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };
  
  // Renderizar badge com base no tipo de item
  const renderItemTypeBadge = (itemType: string) => {
    switch (itemType) {
      case 'task':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-200">Tarefa</Badge>;
      case 'project':
        return <Badge variant="outline" className="bg-purple-100 text-purple-800 hover:bg-purple-200">Projeto</Badge>;
      case 'goal':
        return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-200">Meta</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };
  
  // Renderizar detalhes do item
  const renderItemDetails = (item: any) => {
    const itemData = item.item_data;
    
    if (item.item_type === 'task') {
      return (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">{itemData.title}</h3>
            {itemData.description && (
              <p className="text-muted-foreground mt-1">{itemData.description}</p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium">Status</h4>
              <p className="text-sm">
                {itemData.status === 'pending' ? 'Pendente' : 
                 itemData.status === 'in_progress' ? 'Em progresso' : 
                 itemData.status === 'completed' ? 'Concluída' : itemData.status}
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium">Prioridade</h4>
              <p className="text-sm">
                {itemData.priority === 'low' ? 'Baixa' : 
                 itemData.priority === 'medium' ? 'Média' : 
                 itemData.priority === 'high' ? 'Alta' : itemData.priority}
              </p>
            </div>
          </div>
          
          {(itemData.start_date || itemData.due_date) && (
            <div className="grid grid-cols-2 gap-4">
              {itemData.start_date && (
                <div>
                  <h4 className="text-sm font-medium">Data de início</h4>
                  <p className="text-sm">
                    {format(new Date(itemData.start_date), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
              )}
              
              {itemData.due_date && (
                <div>
                  <h4 className="text-sm font-medium">Data de término</h4>
                  <p className="text-sm">
                    {format(new Date(itemData.due_date), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }
    
    if (item.item_type === 'project') {
      return (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">{itemData.name}</h3>
            {itemData.description && (
              <p className="text-muted-foreground mt-1">{itemData.description}</p>
            )}
          </div>
          
          {(itemData.start_date || itemData.end_date) && (
            <div className="grid grid-cols-2 gap-4">
              {itemData.start_date && (
                <div>
                  <h4 className="text-sm font-medium">Data de início</h4>
                  <p className="text-sm">
                    {format(new Date(itemData.start_date), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
              )}
              
              {itemData.end_date && (
                <div>
                  <h4 className="text-sm font-medium">Data de término</h4>
                  <p className="text-sm">
                    {format(new Date(itemData.end_date), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
              )}
            </div>
          )}
          
          <div>
            <h4 className="text-sm font-medium">Visibilidade</h4>
            <p className="text-sm">
              {itemData.is_public ? 'Público' : 'Privado'}
            </p>
          </div>
        </div>
      );
    }
    
    if (item.item_type === 'goal') {
      return (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">{itemData.title}</h3>
            {itemData.description && (
              <p className="text-muted-foreground mt-1">{itemData.description}</p>
            )}
          </div>
          
          {(itemData.start_date || itemData.end_date) && (
            <div className="grid grid-cols-2 gap-4">
              {itemData.start_date && (
                <div>
                  <h4 className="text-sm font-medium">Data de início</h4>
                  <p className="text-sm">
                    {format(new Date(itemData.start_date), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
              )}
              
              {itemData.end_date && (
                <div>
                  <h4 className="text-sm font-medium">Data de término</h4>
                  <p className="text-sm">
                    {format(new Date(itemData.end_date), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
              )}
            </div>
          )}
          
          {(itemData.target_value !== undefined || itemData.current_value !== undefined) && (
            <div className="grid grid-cols-2 gap-4">
              {itemData.target_value !== undefined && (
                <div>
                  <h4 className="text-sm font-medium">Valor alvo</h4>
                  <p className="text-sm">{itemData.target_value}</p>
                </div>
              )}
              
              {itemData.current_value !== undefined && (
                <div>
                  <h4 className="text-sm font-medium">Valor atual</h4>
                  <p className="text-sm">{itemData.current_value}</p>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }
    
    return (
      <div className="text-center py-4">
        <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto" />
        <p className="mt-2 text-muted-foreground">Detalhes não disponíveis</p>
      </div>
    );
  };
  
  // Renderizar cartão de item
  const renderItemCard = (item: any) => {
    const itemData = item.item_data;
    const itemTitle = 
      item.item_type === 'task' ? itemData.title : 
      item.item_type === 'project' ? itemData.name : 
      item.item_type === 'goal' ? itemData.title : 'Item desconhecido';
    
    const deletedDate = new Date(item.deleted_at);
    const expiresDate = new Date(item.expires_at);
    const daysLeft = Math.ceil((expiresDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    return (
      <Card key={item.id} className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              {renderItemIcon(item.item_type)}
              <CardTitle className="text-lg ml-2">{itemTitle}</CardTitle>
            </div>
            {renderItemTypeBadge(item.item_type)}
          </div>
          <CardDescription>
            Excluído {formatDistanceToNow(deletedDate, { addSuffix: true, locale: ptBR })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-2">
            {item.item_type === 'task' && itemData.description ? 
              itemData.description.substring(0, 100) + (itemData.description.length > 100 ? '...' : '') : 
             item.item_type === 'project' && itemData.description ? 
              itemData.description.substring(0, 100) + (itemData.description.length > 100 ? '...' : '') : 
             item.item_type === 'goal' && itemData.description ? 
              itemData.description.substring(0, 100) + (itemData.description.length > 100 ? '...' : '') : 
              'Sem descrição'}
          </p>
          
          <Alert variant={daysLeft <= 7 ? "destructive" : "default"} className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Expira em {daysLeft} dias</AlertTitle>
            <AlertDescription>
              Este item será excluído permanentemente em {format(expiresDate, "dd/MM/yyyy", { locale: ptBR })}.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setSelectedItem(item)}
          >
            Ver detalhes
          </Button>
          <Button 
            variant="default" 
            size="sm"
            onClick={() => handleRestoreItem(item)}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Restaurar
          </Button>
        </CardFooter>
      </Card>
    );
  };
  
  return (
    <AppLayout>
      <div className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Trash2 className="h-6 w-6 mr-2" />
            <h1 className="text-3xl font-bold">Lixeira</h1>
          </div>
          
          <Button 
            variant="destructive" 
            onClick={() => setConfirmDeleteAll(true)}
            disabled={trashItems.length === 0}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Esvaziar Lixeira
          </Button>
        </div>
        
        <div className="mb-6">
          <p className="text-muted-foreground">
            Itens excluídos são mantidos na lixeira por 30 dias antes de serem removidos permanentemente.
            Você pode restaurar itens ou excluí-los permanentemente a qualquer momento.
          </p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">Todos ({trashItems.length})</TabsTrigger>
            <TabsTrigger value="task">
              Tarefas ({trashItems.filter(item => item.item_type === 'task').length})
            </TabsTrigger>
            <TabsTrigger value="project">
              Projetos ({trashItems.filter(item => item.item_type === 'project').length})
            </TabsTrigger>
            <TabsTrigger value="goal">
              Metas ({trashItems.filter(item => item.item_type === 'goal').length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Carregando itens...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-8">
                <Trash2 className="h-12 w-12 mx-auto text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">Lixeira vazia</h3>
                <p className="text-muted-foreground">Não há itens na lixeira</p>
              </div>
            ) : (
              filteredItems.map(item => renderItemCard(item))
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Modal de detalhes do item */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              {selectedItem && renderItemIcon(selectedItem.item_type)}
              <span className="ml-2">Detalhes do item</span>
            </DialogTitle>
            <DialogDescription>
              {selectedItem && `Excluído em ${format(new Date(selectedItem.deleted_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`}
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh]">
            <div className="p-4">
              {selectedItem && renderItemDetails(selectedItem)}
              
              <Separator className="my-4" />
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Informações da lixeira</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Data de exclusão</p>
                    <p className="text-sm">
                      {selectedItem && format(new Date(selectedItem.deleted_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Expira em</p>
                    <p className="text-sm">
                      {selectedItem && format(new Date(selectedItem.expires_at), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
          
          <DialogFooter className="flex justify-between">
            <Button 
              variant="destructive" 
              onClick={() => selectedItem && handleDeleteItem(selectedItem)}
              disabled={isDeleting || isRestoring}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {isDeleting ? "Excluindo..." : "Excluir permanentemente"}
            </Button>
            <Button 
              variant="default" 
              onClick={() => selectedItem && handleRestoreItem(selectedItem)}
              disabled={isDeleting || isRestoring}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {isRestoring ? "Restaurando..." : "Restaurar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal de confirmação para esvaziar lixeira */}
      <Dialog open={confirmDeleteAll} onOpenChange={setConfirmDeleteAll}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Esvaziar lixeira</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja esvaziar a lixeira? Esta ação excluirá permanentemente todos os itens
              e não poderá ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteAll(false)} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleEmptyTrash}
              disabled={isDeleting}
            >
              {isDeleting ? "Excluindo..." : "Esvaziar lixeira"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
