
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  FolderKanban, 
  Target, 
  BarChart3, 
  Settings, 
  Trash2 
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Projetos", href: "/projects", icon: FolderKanban },
  { name: "Metas", href: "/analytics", icon: Target },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Lixeira", href: "/trash", icon: Trash2 },
  { name: "Configurações", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 bg-card border-r border-border">
      <div className="p-6">
        <Link to="/dashboard" className="flex items-center space-x-2">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="font-bold text-primary-foreground">T</span>
          </div>
          <span className="text-xl font-bold">TaskFlow</span>
        </Link>
      </div>
      
      <nav className="px-4 pb-4">
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
                    isActive && "bg-secondary"
                  )}
                >
                  <Link to={item.href}>
                    <item.icon className="mr-3 h-4 w-4" />
                    {item.name}
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
