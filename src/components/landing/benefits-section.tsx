import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Users, Trophy, Target } from "lucide-react";

const benefits = [
  {
    icon: CheckCircle,
    title: "Gestão Unificada",
    description: "Centralize todas as suas tarefas e projetos em um só lugar, com visualizações intuitivas e organizadas."
  },
  {
    icon: Users,
    title: "Colaboração em Tempo Real",
    description: "Trabalhe em equipe de forma eficiente com atualizações instantâneas e comunicação integrada."
  },
  {
    icon: Trophy,
    title: "Gamificação Motivadora",
    description: "Mantenha-se motivado com sistema de conquistas, metas e acompanhamento de progresso visual."
  },
  {
    icon: Target,
    title: "Metas e Objetivos Claros",
    description: "Defina e acompanhe seus objetivos com métricas precisas e relatórios detalhados de evolução."
  }
];

export function BenefitsSection() {
  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold">
            Por que escolher a{" "}
            <span className="gradient-text">Infinity Concentration</span>?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Descubra os benefícios que farão a diferença na sua produtividade e organização pessoal.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => (
            <Card 
              key={benefit.title} 
              className="card-hover text-center group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader>
                <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <benefit.icon className="w-8 h-8 text-primary-foreground" />
                </div>
                <CardTitle className="text-xl">{benefit.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {benefit.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}