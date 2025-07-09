import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Trophy, Star, Award, Zap, Target, CheckCircle, Clock, Medal } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useGamification } from "@/hooks/useGamification";
import { toast } from "@/hooks/use-toast";

export default function Gamification() {
  const { user } = useAuth();
  const { userStats, achievements, badges, levels, loading } = useGamification();
  
  // Calcular progresso para o próximo nível
  const levelProgress = userStats.next_level_xp > 0 ? (userStats.xp / userStats.next_level_xp) * 100 : 0;
  
  // Encontrar o próximo nível
  const currentLevelData = levels.find(l => l.level === userStats.level);
  const nextLevelData = levels.find(l => l.level === userStats.level + 1);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Gamificação</h1>
        <p className="text-muted-foreground">
          Acompanhe seu progresso, conquistas e recompensas
        </p>
      </div>
      
      {/* Cartão de Nível e XP */}
      <Card className="card-soft">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle>Nível {userStats.level}: {currentLevelData?.title}</CardTitle>
            <Badge variant="outline" className="bg-primary/10 text-primary">
              {userStats.xp} XP
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso para Nível {userStats.level + 1}</span>
                <span>{userStats.xp} / {userStats.next_level_xp} XP</span>
              </div>
              <Progress value={levelProgress} className="h-2" />
            </div>
            
            {nextLevelData && (
              <div className="text-sm">
                <p className="font-medium">Próximo nível: {nextLevelData.title}</p>
                <p className="text-muted-foreground">Recompensas:</p>
                <ul className="text-muted-foreground mt-1">
                  {nextLevelData.rewards.map((reward, index) => (
                    <li key={index}>• {reward}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="card-soft">
          <CardHeader className="pb-2">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-warning" />
              <CardTitle className="text-base">Streak Atual</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{userStats.streak} dias</div>
            <p className="text-sm text-muted-foreground">Sequência de produtividade</p>
          </CardContent>
        </Card>
        
        <Card className="card-soft">
          <CardHeader className="pb-2">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-success" />
              <CardTitle className="text-base">Tarefas Concluídas</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{userStats.tasks_completed}</div>
            <p className="text-sm text-muted-foreground">Total de tarefas finalizadas</p>
          </CardContent>
        </Card>
        
        <Card className="card-soft">
          <CardHeader className="pb-2">
            <div className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Projetos Concluídos</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{userStats.projects_completed}</div>
            <p className="text-sm text-muted-foreground">Total de projetos finalizados</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Abas de Conquistas e Badges */}
      <Tabs defaultValue="achievements" className="space-y-6">
        <TabsList>
          <TabsTrigger value="achievements">Conquistas</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="levels">Níveis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="achievements" className="space-y-4">
          {achievements.map((achievement) => (
            <Card 
              key={achievement.id} 
              className={`card-soft ${achievement.unlocked ? 'border-success/30' : ''}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${achievement.unlocked ? 'bg-success/10' : 'bg-primary/10'}`}>
                      <achievement.icon className={`h-5 w-5 ${achievement.unlocked ? 'text-success' : 'text-primary'}`} />
                    </div>
                    <div>
                      <CardTitle className="text-base">{achievement.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    </div>
                  </div>
                  {achievement.unlocked && (
                    <Badge variant="outline" className="bg-success/10 text-success">
                      Desbloqueado
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progresso</span>
                    <span>{achievement.progress}%</span>
                  </div>
                  <Progress value={achievement.progress} className="h-2" />
                  {achievement.unlocked_at && (
                    <p className="text-xs text-muted-foreground">
                      Desbloqueado em {new Date(achievement.unlocked_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        
        <TabsContent value="badges" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {badges.map((badge) => {
            // Definir cores com base na raridade
            let rarityColor = '';
            let bgColor = '';
            
            switch (badge.rarity) {
              case 'common':
                rarityColor = 'text-slate-500';
                bgColor = 'bg-slate-100';
                break;
              case 'rare':
                rarityColor = 'text-blue-500';
                bgColor = 'bg-blue-100';
                break;
              case 'epic':
                rarityColor = 'text-purple-500';
                bgColor = 'bg-purple-100';
                break;
              case 'legendary':
                rarityColor = 'text-amber-500';
                bgColor = 'bg-amber-100';
                break;
            }
            
            return (
              <Card 
                key={badge.id} 
                className={`card-soft ${badge.unlocked ? '' : 'opacity-60'}`}
              >
                <CardContent className="pt-6 text-center">
                  <div className="flex flex-col items-center">
                    <div className={`p-4 rounded-full ${badge.unlocked ? bgColor : 'bg-muted'} mb-4`}>
                      <badge.icon className={`h-8 w-8 ${badge.unlocked ? rarityColor : 'text-muted-foreground'}`} />
                    </div>
                    <h3 className="font-medium text-lg mb-1">{badge.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{badge.description}</p>
                    <Badge 
                      variant="outline" 
                      className={badge.unlocked ? `${bgColor} ${rarityColor}` : 'bg-muted text-muted-foreground'}
                    >
                      {badge.rarity.charAt(0).toUpperCase() + badge.rarity.slice(1)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
        
        <TabsContent value="levels" className="space-y-6">
          {levels.map((level, index) => (
            <Card 
              key={level.level} 
              className={`card-soft ${level.level === userStats.level ? 'border-primary' : level.level < userStats.level ? 'border-success/30' : ''}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className={`${level.level === userStats.level ? 'bg-primary/10 text-primary' : level.level < userStats.level ? 'bg-success/10 text-success' : ''}`}>
                      Nível {level.level}
                    </Badge>
                    <CardTitle>{level.title}</CardTitle>
                  </div>
                  {level.level === userStats.level && (
                    <Badge variant="outline" className="bg-primary/10 text-primary">
                      Atual
                    </Badge>
                  )}
                  {level.level < userStats.level && (
                    <Badge variant="outline" className="bg-success/10 text-success">
                      Concluído
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">XP necessário:</span> {level.xp_required} XP
                  </p>
                  <div>
                    <p className="text-sm font-medium">Recompensas:</p>
                    <ul className="text-sm text-muted-foreground mt-1">
                      {level.rewards.map((reward, rewardIndex) => (
                        <li key={rewardIndex}>• {reward}</li>
                      ))}
                    </ul>
                  </div>
                  
                  {level.level === userStats.level && (
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progresso para Nível {level.level + 1}</span>
                        <span>{userStats.xp} / {userStats.next_level_xp} XP</span>
                      </div>
                      <Progress value={levelProgress} className="h-2" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
