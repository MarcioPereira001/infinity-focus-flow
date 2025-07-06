import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    id: "item-1",
    question: "Como funciona o período de teste gratuito?",
    answer: "Oferecemos 7 dias de acesso completo e gratuito a todas as funcionalidades da plataforma. Não é necessário cartão de crédito para começar."
  },
  {
    id: "item-2", 
    question: "Posso usar a plataforma em equipe?",
    answer: "Sim! A Infinity Concentration foi desenvolvida tanto para uso individual quanto colaborativo. Você pode convidar membros para seus projetos e trabalhar em tempo real."
  },
  {
    id: "item-3",
    question: "Como funciona o sistema de gamificação?",
    answer: "Transformamos suas tarefas em conquistas! Você ganha pontos ao completar atividades, pode definir metas pessoais e acompanhar seu progresso através de gráficos visuais."
  },
  {
    id: "item-4",
    question: "Meus dados ficam seguros na plataforma?",
    answer: "Absolutamente. Utilizamos criptografia de ponta e seguimos as melhores práticas de segurança. Seus dados são armazenados de forma segura e nunca compartilhados com terceiros."
  },
  {
    id: "item-5",
    question: "Posso cancelar minha assinatura a qualquer momento?",
    answer: "Sim, não há fidelidade. Você pode cancelar sua assinatura a qualquer momento através das configurações da sua conta, sem taxas adicionais."
  }
];

export function FAQSection() {
  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold">
            Perguntas Frequentes
          </h2>
          <p className="text-lg text-muted-foreground">
            Tire suas dúvidas sobre a plataforma
          </p>
        </div>

        <div className="card-soft">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq) => (
              <AccordionItem key={faq.id} value={faq.id}>
                <AccordionTrigger className="text-left hover:no-underline px-6">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4">
                  <p className="text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}