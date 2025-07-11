import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, RotateCcw, AlertTriangle } from "lucide-react";
import { useTrash } from "@/hooks/useTrash";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const getItemTypeLabel = (type: string) => {
  switch (type) {
    case 'task': return 'Tarefa';
    case 'project': return 'Projeto';
    case 'goal': return 'Meta';
    default: return type;
  }
};

const getItemTypeColor = (type: string) => {
  switch (type) {
    case 'task': return 'bg-blue-500/10 text-blue-700 border-blue-200';
    case 'project': return 'bg-green-500/10 text-green-700 border-green-200';
    case 'goal': return 'bg-purple-500/10 text-purple-700 border-purple-200';
    default: return 'bg-gray-500/10 text-gray-700 border-gray-200';
  }
};

export default function TrashBin() {
  const { trashItems, loading, restoreFromTrash, permanentDelete, emptyTrash } = useTrash();
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const handleRestore = async (item: any) => {
    setProcessingIds(prev => new Set(prev).add(item.id));
    try {
      await restoreFromTrash(item.id, item.item_type, item.item_id);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }
  };

  const handlePermanentDelete = async (item: any) => {
    setProcessingIds(prev => new Set(prev).add(item.id));
    try {
      await permanentDelete(item.id, item.item_type, item.item_id);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }
  };

  const handleEmptyTrash = async () => {
    await emptyTrash();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Carregando lixeira...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Lixeira</h1>
          <p className="text-muted-foreground">
            Itens excluídos são mantidos por 30 dias antes da exclusão permanente
          </p>
        </div>
        
        {trashItems.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="w-4 h-4 mr-2" />
                Esvaziar Lixeira
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Esvaziar Lixeira</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação irá excluir permanentemente todos os itens da lixeira. 
                  Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleEmptyTrash} className="bg-destructive text-destructive-foreground">
                  Esvaziar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {trashItems.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Trash2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Lixeira vazia</h3>
            <p className="text-muted-foreground">
              Nenhum item foi excluído recentemente
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {trashItems.map((item) => (
            <Card key={item.id} className="transition-all hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge className={getItemTypeColor(item.item_type)}>
                      {getItemTypeLabel(item.item_type)}
                    </Badge>
                    <CardTitle className="text-lg">
                      {item.item_data.title || item.item_data.name}
                    </CardTitle>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestore(item)}
                      disabled={processingIds.has(item.id)}
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Restaurar
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={processingIds.has(item.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir Permanentemente</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação irá excluir permanentemente este item. 
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handlePermanentDelete(item)}
                            className="bg-destructive text-destructive-foreground"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <CardDescription className="mb-3">
                  {item.item_data.description}
                </CardDescription>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    Excluído em: {format(new Date(item.deleted_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </div>
                  
                  <div>
                    Expira em: {format(new Date(item.expires_at), "dd/MM/yyyy", { locale: ptBR })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}