import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Download, FileText, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useState } from "react";

export default function Reports() {
  const [selectedPeriod, setSelectedPeriod] = useState("this-month");
  const [selectedReport, setSelectedReport] = useState("overview");

  const { data: transactions } = useQuery({
    queryKey: ["/api/transactions"],
  });

  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });

  const { data: accounts } = useQuery({
    queryKey: ["/api/accounts"],
  });

  const { data: monthly } = useQuery({
    queryKey: ["/api/analytics/monthly"],
  });

  const { data: categorySpending } = useQuery({
    queryKey: ["/api/analytics/category-spending"],
  });

  // Generate trend data for the last 6 months
  const generateTrendData = () => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toISOString().slice(0, 7);
      
      const monthTransactions = (transactions || []).filter(t => 
        t.date.startsWith(monthKey)
      );
      
      const income = monthTransactions
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      const expenses = monthTransactions
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      months.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        income,
        expenses,
        net: income - expenses,
      });
    }
    return months;
  };

  const trendData = generateTrendData();
  
  // Category breakdown for chart
  const categoryData = (categorySpending || []).map(item => ({
    name: item.categoryName,
    amount: parseFloat(item.amount.toString()),
  }));

  // Top categories by spending
  const topCategories = categoryData
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // Summary statistics
  const totalIncome = (transactions || [])
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  
  const totalExpenses = (transactions || [])
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const netIncome = totalIncome - totalExpenses;
  const avgMonthlyIncome = totalIncome / 6;
  const avgMonthlyExpenses = totalExpenses / 6;

  const handleExport = (format: string) => {
    // In a real app, this would generate and download the report
    console.log(`Exporting ${selectedReport} report as ${format}`);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="text-2xl font-semibold text-foreground">Reports</h2>
          
          <div className="flex items-center space-x-4">
            <Select value={selectedReport} onValueChange={setSelectedReport}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">Financial Overview</SelectItem>
                <SelectItem value="income">Income Report</SelectItem>
                <SelectItem value="expenses">Expense Report</SelectItem>
                <SelectItem value="categories">Category Analysis</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this-month">This Month</SelectItem>
                <SelectItem value="last-month">Last Month</SelectItem>
                <SelectItem value="last-3-months">Last 3 Months</SelectItem>
                <SelectItem value="last-6-months">Last 6 Months</SelectItem>
                <SelectItem value="this-year">This Year</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={() => handleExport('pdf')}>
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Income</p>
                  <p className="text-2xl font-bold text-accent">{formatCurrency(totalIncome)}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(avgMonthlyIncome)}/month avg
                  </p>
                </div>
                <div className="p-3 bg-accent/10 rounded-full">
                  <TrendingUp className="w-6 h-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
                  <p className="text-2xl font-bold text-danger">{formatCurrency(totalExpenses)}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(avgMonthlyExpenses)}/month avg
                  </p>
                </div>
                <div className="p-3 bg-danger/10 rounded-full">
                  <TrendingDown className="w-6 h-6 text-danger" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Net Income</p>
                  <p className={`text-2xl font-bold ${netIncome >= 0 ? 'text-accent' : 'text-danger'}`}>
                    {formatCurrency(netIncome)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(netIncome / 6)}/month avg
                  </p>
                </div>
                <div className="p-3 bg-primary/10 rounded-full">
                  <DollarSign className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Savings Rate</p>
                  <p className="text-2xl font-bold text-primary">
                    {totalIncome > 0 ? ((netIncome / totalIncome) * 100).toFixed(1) : 0}%
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {netIncome >= 0 ? 'Positive savings' : 'Spending deficit'}
                  </p>
                </div>
                <div className="p-3 bg-primary/10 rounded-full">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Income vs Expenses Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Income vs Expenses Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
                    <Tooltip 
                      formatter={(value, name) => [
                        `$${Number(value).toLocaleString()}`,
                        name === "income" ? "Income" : name === "expenses" ? "Expenses" : "Net"
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
                    <Line 
                      type="monotone" 
                      dataKey="net" 
                      stroke="#0F766E" 
                      strokeWidth={2}
                      name="Net"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Top Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Top Spending Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topCategories}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
                    <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, "Amount"]} />
                    <Bar dataKey="amount" fill="#0F766E" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Categories Table */}
          <Card>
            <CardHeader>
              <CardTitle>Category Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">% of Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryData.map((category, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell className="text-right">{formatCurrency(category.amount)}</TableCell>
                      <TableCell className="text-right">
                        {totalExpenses > 0 ? ((category.amount / totalExpenses) * 100).toFixed(1) : 0}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Monthly Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">Income</TableHead>
                    <TableHead className="text-right">Expenses</TableHead>
                    <TableHead className="text-right">Net</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trendData.map((month, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{month.month}</TableCell>
                      <TableCell className="text-right text-accent">
                        {formatCurrency(month.income)}
                      </TableCell>
                      <TableCell className="text-right text-danger">
                        {formatCurrency(month.expenses)}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${
                        month.net >= 0 ? 'text-accent' : 'text-danger'
                      }`}>
                        {formatCurrency(month.net)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
