
import React, { useState, useEffect, useContext } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { ShoppingCart, PlusCircle, Edit, Trash2, Repeat, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/customSupabaseClient';
import { AppContext } from '@/contexts/AppContext';
import ExpenseDialog from '@/components/expenses/ExpenseDialog';
import ChangeLog from '@/components/ChangeLog';
import CurrencyInfoBanner from '@/components/dashboard/CurrencyInfoBanner';

const ExpensesPage = () => {
  const { toast } = useToast();
  const { 
    expensesCurrency, formatCurrencyWithConversion, fetchCategories, fetchProducts,
    user, household, enableCollaboration,
    enableCurrencyConversion, defaultCurrency, getExchangeRatesInfo
  } = useContext(AppContext);
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentExpense, setCurrentExpense] = useState(null);

  const fetchExpenses = async () => {
    setIsLoading(true);
    
    let query = supabase.from('expenses');
    let selectStatement = '*, categories(name), products(name), services(name)';
    
    if (enableCollaboration && household) {
      selectStatement += ', created_by_profile:profiles!created_by(full_name), updated_by_profile:profiles!updated_by(full_name)';
      query = query.select(selectStatement).eq('household_id', household.id);
    } else if (enableCollaboration && !household) {
      setExpenses([]);
      setIsLoading(false);
      return;
    } else {
      query = query.select(selectStatement).is('household_id', null);
    }

    const { data, error } = await query.order('expense_date', { ascending: false });

    if (error) {
      toast({ title: "Error fetching expenses", description: error.message, variant: "destructive" });
    } else {
      setExpenses(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (enableCollaboration && !household && user) {
      setIsLoading(false);
      return;
    }
    if(user){
      fetchExpenses();
      fetchCategories();
      fetchProducts();
    }
  }, [user, household, enableCollaboration]);

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
      fetchExpenses();
    }
  };

  const handleSave = () => {
    setIsDialogOpen(false);
    fetchExpenses();
  };

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

        {isLoading ? (
          <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : expenses.length === 0 ? (
          <Card className="glassmorphism border-orange-500/30">
            <CardHeader>
              <CardTitle className="text-xl text-slate-200">No Expenses Recorded</CardTitle>
              <CardDescription className="text-slate-400">Default currency for new entries: {expensesCurrency}</CardDescription>
            </CardHeader>
            <CardContent className="py-10">
              <ShoppingCart className="h-12 w-12 text-slate-500 mb-4" />
              <p className="mt-2 text-lg font-medium text-slate-300">Start tracking your spending!</p>
              <Button className="mt-6 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white" onClick={handleAdd}>
                Add First Expense
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {expenses.map(expense => (
              <motion.div key={expense.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="glassmorphism border-slate-700/50">
                    <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex-grow grid grid-cols-2 sm:grid-cols-4 gap-4 items-center w-full">
                            <div className="col-span-2 sm:col-span-1">
                                <p className="font-bold text-slate-100 flex items-center">
                                  {expense.name}
                                  {expense.service_id && <Repeat className="h-4 w-4 ml-2 text-cyan-400" title={`Recurring from: ${expense.services?.name || 'Service'}`} />}
                                </p>
                                <p className="text-xs text-slate-400">{new Date(expense.expense_date).toLocaleDateString()}</p>
                            </div>
                            <div className="text-right sm:text-left">
                                <p className="text-lg font-semibold text-red-400" dangerouslySetInnerHTML={{ __html: formatCurrencyWithConversion(expense.amount, expense.currency) }} />
                            </div>
                            <div>
                                <p className="text-sm text-slate-300">{expense.categories?.name}</p>
                                <p className="text-xs text-slate-500">{expense.products?.name}</p>
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                                <p className="text-xs text-slate-400 italic truncate">{expense.notes}</p>
                                {enableCollaboration && <ChangeLog createdBy={expense.created_by_profile} createdAt={expense.created_at} updatedBy={expense.updated_by_profile} updatedAt={expense.updated_at} className="mt-1" />}
                            </div>
                        </div>
                        <div className="flex space-x-2 self-start sm:self-center">
                            <Button variant="outline" size="icon" className="border-sky-500 text-sky-400 hover:bg-sky-500/20 hover:text-sky-300" onClick={() => handleEdit(expense)}>
                                <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" className="border-red-500 text-red-400 hover:bg-red-500/20 hover:text-red-300" onClick={() => handleDelete(expense.id)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      <ExpenseDialog 
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        currentExpense={currentExpense}
        onSave={handleSave}
      />
    </>
  );
};

export default ExpensesPage;
  