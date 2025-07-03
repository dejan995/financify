import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  LayoutDashboard, 
  Receipt, 
  Target, 
  CreditCard, 
  Bell, 
  BarChart3, 
  ScanLine,
  PiggyBank,
  Menu,
  X,
  Package,
  FolderTree,
  Settings,
  LogOut,
  User
} from "lucide-react";
import { useState } from "react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Transactions", href: "/transactions", icon: Receipt },
  { name: "Budgets", href: "/budgets", icon: PiggyBank },
  { name: "Goals", href: "/goals", icon: Target },
  { name: "Accounts", href: "/accounts", icon: CreditCard },
  { name: "Bill Reminders", href: "/bills", icon: Bell },
  { name: "Categories", href: "/categories", icon: FolderTree },
  { name: "Products", href: "/products", icon: Package },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Receipt Scanner", href: "/scanner", icon: ScanLine },
  { name: "Admin", href: "/admin", icon: Settings },
];

export default function Sidebar() {
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout", {});
    },
    onSuccess: () => {
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });
      window.location.reload();
    },
    onError: (error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Filter navigation based on user role
  const filteredNavigation = navigation.filter(item => {
    if (item.name === "Admin") {
      return isAdmin;
    }
    return true;
  });

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "bg-sidebar border-r border-sidebar-border w-64 fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
        isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="flex items-center justify-center h-16 px-6 border-b border-sidebar-border">
          <img 
            src="/logo.svg" 
            alt="FinanceTracker Pro" 
            className="h-14 w-auto object-contain"
          />
        </div>
        
        <nav className="mt-6 px-3 space-y-1">
          {filteredNavigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <div 
                  className={cn(
                    "flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors cursor-pointer",
                    isActive 
                      ? "bg-sidebar-primary/10 text-sidebar-primary border-r-2 border-sidebar-primary" 
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                  onClick={() => setIsMobileOpen(false)}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>
        
        <div className="absolute bottom-0 w-full p-4 border-t border-sidebar-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-sidebar-primary rounded-full flex items-center justify-center text-sidebar-primary-foreground text-sm font-medium">
                {user?.username ? user.username.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-sidebar-foreground">{user?.name || user?.username}</p>
                <p className="text-xs text-sidebar-foreground/60 capitalize">{user?.role || "User"}</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              className="flex-1 justify-start text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {logoutMutation.isPending ? "Logging out..." : "Logout"}
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
