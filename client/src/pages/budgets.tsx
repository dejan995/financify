import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Plus } from "lucide-react";
import { formatCurrency, calculatePercentage } from "@/lib/utils";
import BudgetForm from "@/components/forms/budget-form";

export default function Budgets() {
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);

  const { data: budgets, isLoading } = useQuery({
    queryKey: ["/api/budgets"],
  });

  const { data: transactions } = useQuery({
    queryKey: ["/api/transactions"],
  });

  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Calculate spending for each budget
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthlyTransactions = (transactions || []).filter(t => 
    t.type === "expense" && t.date.startsWith(currentMonth)
  );

  const budgetProgress = (budgets || []).map(budget => {
    const category = (categories || []).find(c => c.id === budget.categoryId);
    const spent = monthlyTransactions
      .filter(t => t.categoryId === budget.categoryId)
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const budgetAmount = parseFloat(budget.amount);
    const percentage = calculatePercentage(spent, budgetAmount);
    const remaining = budgetAmount - spent;

    return {
      ...budget,
      categoryName: category?.name || "Unknown",
      categoryColor: category?.color || "#6B7280",
      spent,
      budgetAmount,
      remaining,
      percentage,
      isOverBudget: spent > budgetAmount,
    };
  });

  const totalBudget = budgetProgress.reduce((sum, b) => sum + b.budgetAmount, 0);
  const totalSpent = budgetProgress.reduce((sum, b) => sum + b.spent, 0);
  const totalRemaining = totalBudget - totalSpent;
  const overallPercentage = calculatePercentage(totalSpent, totalBudget);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="text-2xl font-semibold text-foreground">Budgets</h2>
          <Button onClick={() => {
            setEditingBudget(null);
            setShowForm(true);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Create Budget
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {/* Overview Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Budget Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Budget</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(totalBudget)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Spent</p>
                <p className="text-2xl font-bold text-danger">{formatCurrency(totalSpent)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Remaining</p>
                <p className={`text-2xl font-bold ${totalRemaining >= 0 ? "text-accent" : "text-danger"}`}>
                  {formatCurrency(totalRemaining)}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Overall Progress</span>
                <span>{overallPercentage}%</span>
              </div>
              <Progress value={Math.min(overallPercentage, 100)} className="h-3" />
            </div>
          </CardContent>
        </Card>

        {/* Budget Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgetProgress.map((budget) => (
            <Card key={budget.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{budget.categoryName}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingBudget(budget);
                      setShowForm(true);
                    }}
                  >
                    Edit
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {formatCurrency(budget.spent)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        of {formatCurrency(budget.budgetAmount)}
                      </p>
                    </div>
                    <div className={`text-right ${
                      budget.isOverBudget ? "text-danger" : "text-muted-foreground"
                    }`}>
                      <p className="text-sm font-medium">
                        {budget.percentage}%
                      </p>
                    </div>
                  </div>
                  
                  <Progress 
                    value={Math.min(budget.percentage, 100)} 
                    className="h-2"
                  />
                  
                  <p className={`text-sm ${
                    budget.isOverBudget 
                      ? "text-danger" 
                      : budget.percentage > 80 
                        ? "text-warning" 
                        : "text-accent"
                  }`}>
                    {budget.isOverBudget 
                      ? `${formatCurrency(Math.abs(budget.remaining))} over budget`
                      : `${formatCurrency(budget.remaining)} remaining`
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}

          {budgetProgress.length === 0 && (
            <Card className="col-span-full">
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground mb-4">No budgets created yet</p>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Budget
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Budget Form Modal */}
      {showForm && (
        <BudgetForm
          budget={editingBudget}
          onClose={() => {
            setShowForm(false);
            setEditingBudget(null);
          }}
        />
      )}
    </div>
  );
}
