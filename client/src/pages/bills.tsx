import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Bell, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import BillForm from "@/components/forms/bill-form";

export default function Bills() {
  const [showForm, setShowForm] = useState(false);
  const [editingBill, setEditingBill] = useState(null);

  const { data: bills, isLoading } = useQuery({
    queryKey: ["/api/bills"],
  });

  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });

  const { data: accounts } = useQuery({
    queryKey: ["/api/accounts"],
  });

  const enrichedBills = (bills || []).map(bill => {
    const category = (categories || []).find(c => c.id === bill.categoryId);
    const account = (accounts || []).find(a => a.id === bill.accountId);
    const dueDate = new Date(bill.dueDate);
    const today = new Date();
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    let status = "upcoming";
    if (bill.isPaid) {
      status = "paid";
    } else if (daysUntilDue < 0) {
      status = "overdue";
    } else if (daysUntilDue <= 3) {
      status = "due-soon";
    }

    return {
      ...bill,
      categoryName: category?.name || "Unknown",
      accountName: account?.name || "Unknown",
      daysUntilDue,
      status,
      amount: parseFloat(bill.amount),
    };
  });

  const upcomingBills = enrichedBills.filter(b => !b.isPaid && b.daysUntilDue >= 0);
  const overdueBills = enrichedBills.filter(b => !b.isPaid && b.daysUntilDue < 0);
  const paidBills = enrichedBills.filter(b => b.isPaid);
  const totalUpcoming = upcomingBills.reduce((sum, bill) => sum + bill.amount, 0);
  const totalOverdue = overdueBills.reduce((sum, bill) => sum + bill.amount, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-accent text-accent-foreground">Paid</Badge>;
      case "overdue":
        return <Badge variant="destructive">Overdue</Badge>;
      case "due-soon":
        return <Badge className="bg-warning text-warning-foreground">Due Soon</Badge>;
      default:
        return <Badge variant="secondary">Upcoming</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="w-4 h-4 text-accent" />;
      case "overdue":
        return <AlertTriangle className="w-4 h-4 text-destructive" />;
      case "due-soon":
        return <Clock className="w-4 h-4 text-warning" />;
      default:
        return <Bell className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="text-2xl font-semibold text-foreground">Bill Reminders</h2>
          <Button onClick={() => {
            setEditingBill(null);
            setShowForm(true);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Bill
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Bills</p>
                  <p className="text-2xl font-bold text-foreground">{enrichedBills.length}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-full">
                  <Bell className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Upcoming Amount</p>
                  <p className="text-2xl font-bold text-warning">{formatCurrency(totalUpcoming)}</p>
                </div>
                <div className="p-3 bg-warning/10 rounded-full">
                  <Clock className="w-6 h-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Overdue Amount</p>
                  <p className="text-2xl font-bold text-destructive">{formatCurrency(totalOverdue)}</p>
                </div>
                <div className="p-3 bg-danger/10 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Paid This Month</p>
                  <p className="text-2xl font-bold text-accent">{paidBills.length}</p>
                </div>
                <div className="p-3 bg-accent/10 rounded-full">
                  <CheckCircle className="w-6 h-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bills Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Bills</CardTitle>
          </CardHeader>
          <CardContent>
            {enrichedBills.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bill Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrichedBills
                      .sort((a, b) => {
                        if (a.status === "overdue" && b.status !== "overdue") return -1;
                        if (b.status === "overdue" && a.status !== "overdue") return 1;
                        if (a.status === "due-soon" && b.status === "upcoming") return -1;
                        if (b.status === "due-soon" && a.status === "upcoming") return 1;
                        return a.daysUntilDue - b.daysUntilDue;
                      })
                      .map((bill) => (
                        <TableRow key={bill.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div className="flex items-center">
                              {getStatusIcon(bill.status)}
                              <div className="ml-3">
                                <div className="font-medium">{bill.name}</div>
                                {bill.notes && (
                                  <div className="text-sm text-muted-foreground">
                                    {bill.notes}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{bill.categoryName}</TableCell>
                          <TableCell>{bill.accountName}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{formatDate(bill.dueDate)}</div>
                              {!bill.isPaid && (
                                <div className={`text-sm ${
                                  bill.daysUntilDue < 0 
                                    ? "text-destructive" 
                                    : bill.daysUntilDue <= 3 
                                      ? "text-warning" 
                                      : "text-muted-foreground"
                                }`}>
                                  {bill.daysUntilDue < 0 
                                    ? `${Math.abs(bill.daysUntilDue)} days overdue`
                                    : bill.daysUntilDue === 0
                                      ? "Due today"
                                      : `${bill.daysUntilDue} days left`
                                  }
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(bill.amount)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(bill.status)}
                          </TableCell>
                          <TableCell className="capitalize">
                            {bill.frequency}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingBill(bill);
                                setShowForm(true);
                              }}
                            >
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No bills added yet</p>
                <p className="text-sm text-muted-foreground mb-6">
                  Add your recurring bills to never miss a payment
                </p>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Bill
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bill Form Modal */}
      {showForm && (
        <BillForm
          bill={editingBill}
          onClose={() => {
            setShowForm(false);
            setEditingBill(null);
          }}
        />
      )}
    </div>
  );
}
