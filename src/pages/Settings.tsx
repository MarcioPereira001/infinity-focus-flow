import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Shield, Bell, CreditCard, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function Settings() {
  const navigate = useNavigate();
  const { profile, signOut, updateProfile, updatePassword } = useAuth();
  
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    avatar: ""
  });
  
  const [notifications, setNotifications] = useState({
    taskReminders: true,
    projectUpdates: true,
    emailNotifications: false,
    reminderTime: "10"
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Update form data when profile loads
  useEffect(() => {
    if (profile) {
      setProfileData({
        name: profile.full_name || "",
        email: "", // Email comes from auth, not profile
        avatar: profile.avatar_url || ""
      });
    }
  }, [profile]);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingProfile(true);

    try {
      // Upload avatar if a file was selected
      let avatarUrl = profileData.avatar;
      
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `avatars/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('user-content')
          .upload(filePath, selectedFile);
          
        if (uploadError) throw uploadError;
        
        const { data } = supabase.storage
          .from('user-content')
          .getPublicUrl(filePath);
          
        avatarUrl = data.publicUrl;
      }

      const { error } = await updateProfile({
        full_name: profileData.name,
        avatar_url: avatarUrl,
      });

      if (error) throw error;

      toast({
        title: "Perfil atualizado com sucesso!",
      });
      
      // Update local state with new avatar URL
      setProfileData({
        ...profileData,
        avatar: avatarUrl
      });
      
      setSelectedFile(null);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingProfile(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Erro na validação",
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Erro na validação",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    setLoadingPassword(true);

    try {
      const { error } = await updatePassword(passwordData.newPassword);

      if (error) throw error;

      toast({
        title: "Senha alterada com sucesso!",
      });
      
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast({
        title: "Erro ao alterar senha",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingPassword(false);
    }
  };

  const handleNotificationUpdate = () => {
    try {
      // Here we would save notification preferences to Supabase
      // For now, just show a success message
      toast({
        title: "Preferências salvas!",
        description: "Suas configurações de notificação foram atualizadas.",
      });
    } catch (error: any) {
      console.error('Error updating notifications:', error);
      toast({
        title: "Erro ao salvar preferências",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpgradeClick = () => {
    toast({
      title: "Upgrade em desenvolvimento",
      description: "A funcionalidade de pagamento será implementada em breve.",
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O tamanho máximo permitido é 5MB",
          variant: "destructive",
        });
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Tipo de arquivo inválido",
          description: "Por favor, selecione uma imagem",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setProfileData({
            ...profileData,
            avatar: event.target.result as string
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const daysRemaining = profile.trial_ends_at 
    ? Math.max(0, Math.ceil((new Date(profile.trial_ends_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie sua conta e preferências
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="subscription">Plano</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card className="card-soft">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <CardTitle>Informações do Perfil</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profileData.avatar} />
                  <AvatarFallback className="text-lg">
                    {profileData.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <input
                    type="file"
                    id="avatar-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  <label htmlFor="avatar-upload">
                    <Button variant="outline" className="cursor-pointer" asChild>
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        Alterar Foto
                      </span>
                    </Button>
                  </label>
                </div>
              </div>

              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome completo</Label>
                    <Input
                      id="name"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      disabled
                      placeholder="Email não pode ser alterado"
                    />
                  </div>
                </div>
                <Button type="submit" className="btn-gradient" disabled={loadingProfile}>
                  {loadingProfile ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card className="card-soft">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <CardTitle>Alterar Senha</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Senha atual</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nova senha</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar nova senha</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  />
                </div>
                <Button type="submit" className="btn-gradient" disabled={loadingPassword}>
                  {loadingPassword ? "Alterando..." : "Alterar Senha"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="card-soft">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <CardTitle>Preferências de Notificação</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Lembrete de tarefas</Label>
                    <p className="text-sm text-muted-foreground">
                      Receba notificações sobre tarefas próximas do prazo
                    </p>
                  </div>
                  <Switch
                    checked={notifications.taskReminders}
                    onCheckedChange={(checked) => 
                      setNotifications({ ...notifications, taskReminders: checked })
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Atualizações de projeto</Label>
                    <p className="text-sm text-muted-foreground">
                      Notificações sobre mudanças em projetos compartilhados
                    </p>
                  </div>
                  <Switch
                    checked={notifications.projectUpdates}
                    onCheckedChange={(checked) => 
                      setNotifications({ ...notifications, projectUpdates: checked })
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificações por email</Label>
                    <p className="text-sm text-muted-foreground">
                      Receba resumos diários por email
                    </p>
                  </div>
                  <Switch
                    checked={notifications.emailNotifications}
                    onCheckedChange={(checked) => 
                      setNotifications({ ...notifications, emailNotifications: checked })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tempo de antecedência para lembretes</Label>
                <Select 
                  value={notifications.reminderTime} 
                  onValueChange={(value) => 
                    setNotifications({ ...notifications, reminderTime: value })
                  }
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 minutos</SelectItem>
                    <SelectItem value="10">10 minutos</SelectItem>
                    <SelectItem value="15">15 minutos</SelectItem>
                    <SelectItem value="30">30 minutos</SelectItem>
                    <SelectItem value="60">1 hora</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleNotificationUpdate} className="btn-gradient">
                Salvar Preferências
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription" className="space-y-6">
          <Card className="card-soft">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5" />
                <CardTitle>Plano e Assinatura</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Plano Atual</h3>
                  <p className="text-sm text-muted-foreground">
                    {profile.plan_status === 'pro' ? 'Plano Pro' : 'Teste gratuito de 7 dias'}
                  </p>
                </div>
                <Badge 
                  variant="outline" 
                  className={`${profile.plan_status === 'pro' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}
                >
                  {profile.plan_status === 'pro' ? 'Ativo' : `${daysRemaining} dias restantes`}
                </Badge>
              </div>

              <div className="space-y-4">
                <div className="p-4 border rounded-lg bg-primary/5 border-primary/20">
                  <h4 className="font-medium mb-2">Plano Pro - R$ 29,90/mês</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Tarefas e projetos ilimitados</li>
                    <li>• Colaboração em tempo real</li>
                    <li>• Dashboard avançado</li>
                    <li>• Suporte prioritário</li>
                  </ul>
                </div>
                
                <Button className="w-full btn-gradient" onClick={handleUpgradeClick}>
                  {profile.plan_status === 'pro' ? 'Gerenciar Assinatura' : 'Fazer Upgrade Agora'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
