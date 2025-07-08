import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, FolderKanban, ListTodo, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function TrashBin() {
  // Por enquanto, apenas renderiza uma página vazia já que a tabela trash_items não existe
  const [isLoading] = useState(false);
  
  return (
    <AppLayout>
      <div className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Trash2 className="h-6 w-6 mr-2" />
            <h1 className="text-3xl font-bold">Lixeira</h1>
          </div>
        </div>
        
        <div className="mb-6">
          <p className="text-muted-foreground">
            A funcionalidade de lixeira estará disponível em breve.
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Lixeira Vazia</CardTitle>
            <CardDescription>
              Nenhum item encontrado na lixeira.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Trash2 className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">Lixeira vazia</h3>
              <p className="text-muted-foreground">Não há itens na lixeira</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}