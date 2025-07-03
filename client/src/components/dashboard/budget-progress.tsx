import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, calculatePercentage } from "@/lib/utils";
import { Link } from "wouter";

export default function BudgetProgress() {
  const { data: budgets, isLoading: budgetsLoading } = useQuery({
    queryKey: ["/api/budgets"],
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/transactions"],
  });

  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });

  const isLoading = budgetsLoading || transactionsLoading;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Budget Progress</CardTitle>
            <Skeleton className="h-8 w-16" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="border-b border-gray-100 pb-4 last:border-b-0">
                <div className="flex justify-between items-center mb-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-2 w-full mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

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
      id: budget.id,
      categoryName: category?.name || "Unknown",
      spent,
      budget: budgetAmount,
      remaining,
      percentage,
      isOverBudget: spent > budgetAmount,
    };
  }).slice(0, 4); // Show only first 4 budgets

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Budget Progress</CardTitle>
          <Link href="/budgets">
            <Button variant="ghost" size="sm">View All</Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {budgetProgress.length > 0 ? budgetProgress.map((item) => (
            <div key={item.id} className="border-b border-gray-100 pb-4 last:border-b-0">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-foreground">{item.categoryName}</span>
                <span className="text-sm text-muted-foreground">
                  {formatCurrency(item.spent)} / {formatCurrency(item.budget)}
                </span>
              </div>
              <Progress 
                value={Math.min(item.percentage, 100)} 
                className="h-2 mb-1"
              />
              <p className={`text-xs ${
                item.isOverBudget 
                  ? "text-danger" 
                  : item.percentage > 80 
                    ? "text-warning" 
                    : "text-muted-foreground"
              }`}>
                {item.isOverBudget 
                  ? `${formatCurrency(Math.abs(item.remaining))} over budget`
                  : `${formatCurrency(item.remaining)} remaining`
                }
              </p>
            </div>
          )) : (
            <div className="text-center text-muted-foreground py-8">
              <p>No budgets set yet</p>
              <Link href="/budgets">
                <Button variant="outline" size="sm" className="mt-2">
                  Create Budget
                </Button>
              </Link>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
