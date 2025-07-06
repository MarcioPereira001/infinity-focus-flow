import { Button } from "@/components/ui/button";

interface HeaderProps {
  isLoggedIn?: boolean;
  onLogout?: () => void;
}

export function Header({ isLoggedIn = false, onLogout }: HeaderProps) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isLoggedIn) {
    return (
      <header className="fixed top-0 w-full z-50 glass border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div 
            className="text-2xl font-bold gradient-text cursor-pointer"
            onClick={scrollToTop}
          >
            Infinity Concentration
          </div>
          
          <Button variant="ghost" onClick={scrollToTop}>
            Entrar
          </Button>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="text-2xl font-bold gradient-text">
          Infinity Concentration
        </div>
        
        <Button variant="ghost" onClick={onLogout}>
          Sair
        </Button>
      </div>
    </header>
  );
}