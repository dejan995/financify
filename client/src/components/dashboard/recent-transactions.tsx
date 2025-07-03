import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatRelativeDate, getTransactionIcon } from "@/lib/utils";
import { Link } from "wouter";

export default function RecentTransactions() {
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["/api/transactions"],
  });

  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });

  const { data: accounts } = useQuery({
    queryKey: ["/api/accounts"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Transactions</CardTitle>
            <Skeleton className="h-8 w-16" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between py-3">
                <div className="flex items-center">
                  <Skeleton className="w-10 h-10 rounded-full mr-3" />
                  <div>
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const recentTransactions = (transactions || [])
    .slice(0, 6)
    .map(transaction => {
      const category = (categories || []).find(c => c.id === transaction.categoryId);
      const account = (accounts || []).find(a => a.id === transaction.accountId);
      
      return {
        ...transaction,
        categoryName: category?.name || "Unknown",
        accountName: account?.name || "Unknown",
        icon: getTransactionIcon(category?.name || ""),
      };
    });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Transactions</CardTitle>
          <Link href="/transactions">
            <Button variant="ghost" size="sm">View All</Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentTransactions.length > 0 ? recentTransactions.map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center mr-3 text-lg">
                  {transaction.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{transaction.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {transaction.categoryName} • {formatRelativeDate(transaction.date)}
                  </p>
                </div>
              </div>
              <span className={`text-sm font-medium ${
                transaction.type === "income" ? "text-accent" : "text-danger"
              }`}>
                {transaction.type === "income" ? "+" : "-"}{formatCurrency(transaction.amount)}
              </span>
            </div>
          )) : (
            <div className="text-center text-muted-foreground py-8">
              <p>No transactions yet</p>
              <p className="text-sm">Add your first transaction to get started</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
