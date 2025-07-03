import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, CreditCard, Wallet, PiggyBank, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import AccountForm from "@/components/forms/account-form";

const accountTypeIcons = {
  checking: Wallet,
  savings: PiggyBank,
  credit: CreditCard,
  investment: TrendingUp,
};

const accountTypeColors = {
  checking: "bg-blue-100 text-blue-800",
  savings: "bg-green-100 text-green-800",
  credit: "bg-orange-100 text-orange-800",
  investment: "bg-purple-100 text-purple-800",
};

export default function Accounts() {
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);

  const { data: accounts, isLoading } = useQuery({
    queryKey: ["/api/accounts"],
  });

  const enrichedAccounts = (accounts || []).map(account => ({
    ...account,
    balance: parseFloat(account.balance),
  }));

  const activeAccounts = enrichedAccounts.filter(a => a.isActive);
  const totalBalance = activeAccounts.reduce((sum, account) => sum + account.balance, 0);
  const positiveBalance = activeAccounts
    .filter(a => a.balance > 0)
    .reduce((sum, account) => sum + account.balance, 0);
  const negativeBalance = activeAccounts
    .filter(a => a.balance < 0)
    .reduce((sum, account) => sum + Math.abs(account.balance), 0);

  const accountsByType = activeAccounts.reduce((acc, account) => {
    acc[account.type] = (acc[account.type] || []);
    acc[account.type].push(account);
    return acc;
  }, {} as Record<string, typeof activeAccounts>);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="text-2xl font-semibold text-gray-800">Accounts</h2>
          <Button onClick={() => {
            setEditingAccount(null);
            setShowForm(true);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Account
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
                  <p className="text-sm font-medium text-muted-foreground">Net Worth</p>
                  <p className={`text-2xl font-bold ${totalBalance >= 0 ? 'text-accent' : 'text-danger'}`}>
                    {formatCurrency(totalBalance)}
                  </p>
                </div>
                <div className="p-3 bg-primary/10 rounded-full">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Assets</p>
                  <p className="text-2xl font-bold text-accent">{formatCurrency(positiveBalance)}</p>
                </div>
                <div className="p-3 bg-accent/10 rounded-full">
                  <Wallet className="w-6 h-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Debt</p>
                  <p className="text-2xl font-bold text-danger">{formatCurrency(negativeBalance)}</p>
                </div>
                <div className="p-3 bg-danger/10 rounded-full">
                  <CreditCard className="w-6 h-6 text-danger" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Accounts</p>
                  <p className="text-2xl font-bold text-foreground">{activeAccounts.length}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-full">
                  <CreditCard className="w-6 h-6 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Accounts by Type */}
        <div className="space-y-6">
          {Object.entries(accountsByType).map(([type, typeAccounts]) => {
            const Icon = accountTypeIcons[type as keyof typeof accountTypeIcons] || CreditCard;
            const typeBalance = typeAccounts.reduce((sum, acc) => sum + acc.balance, 0);
            
            return (
              <div key={type}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Icon className="w-5 h-5 mr-2 text-muted-foreground" />
                    <h3 className="text-lg font-semibold capitalize">{type} Accounts</h3>
                    <span className="ml-3 text-sm text-muted-foreground">
                      {formatCurrency(typeBalance)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {typeAccounts.map((account) => (
                    <Card key={account.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{account.name}</CardTitle>
                            <Badge 
                              variant="secondary" 
                              className={accountTypeColors[account.type as keyof typeof accountTypeColors]}
                            >
                              {account.type.charAt(0).toUpperCase() + account.type.slice(1)}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingAccount(account);
                              setShowForm(true);
                            }}
                          >
                            Edit
                          </Button>
                        </div>
                      </CardHeader>
                      
                      <CardContent>
                        <div className="space-y-2">
                          <div>
                            <p className="text-sm text-muted-foreground">Current Balance</p>
                            <p className={`text-2xl font-bold ${
                              account.balance >= 0 ? 'text-accent' : 'text-danger'
                            }`}>
                              {formatCurrency(account.balance)}
                            </p>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>Status</span>
                            <Badge variant={account.isActive ? "default" : "secondary"}>
                              {account.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {activeAccounts.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No accounts added yet</p>
              <p className="text-sm text-muted-foreground mb-6">
                Add your bank accounts, credit cards, and investment accounts to track your finances
              </p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Account
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Account Form Modal */}
      {showForm && (
        <AccountForm
          account={editingAccount}
          onClose={() => {
            setShowForm(false);
            setEditingAccount(null);
          }}
        />
      )}
    </div>
  );
}
