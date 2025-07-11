import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface TrashItem {
  id: string;
  user_id: string;
  item_type: 'task' | 'project' | 'goal';
  item_id: string;
  item_data: any;
  deleted_at: string;
  expires_at: string;
  created_at: string;
}

export function useTrash() {
  const [trashItems, setTrashItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchTrashItems = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('trash_items')
        .select('*')
        .eq('user_id', user.id)
        .order('deleted_at', { ascending: false });

      if (error) throw error;
      setTrashItems((data || []) as TrashItem[]);
    } catch (error) {
      console.error('Error fetching trash items:', error);
    } finally {
      setLoading(false);
    }
  };

  const moveToTrash = async (itemType: 'task' | 'project' | 'goal', itemId: string, itemData: any) => {
    if (!user) return { error: new Error('No user logged in') };

    try {
      // Primeiro, adicionar item à lixeira
      const { error: trashError } = await supabase
        .from('trash_items')
        .insert({
          user_id: user.id,
          item_type: itemType,
          item_id: itemId,
          item_data: itemData
        });

      if (trashError) throw trashError;

      // Depois, fazer soft delete no item original
      const tableName = itemType === 'task' ? 'tasks' : itemType === 'project' ? 'projects' : 'goals';
      const { error: deleteError } = await supabase
        .from(tableName)
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', itemId);

      if (deleteError) throw deleteError;

      await fetchTrashItems();
      
      toast({
        title: "Item movido para lixeira",
        description: `${itemType === 'task' ? 'Tarefa' : itemType === 'project' ? 'Projeto' : 'Meta'} será excluído permanentemente em 30 dias`,
      });

      return { error: null };
    } catch (error: any) {
      console.error('Error moving to trash:', error);
      return { error };
    }
  };

  const restoreFromTrash = async (trashItemId: string, itemType: 'task' | 'project' | 'goal', itemId: string) => {
    try {
      // Remover soft delete do item original
      const tableName = itemType === 'task' ? 'tasks' : itemType === 'project' ? 'projects' : 'goals';
      const { error: restoreError } = await supabase
        .from(tableName)
        .update({ deleted_at: null })
        .eq('id', itemId);

      if (restoreError) throw restoreError;

      // Remover item da lixeira
      const { error: deleteError } = await supabase
        .from('trash_items')
        .delete()
        .eq('id', trashItemId);

      if (deleteError) throw deleteError;

      await fetchTrashItems();
      
      toast({
        title: "Item restaurado",
        description: `${itemType === 'task' ? 'Tarefa' : itemType === 'project' ? 'Projeto' : 'Meta'} foi restaurado com sucesso`,
      });

      return { error: null };
    } catch (error: any) {
      console.error('Error restoring from trash:', error);
      return { error };
    }
  };

  const permanentDelete = async (trashItemId: string, itemType: 'task' | 'project' | 'goal', itemId: string) => {
    try {
      // Deletar permanentemente do banco
      const tableName = itemType === 'task' ? 'tasks' : itemType === 'project' ? 'projects' : 'goals';
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .eq('id', itemId);

      if (deleteError) throw deleteError;

      // Remover da lixeira
      const { error: trashError } = await supabase
        .from('trash_items')
        .delete()
        .eq('id', trashItemId);

      if (trashError) throw trashError;

      await fetchTrashItems();
      
      toast({
        title: "Item excluído permanentemente",
        description: `${itemType === 'task' ? 'Tarefa' : itemType === 'project' ? 'Projeto' : 'Meta'} foi excluído permanentemente`,
      });

      return { error: null };
    } catch (error: any) {
      console.error('Error permanently deleting:', error);
      return { error };
    }
  };

  const emptyTrash = async () => {
    if (!user) return { error: new Error('No user logged in') };

    try {
      // Buscar todos os itens da lixeira do usuário
      const { data: items, error: fetchError } = await supabase
        .from('trash_items')
        .select('*')
        .eq('user_id', user.id);

      if (fetchError) throw fetchError;

      // Deletar permanentemente todos os itens
      for (const item of items || []) {
        const tableName = item.item_type === 'task' ? 'tasks' : item.item_type === 'project' ? 'projects' : 'goals';
        await supabase
          .from(tableName)
          .delete()
          .eq('id', item.item_id);
      }

      // Limpar lixeira
      const { error: emptyError } = await supabase
        .from('trash_items')
        .delete()
        .eq('user_id', user.id);

      if (emptyError) throw emptyError;

      await fetchTrashItems();
      
      toast({
        title: "Lixeira esvaziada",
        description: "Todos os itens foram excluídos permanentemente",
      });

      return { error: null };
    } catch (error: any) {
      console.error('Error emptying trash:', error);
      return { error };
    }
  };

  useEffect(() => {
    fetchTrashItems();
  }, [user]);

  return {
    trashItems,
    loading,
    moveToTrash,
    restoreFromTrash,
    permanentDelete,
    emptyTrash,
    refetch: fetchTrashItems,
  };
}