import { useQuery } from "@tanstack/react-query";
import OverviewCards from "@/components/dashboard/overview-cards";
import SpendingChart from "@/components/dashboard/spending-chart";
import TrendChart from "@/components/dashboard/trend-chart";
import BudgetProgress from "@/components/dashboard/budget-progress";
import RecentTransactions from "@/components/dashboard/recent-transactions";
import { Button } from "@/components/ui/button";
import { Plus, Bell } from "lucide-react";
import { useState } from "react";
import TransactionForm from "@/components/forms/transaction-form";

export default function Dashboard() {
  const [showTransactionForm, setShowTransactionForm] = useState(false);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="text-2xl font-semibold text-foreground">Dashboard</h2>
          
          <div className="flex items-center space-x-4">
            <Button onClick={() => setShowTransactionForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Transaction
            </Button>
            
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {/* Overview Cards */}
        <OverviewCards />

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <SpendingChart />
          <TrendChart />
        </div>

        {/* Budget and Transactions Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <BudgetProgress />
          <div className="lg:col-span-2">
            <RecentTransactions />
          </div>
        </div>
      </div>

      {/* Transaction Form Modal */}
      {showTransactionForm && (
        <TransactionForm onClose={() => setShowTransactionForm(false)} />
      )}
    </div>
  );
}
