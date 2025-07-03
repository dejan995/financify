import React, { useState, useContext } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { ShoppingCart, PlusCircle, Edit, Trash2, Repeat, Loader2, BarChart2, CreditCard } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { AppContext } from '@/contexts/AppContext';
import ExpenseDialog from '@/components/expenses/ExpenseDialog';
import CurrencyInfoBanner from '@/components/dashboard/CurrencyInfoBanner';
import ReportCard from '@/components/reports/ReportCard';
import { supabase } from '@/lib/customSupabaseClient';

const ExpensesPage = () => {
  const { toast } = useToast();
  const { 
    expenses, creditCards, services,
    expensesCurrency, formatCurrencyWithConversion,
    enableCurrencyConversion, defaultCurrency, getExchangeRatesInfo,
    refreshAppData, categories
  } = useContext(AppContext);

  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentExpense, setCurrentExpense] = useState(null);

  const handleAdd = () => {
    setCurrentExpense(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (expense) => {
    setCurrentExpense(expense);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) return;

    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) {
      toast({ title: "Error deleting expense", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Expense Deleted" });
      refreshAppData();
    }
  };

  const handleSaveSuccess = () => {
    setIsDialogOpen(false);
    refreshAppData();
  };
  
  const sortedExpenses = [...expenses].sort((a, b) => new Date(b.expense_date) - new Date(a.expense_date));

  return (
    <>
      <Helmet>
        <title>Expenses - Financify</title>
        <meta name="description" content="Track and manage your expenses." />
      </Helmet>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-500">Expenses</h1>
          <Button className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white" onClick={handleAdd}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Expense
          </Button>
        </div>

        <CurrencyInfoBanner 
          enableCurrencyConversion={enableCurrencyConversion}
          defaultCurrency={defaultCurrency}
          exchangeRatesInfo={getExchangeRatesInfo()}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="glassmorphism border-orange-500/30">
              <CardHeader>
                <CardTitle className="text-xl text-slate-200">Expense List</CardTitle>
                <CardDescription className="text-slate-400">Default currency for new entries: {expensesCurrency}</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : expenses.length === 0 ? (
                  <div className="text-center py-10">
                    <ShoppingCart className="mx-auto h-12 w-12 text-slate-500" />
                    <h3 className="mt-2 text-lg font-medium text-slate-300">No Expenses Recorded Yet</h3>
                    <p className="mt-1 text-sm text-slate-400">Start tracking your spending!</p>
                    <Button className="mt-6 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white" onClick={handleAdd}>
                      Add First Expense
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-xs text-slate-400 uppercase bg-slate-700/50">
                        <tr>
                          <th className="px-4 py-3 text-left">Date</th>
                          <th className="px-4 py-3 text-left">Name</th>
                          <th className="px-4 py-3 text-left">Source</th>
                          <th className="px-4 py-3 text-right">Amount</th>
                          <th className="px-4 py-3 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/50">
                        {sortedExpenses.map(expense => {
                          const card = expense.payment_source_type === 'credit_card' ? creditCards.find(c => c.id === expense.payment_source_id) : null;
                          const service = services.find(s => s.id === expense.service_id);
                          return (
                            <tr key={expense.id} className="hover:bg-slate-800/50">
                              <td className="px-4 py-3">{new Date(expense.expense_date).toLocaleDateString()}</td>
                              <td className="px-4 py-3 font-medium text-slate-100 flex items-center">
                                {expense.name}
                                {expense.service_id && <Repeat className="h-4 w-4 ml-2 text-cyan-400" title={`Recurring from: ${service?.name || 'Service'}`} />}
                              </td>
                              <td className="px-4 py-3">
                                {card ? (
                                  <div className="flex items-center gap-2 text-xs">
                                    <CreditCard className="h-4 w-4 text-blue-400" />
                                    <span>{card.card_name} (...{card.last_four_digits})</span>
                                  </div>
                                ) : (
                                  <span className="text-xs">Cash Flow</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right font-semibold text-red-400" dangerouslySetInnerHTML={{ __html: formatCurrencyWithConversion(expense.amount, expense.currency) }} />
                              <td className="px-4 py-3 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <Button variant="ghost" size="icon" className="text-sky-400 hover:text-sky-300" onClick={() => handleEdit(expense)}><Edit className="h-4 w-4" /></Button>
                                  <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-300" onClick={() => handleDelete(expense.id)}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          <div className="space-y-8">
            <ReportCard 
              reportType="expense-by-category"
              title="Expense Insights"
              description="Visualize your spending habits by category."
              icon={BarChart2}
              color="text-red-400"
            />
          </div>
        </div>
      </motion.div>

      <ExpenseDialog 
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        currentExpense={currentExpense}
        onSaveSuccess={handleSaveSuccess}
      />
    </>
  );
};

export default ExpensesPage;