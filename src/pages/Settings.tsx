import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Camera, CreditCard, Lock, Bell, User, Trash2, LogOut, Upload, CheckCircle, AlertCircle } from "lucide-react";

export default function Settings() {
  const { user, profile, updateProfile, signOut } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState("profile");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    avatar: ""
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  const [notifications, setNotifications] = useState({
    taskReminders: true,
    projectUpdates: true,
    emailNotifications: false,
    reminderTime: "10"
  });
  
  // Carregar dados do perfil
  useEffect(() => {
    if (profile) {
      setProfileData({
        name: profile.full_name || "",
        email: user?.email || "",
        avatar: profile.avatar_url || ""
      });
    }
  }, [profile, user]);
  
  // Carregar configurações de notificação
  useEffect(() => {
    const loadNotificationSettings = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (error && error.code !== 'PGRST116') { // PGRST116 = not found
          throw error;
        }
        
        if (data) {
          setNotifications({
            taskReminders: data.task_reminders,
            projectUpdates: data.project_updates,
            emailNotifications: data.email_notifications,
            reminderTime: data.reminder_time || "10"
          });
        }
      } catch (error: any) {
        console.error('Error loading notification settings:', error);
      }
    };
    
    loadNotificationSettings();
  }, [user]);
  
  // Manipular seleção de arquivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Criar URL para preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Atualizar perfil
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingProfile(true);
    
    try {
      // Upload avatar if a file was selected
      let avatarUrl = profileData.avatar;
      
      if (selectedFile) {
        // Verificar se o bucket existe
        const { data: buckets } = await supabase.storage.listBuckets();
        const bucketExists = buckets?.some(bucket => bucket.name === 'user-content');
        
        if (!bucketExists) {
          // Criar o bucket se não existir
          const { error: createBucketError } = await supabase.storage.createBucket('user-content', {
            public: true
          });
          
          if (createBucketError) {
            toast({
              title: "Erro ao criar bucket de armazenamento",
              description: "Por favor, entre em contato com o suporte",
              variant: "destructive",
            });
            throw createBucketError;
          }
        }
        
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
      
      // Atualizar diretamente no banco de dados em vez de usar a função updateProfile
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileData.name,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user?.id);
      
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
      
      // Recarregar a página para atualizar o perfil no contexto
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
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
  
  // Atualizar senha
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingPassword(true);
    
    try {
      // Validar senhas
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        throw new Error("As senhas não coincidem");
      }
      
      if (passwordData.newPassword.length < 6) {
        throw new Error("A senha deve ter pelo menos 6 caracteres");
      }
      
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });
      
      if (error) throw error;
      
      toast({
        title: "Senha atualizada com sucesso!",
      });
      
      // Limpar campos
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast({
        title: "Erro ao atualizar senha",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingPassword(false);
    }
  };
  
  // Atualizar notificações
  const handleNotificationUpdate = async () => {
    if (!user) return;
    
    setLoadingNotifications(true);
    
    try {
      // Verificar se já existe um registro para o usuário
      const { data, error: fetchError } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', user.id)
        .single();
        
      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = not found
        throw fetchError;
      }
      
      // Preparar dados para salvar
      const settingsData = {
        user_id: user.id,
        task_reminders: notifications.taskReminders,
        project_updates: notifications.projectUpdates,
        email_notifications: notifications.emailNotifications,
        reminder_time: notifications.reminderTime,
        updated_at: new Date().toISOString()
      };
      
      let error;
      
      if (data) {
        // Atualizar registro existente
        const result = await supabase
          .from('user_settings')
          .update(settingsData)
          .eq('user_id', user.id);
          
        error = result.error;
      } else {
        // Criar novo registro
        const result = await supabase
          .from('user_settings')
          .insert({
            ...settingsData,
            created_at: new Date().toISOString()
          });
          
        error = result.error;
      }
      
      if (error) throw error;
      
      // Solicitar permissão para notificações do navegador
      if (notifications.taskReminders || notifications.projectUpdates) {
        if ('Notification' in window) {
          const permission = await Notification.requestPermission();
          
          if (permission === 'granted') {
            toast({
              title: "Notificações ativadas",
              description: "Você receberá notificações sobre suas tarefas e projetos",
            });
          } else {
            toast({
              title: "Permissão de notificação negada",
              description: "Você não receberá notificações no navegador",
              variant: "destructive",
            });
          }
        }
      }
      
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
    } finally {
      setLoadingNotifications(false);
    }
  };
  
  // Fazer logout
  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error: any) {
      console.error('Error signing out:', error);
      toast({
        title: "Erro ao fazer logout",
        description: error.message,
        variant: "destructive",
      });
    }
  };
  
  // Navegar para checkout
  const handleUpgradeClick = () => {
    navigate('/checkout');
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie suas preferências e configurações de conta
        </p>
      </div>
      
      <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="password">Senha</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="plan">Plano</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="space-y-6">
          <Card className="card-soft">
            <CardHeader>
              <CardTitle>Informações do Perfil</CardTitle>
              <CardDescription>
                Atualize suas informações pessoais e foto de perfil
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div className="flex flex-col items-center space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={previewUrl || profileData.avatar} />
                      <AvatarFallback className="text-lg">
                        {profileData.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute bottom-0 right-0">
                      <Label htmlFor="avatar" className="cursor-pointer">
                        <div className="rounded-full bg-primary p-2 text-primary-foreground shadow-sm">
                          <Camera className="h-4 w-4" />
                        </div>
                      </Label>
                      <Input 
                        id="avatar" 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleFileChange}
                      />
                    </div>
                  </div>
                  <div className="space-y-4 flex-1">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome completo</Label>
                      <Input 
                        id="name" 
                        value={profileData.name} 
                        onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        value={profileData.email} 
                        disabled 
                      />
                      <p className="text-xs text-muted-foreground">
                        O email não pode ser alterado
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button type="submit" disabled={loadingProfile}>
                    {loadingProfile ? "Salvando..." : "Salvar alterações"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
          
          <Card className="card-soft border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Ações perigosas</CardTitle>
              <CardDescription>
                Estas ações não podem ser desfeitas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Excluir conta</h4>
                    <p className="text-sm text-muted-foreground">
                      Todos os seus dados serão permanentemente excluídos
                    </p>
                  </div>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir conta
                  </Button>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Sair da conta</h4>
                    <p className="text-sm text-muted-foreground">
                      Você será redirecionado para a página de login
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="password" className="space-y-6">
          <Card className="card-soft">
            <CardHeader>
              <CardTitle>Alterar senha</CardTitle>
              <CardDescription>
                Atualize sua senha para manter sua conta segura
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Senha atual</Label>
                  <Input 
                    id="current-password" 
                    type="password" 
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nova senha</Label>
                  <Input 
                    id="new-password" 
                    type="password" 
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar nova senha</Label>
                  <Input 
                    id="confirm-password" 
                    type="password" 
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  />
                </div>
                
                <div className="flex justify-end">
                  <Button type="submit" disabled={loadingPassword}>
                    {loadingPassword ? "Atualizando..." : "Atualizar senha"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications" className="space-y-6">
          <Card className="card-soft">
            <CardHeader>
              <CardTitle>Preferências de notificação</CardTitle>
              <CardDescription>
                Escolha como e quando deseja receber notificações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="task-reminders">Lembretes de tarefas</Label>
                    <p className="text-sm text-muted-foreground">
                      Receba notificações sobre tarefas próximas do prazo
                    </p>
                  </div>
                  <Switch 
                    id="task-reminders" 
                    checked={notifications.taskReminders}
                    onCheckedChange={(checked) => setNotifications({...notifications, taskReminders: checked})}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="project-updates">Atualizações de projetos</Label>
                    <p className="text-sm text-muted-foreground">
                      Receba notificações sobre atualizações em projetos compartilhados
                    </p>
                  </div>
                  <Switch 
                    id="project-updates" 
                    checked={notifications.projectUpdates}
                    onCheckedChange={(checked) => setNotifications({...notifications, projectUpdates: checked})}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications">Notificações por email</Label>
                    <p className="text-sm text-muted-foreground">
                      Receba um resumo diário das suas tarefas por email
                    </p>
                  </div>
                  <Switch 
                    id="email-notifications" 
                    checked={notifications.emailNotifications}
                    onCheckedChange={(checked) => setNotifications({...notifications, emailNotifications: checked})}
                  />
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label htmlFor="reminder-time">Horário dos lembretes</Label>
                  <Select 
                    value={notifications.reminderTime}
                    onValueChange={(value) => setNotifications({...notifications, reminderTime: value})}
                  >
                    <SelectTrigger id="reminder-time">
                      <SelectValue placeholder="Selecione um horário" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="8">08:00</SelectItem>
                      <SelectItem value="9">09:00</SelectItem>
                      <SelectItem value="10">10:00</SelectItem>
                      <SelectItem value="12">12:00</SelectItem>
                      <SelectItem value="14">14:00</SelectItem>
                      <SelectItem value="16">16:00</SelectItem>
                      <SelectItem value="18">18:00</SelectItem>
                      <SelectItem value="20">20:00</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Horário em que você receberá lembretes diários
                  </p>
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={handleNotificationUpdate} disabled={loadingNotifications}>
                    {loadingNotifications ? "Salvando..." : "Salvar preferências"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="plan" className="space-y-6">
          <Card className="card-soft">
            <CardHeader>
              <CardTitle>Seu plano atual</CardTitle>
              <CardDescription>
                Gerencie sua assinatura e veja os recursos disponíveis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-lg">
                      {profile?.plan_status === 'pro' ? 'Plano Pro' : 'Plano Gratuito'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {profile?.plan_status === 'pro' 
                        ? 'Você tem acesso a todos os recursos premium' 
                        : 'Acesso limitado aos recursos básicos'}
                    </p>
                  </div>
                  <Badge variant={profile?.plan_status === 'pro' ? 'default' : 'outline'}>
                    {profile?.plan_status === 'pro' ? 'Ativo' : 'Gratuito'}
                  </Badge>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h4 className="font-medium">Recursos incluídos:</h4>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-primary mr-2" />
                      <span>Tarefas ilimitadas</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-primary mr-2" />
                      <span>Projetos básicos</span>
                    </li>
                    {profile?.plan_status === 'pro' ? (
                      <>
                        <li className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-primary mr-2" />
                          <span>Projetos ilimitados</span>
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-primary mr-2" />
                          <span>Colaboração em tempo real</span>
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-primary mr-2" />
                          <span>Analytics avançado</span>
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-primary mr-2" />
                          <span>Suporte prioritário</span>
                        </li>
                      </>
                    ) : (
                      <>
                        <li className="flex items-center text-muted-foreground">
                          <AlertCircle className="h-4 w-4 mr-2" />
                          <span>Projetos ilimitados</span>
                        </li>
                        <li className="flex items-center text-muted-foreground">
                          <AlertCircle className="h-4 w-4 mr-2" />
                          <span>Colaboração em tempo real</span>
                        </li>
                        <li className="flex items-center text-muted-foreground">
                          <AlertCircle className="h-4 w-4 mr-2" />
                          <span>Analytics avançado</span>
                        </li>
                        <li className="flex items-center text-muted-foreground">
                          <AlertCircle className="h-4 w-4 mr-2" />
                          <span>Suporte prioritário</span>
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              {profile?.plan_status === 'pro' ? (
                <Button variant="outline" className="w-full">
                  Gerenciar assinatura
                </Button>
              ) : (
                <Button onClick={handleUpgradeClick} className="w-full btn-gradient">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Fazer Upgrade Agora
                </Button>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
