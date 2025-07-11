import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  FolderKanban, 
  Target, 
  BarChart3, 
  Settings, 
  Trash2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useState } from "react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Projetos", href: "/projects", icon: FolderKanban },
  { name: "Metas", href: "/analytics", icon: Target },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Lixeira", href: "/trash", icon: Trash2 },
  { name: "Configurações", href: "/settings", icon: Settings },
];

export function MainSidebar() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside 
      className={cn(
        "h-screen bg-card border-r border-border transition-all duration-300 ease-in-out relative",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header com logo */}
      <div className={cn("p-6", isCollapsed && "p-4")}>
        <Link to="/dashboard" className="flex items-center space-x-2">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="font-bold text-primary-foreground">T</span>
          </div>
          {!isCollapsed && (
            <span className="text-xl font-bold">TaskFlow</span>
          )}
        </Link>
      </div>
      
      {/* Botão de recolher/expandir */}
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "absolute top-6 -right-3 h-6 w-6 rounded-full border bg-background shadow-md transition-all duration-300",
          "hover:bg-accent z-10"
        )}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </Button>
      
      {/* Navegação */}
      <nav className={cn("px-4 pb-4", isCollapsed && "px-2")}>
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <li key={item.name}>
                <Button
                  asChild
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    isActive && "bg-secondary",
                    isCollapsed && "px-2"
                  )}
                >
                  <Link 
                    to={item.href}
                    className={cn(
                      "flex items-center",
                      isCollapsed ? "justify-center" : "justify-start"
                    )}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <item.icon className={cn("h-4 w-4", !isCollapsed && "mr-3")} />
                    {!isCollapsed && <span>{item.name}</span>}
                  </Link>
                </Button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}