import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Upload } from "lucide-react";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useRef } from "react";

export default function Settings() {
  const { profile, settings, loading, uploading, updateProfile, updateSettings, uploadAvatar } = useUserSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profileForm, setProfileForm] = useState({
    full_name: '',
  });

  // Atualizar form quando profile carrega
  useEffect(() => {
    if (profile) {
      setProfileForm({
        full_name: profile.full_name || '',
      });
    }
  }, [profile]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profile) {
      await updateProfile(profileForm);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadAvatar(file);
    }
  };

  const handleNotificationChange = async (key: keyof typeof settings, value: boolean) => {
    if (settings) {
      await updateSettings({ [key]: value });
    }
  };

  const handleSecurityChange = async (key: keyof typeof settings, value: boolean) => {
    if (settings) {
      await updateSettings({ [key]: value });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Carregando configurações...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie suas preferências e configurações da conta
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Perfil</CardTitle>
              <CardDescription>
                Atualize suas informações pessoais e foto de perfil
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Upload */}
              <div className="flex items-center gap-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="text-lg">
                    {profile?.full_name?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <Upload className="w-4 h-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4 mr-2" />
                        Alterar Foto
                      </>
                    )}
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Formatos aceitos: JPG, PNG (máx. 5MB)
                  </p>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>

              {/* Profile Form */}
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nome Completo</Label>
                  <Input
                    id="full_name"
                    value={profileForm.full_name}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="Seu nome completo"
                  />
                </div>

                <Button type="submit">
                  Salvar Alterações
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preferências de Notificação</CardTitle>
              <CardDescription>
                Configure como e quando você deseja receber notificações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificações por Email</Label>
                    <p className="text-sm text-muted-foreground">
                      Receber notificações importantes por email
                    </p>
                  </div>
                  <Switch
                    checked={settings?.email_notifications || false}
                    onCheckedChange={(checked) => handleNotificationChange('email_notifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Lembretes de Tarefas</Label>
                    <p className="text-sm text-muted-foreground">
                      Receber lembretes sobre tarefas próximas ao vencimento
                    </p>
                  </div>
                  <Switch
                    checked={settings?.task_reminders || false}
                    onCheckedChange={(checked) => handleNotificationChange('task_reminders', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Atualizações de Projetos</Label>
                    <p className="text-sm text-muted-foreground">
                      Notificações sobre mudanças em projetos que você participa
                    </p>
                  </div>
                  <Switch
                    checked={settings?.project_updates || false}
                    onCheckedChange={(checked) => handleNotificationChange('project_updates', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificações Push</Label>
                    <p className="text-sm text-muted-foreground">
                      Receber notificações push no navegador
                    </p>
                  </div>
                  <Switch
                    checked={settings?.push_notifications || false}
                    onCheckedChange={(checked) => handleNotificationChange('push_notifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Prazos de Tarefas</Label>
                    <p className="text-sm text-muted-foreground">
                      Alertas sobre prazos de tarefas se aproximando
                    </p>
                  </div>
                  <Switch
                    checked={settings?.task_deadline_notifications || false}
                    onCheckedChange={(checked) => handleNotificationChange('task_deadline_notifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Lembretes de Metas</Label>
                    <p className="text-sm text-muted-foreground">
                      Lembretes periódicos sobre suas metas
                    </p>
                  </div>
                  <Switch
                    checked={settings?.goal_reminder_notifications || false}
                    onCheckedChange={(checked) => handleNotificationChange('goal_reminder_notifications', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Segurança</CardTitle>
              <CardDescription>
                Gerencie as configurações de segurança da sua conta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Autenticação de Dois Fatores</Label>
                    <p className="text-sm text-muted-foreground">
                      Adicionar uma camada extra de segurança à sua conta
                    </p>
                  </div>
                  <Switch
                    checked={settings?.security_two_factor || false}
                    onCheckedChange={(checked) => handleSecurityChange('security_two_factor', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Alertas de Login</Label>
                    <p className="text-sm text-muted-foreground">
                      Receber alertas quando alguém fizer login na sua conta
                    </p>
                  </div>
                  <Switch
                    checked={settings?.security_login_alerts || false}
                    onCheckedChange={(checked) => handleSecurityChange('security_login_alerts', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Log de Atividades</Label>
                    <p className="text-sm text-muted-foreground">
                      Manter registro das atividades da conta
                    </p>
                  </div>
                  <Switch
                    checked={settings?.security_activity_log || false}
                    onCheckedChange={(checked) => handleSecurityChange('security_activity_log', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}