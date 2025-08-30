import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Transactions from "@/pages/transactions";
import Budgets from "@/pages/budgets";
import Goals from "@/pages/goals";
import Accounts from "@/pages/accounts";
import Bills from "@/pages/bills";
import Categories from "@/pages/categories";
import Products from "@/pages/products";
import Reports from "@/pages/reports";
import Scanner from "@/pages/scanner";
import Admin from "@/pages/admin";
import DatabaseManagement from "@/pages/database-management";
import AuthPage from "@/pages/auth-page";
import InitializationWizard from "@/pages/initialization-wizard";
import Sidebar from "@/components/layout/sidebar";

function AuthenticatedLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Switch>
          <ProtectedRoute path="/" component={Dashboard} />
          <ProtectedRoute path="/transactions" component={Transactions} />
          <ProtectedRoute path="/budgets" component={Budgets} />
          <ProtectedRoute path="/goals" component={Goals} />
          <ProtectedRoute path="/accounts" component={Accounts} />
          <ProtectedRoute path="/bills" component={Bills} />
          <ProtectedRoute path="/categories" component={Categories} />
          <ProtectedRoute path="/products" component={Products} />
          <ProtectedRoute path="/reports" component={Reports} />
          <ProtectedRoute path="/scanner" component={Scanner} />
          <ProtectedRoute path="/admin" component={Admin} />
          <ProtectedRoute path="/admin/databases" component={DatabaseManagement} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function AuthenticatedApp() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route>
        {user ? <AuthenticatedLayout /> : <AuthPage />}
      </Route>
    </Switch>
  );
}

function AppContent() {
  const { data: initStatus, isLoading } = useQuery({
    queryKey: ["/api/initialization/status"],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!initStatus || !initStatus.isInitialized) {
    return (
      <InitializationWizard
        onComplete={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/initialization/status"] });
        }}
      />
    );
  }

  return <AuthenticatedApp />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <AppContent />
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
