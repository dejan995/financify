import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
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
import AuthPage from "@/pages/auth-page";
import Sidebar from "@/components/layout/sidebar";

function AuthenticatedApp() {
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
          <Route path="/auth" component={AuthPage} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <AuthenticatedApp />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
