import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold mb-4">Infinity Concentration</h1>
        <p className="text-xl text-muted-foreground">Redirecionando para a landing page...</p>
        <Button 
          onClick={() => window.location.href = '/'}
          className="btn-gradient"
        >
          Ir para Home
        </Button>
      </div>
    </div>
  );
};

export default Index;
