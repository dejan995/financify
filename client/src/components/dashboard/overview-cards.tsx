import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, DollarSign, PiggyBank } from "lucide-react";

export default function OverviewCards() {
  const { data: balance, isLoading: balanceLoading } = useQuery({
    queryKey: ["/api/analytics/balance"],
  });

  const { data: monthly, isLoading: monthlyLoading } = useQuery({
    queryKey: ["/api/analytics/monthly"],
  });

  const isLoading = balanceLoading || monthlyLoading;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const totalBalance = balance?.balance || 0;
  const income = monthly?.income || 0;
  const expenses = monthly?.expenses || 0;
  const savings = monthly?.savings || 0;
  const savingsRate = income > 0 ? (savings / income) * 100 : 0;

  const cards = [
    {
      title: "Total Balance",
      value: formatCurrency(totalBalance),
      change: "+2.5% from last month",
      changeType: "positive" as const,
      icon: DollarSign,
      color: "text-accent",
    },
    {
      title: "Monthly Income",
      value: formatCurrency(income),
      change: "+8.2% from last month",
      changeType: "positive" as const,
      icon: TrendingUp,
      color: "text-accent",
    },
    {
      title: "Monthly Expenses",
      value: formatCurrency(expenses),
      change: "+12.3% from last month",
      changeType: "negative" as const,
      icon: TrendingDown,
      color: "text-danger",
    },
    {
      title: "Savings Rate",
      value: `${savingsRate.toFixed(1)}%`,
      change: savingsRate >= 20 ? "Above recommended 20%" : "Below recommended 20%",
      changeType: savingsRate >= 20 ? "positive" as const : "negative" as const,
      icon: PiggyBank,
      color: "text-accent",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card) => (
        <Card key={card.title} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                <p className="text-2xl font-bold text-foreground">{card.value}</p>
                <p className={`text-sm ${
                  card.changeType === "positive" ? "text-accent" : "text-danger"
                }`}>
                  {card.change}
                </p>
              </div>
              <div className={`p-3 rounded-full ${card.color} bg-opacity-10`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
