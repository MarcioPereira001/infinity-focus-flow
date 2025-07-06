import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";

export function CTASection() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-4xl text-center">
        <div className="card-soft p-12 md:p-16 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5" />
          
          <div className="relative space-y-8">
            <h2 className="text-3xl md:text-5xl font-bold leading-tight">
              Pronto para transformar sua{" "}
              <span className="gradient-text">produtividade</span>?
            </h2>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Junte-se a milhares de usuários que já descobriram o poder de uma gestão de tempo eficiente e organizada.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                className="btn-gradient text-lg px-8 py-6"
                onClick={scrollToTop}
              >
                Começar Agora
                <ArrowUp className="ml-2 w-5 h-5" />
              </Button>
              
              <p className="text-sm text-muted-foreground">
                7 dias grátis • Sem cartão de crédito
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}