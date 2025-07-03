import React, { useState, useContext, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Wallet, PlusCircle, Edit, Trash2, Loader2, GaugeCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AppContext } from '@/contexts/AppContext';
import BudgetDialog from '@/components/budgets/BudgetDialog';
import CurrencyInfoBanner from '@/components/dashboard/CurrencyInfoBanner';
import ReportCard from '@/components/reports/ReportCard';

const BudgetsPage = () => {
  const { toast } = useToast();
  const { 
    budgets, expenses, categories, budgetCurrency, 
    formatCurrencyWithConversion, convertCurrency, 
    enableCurrencyConversion, defaultCurrency, getExchangeRatesInfo, 
    deleteBudget, loading 
  } = useContext(AppContext);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentBudget, setCurrentBudget] = useState(null);
  const [budgetsWithSpent, setBudgetsWithSpent] = useState([]);

  const calculateSpent = useCallback(async () => {
    if (loading || !budgets.length) return;
    const calculated = await Promise.all(budgets.map(async (budget) => {
      const relevantExpenses = expenses.filter(e => 
        e.category_id === budget.category_id &&
        new Date(e.expense_date) >= new Date(budget.start_date) &&
        new Date(e.expense_date) <= new Date(budget.end_date)
      );
      
      const spent = await relevantExpenses.reduce(async (sumPromise, expense) => {
        const sum = await sumPromise;
        const convertedAmount = await convertCurrency(expense.amount, expense.currency, budget.currency);
        return sum + convertedAmount;
      }, Promise.resolve(0));

      return { ...budget, spent };
    }));
    setBudgetsWithSpent(calculated);
  }, [budgets, expenses, convertCurrency, loading]);

  useEffect(() => {
    calculateSpent();
  }, [calculateSpent]);

  const handleAdd = () => { setCurrentBudget(null); setIsDialogOpen(true); };
  const handleEdit = (budget) => { setCurrentBudget(budget); setIsDialogOpen(true); };
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await deleteBudget(id);
      toast({ title: "Budget Deleted" });
    } catch (error) {
      toast({ title: "Error deleting budget", description: error.message, variant: "destructive" });
    }
  };
  
  const handleSaveSuccess = () => {
    setIsDialogOpen(false);
  };

  return (
    <>
      <Helmet><title>Budgets - Financify</title></Helmet>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-500">Budgets</h1>
          <Button className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white" onClick={handleAdd}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Budget
          </Button>
        </div>

        <CurrencyInfoBanner 
          enableCurrencyConversion={enableCurrencyConversion}
          defaultCurrency={defaultCurrency}
          exchangeRatesInfo={getExchangeRatesInfo()}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="glassmorphism border-yellow-500/30">
              <CardHeader>
                <CardTitle>Your Budgets</CardTitle>
                <CardDescription>Default currency for new entries: {budgetCurrency}</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div>
                : budgets.length === 0 ? (
                  <div className="text-center py-10">
                    <Wallet className="mx-auto h-12 w-12 text-slate-500" />
                    <h3 className="mt-2 text-lg">No Budgets Created Yet</h3>
                    <Button className="mt-6 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white" onClick={handleAdd}>Create First Budget</Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-xs uppercase bg-slate-700/50">
                        <tr>
                          <th className="px-4 py-3 text-left">Budget</th>
                          <th className="px-4 py-3 text-left">Category</th>
                          <th className="px-4 py-3 text-left">Progress</th>
                          <th className="px-4 py-3 text-right">Period</th>
                          <th className="px-4 py-3 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/50">
                        {budgetsWithSpent.map(b => {
                            const progress = b.amount > 0 ? (b.spent / b.amount) * 100 : 0;
                            const category = categories.find(c => c.id === b.category_id);
                            return (
                              <tr key={b.id} className="hover:bg-slate-800/50">
                                <td className="px-4 py-3 font-medium">{b.name}</td>
                                <td className="px-4 py-3">{category?.name || 'N/A'}</td>
                                <td className="px-4 py-3">
                                  <div className="flex flex-col gap-1">
                                    <Progress value={progress} className="h-2" />
                                    <span className="text-xs text-slate-400" dangerouslySetInnerHTML={{ __html: `${formatCurrencyWithConversion(b.spent, b.currency)} of ${formatCurrencyWithConversion(b.amount, b.currency)}`}}></span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-right capitalize">{b.period}</td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center justify-center gap-2">
                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(b)}><Edit className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-500" onClick={() => handleDelete(b.id)}><Trash2 className="h-4 w-4" /></Button>
                                  </div>
                                </td>
                              </tr>
                            )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-1">
            <ReportCard 
              title="Budget Performance"
              description="How you're tracking against your budgets."
              reportType="budget-performance"
              icon={GaugeCircle}
              color="text-yellow-400"
            />
          </div>
        </div>
      </motion.div>
      <BudgetDialog isOpen={isDialogOpen} onOpenChange={setIsDialogOpen} currentBudget={currentBudget} onSaveSuccess={handleSaveSuccess} />
    </>
  );
};

export default BudgetsPage;