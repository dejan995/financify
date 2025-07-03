import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useState } from "react";

const COLORS = ["#0F766E", "#10B981", "#F59E0B", "#3B82F6", "#8B5CF6", "#EF4444"];

export default function SpendingChart() {
  const [period, setPeriod] = useState("this-month");
  
  const { data: categorySpending, isLoading } = useQuery({
    queryKey: ["/api/analytics/category-spending"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Spending by Category</CardTitle>
            <Skeleton className="h-9 w-32" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <Skeleton className="h-64 w-64 rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = (categorySpending || []).map((item, index) => ({
    name: item.categoryName,
    value: parseFloat(item.amount.toString()),
    color: COLORS[index % COLORS.length],
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Spending by Category</CardTitle>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this-month">This Month</SelectItem>
              <SelectItem value="last-month">Last Month</SelectItem>
              <SelectItem value="last-3-months">Last 3 Months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`$${value}`, "Amount"]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No spending data available
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
