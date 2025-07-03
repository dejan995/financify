import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useState } from "react";

export default function TrendChart() {
  const [period, setPeriod] = useState("6-months");
  
  const { data: monthly, isLoading } = useQuery({
    queryKey: ["/api/analytics/monthly"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Income vs Expenses</CardTitle>
            <Skeleton className="h-9 w-32" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  // Generate sample trend data for the last 6 months
  const generateTrendData = () => {
    const months = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentIncome = monthly?.income || 6250;
    const currentExpenses = monthly?.expenses || 4823;
    
    return months.map((month, index) => ({
      month,
      income: currentIncome + (Math.random() - 0.5) * 500,
      expenses: currentExpenses + (Math.random() - 0.5) * 400,
    }));
  };

  const chartData = generateTrendData();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Income vs Expenses</CardTitle>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6-months">Last 6 Months</SelectItem>
              <SelectItem value="1-year">Last Year</SelectItem>
              <SelectItem value="all-time">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
              <Tooltip 
                formatter={(value, name) => [
                  `$${Number(value).toLocaleString()}`,
                  name === "income" ? "Income" : "Expenses"
                ]}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="income" 
                stroke="#10B981" 
                strokeWidth={2}
                name="Income"
              />
              <Line 
                type="monotone" 
                dataKey="expenses" 
                stroke="#EF4444" 
                strokeWidth={2}
                name="Expenses"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
