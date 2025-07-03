
import React, { useState, useEffect, useContext } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Wallet, PlusCircle, Edit, Trash2, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter as DialogActions, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/lib/customSupabaseClient';
import { AppContext } from '@/contexts/AppContext';
import currencies from '@/lib/currencies';
import ChangeLog from '@/components/ChangeLog';
import CurrencyInfoBanner from '@/components/dashboard/CurrencyInfoBanner';

const BudgetsPage = () => {
  const { toast } = useToast();
  const { categories, fetchCategories, budgetCurrency, convertCurrency, user, household, enableCollaboration, enableCurrencyConversion, defaultCurrency, getExchangeRatesInfo } = useContext(AppContext);
  const [budgets, setBudgets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentBudget, setCurrentBudget] = useState(null);

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrencyState] = useState(budgetCurrency);
  const [categoryId, setCategoryId] = useState('');
  const [period, setPeriod] = useState('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchBudgetsAndSpending = async () => {
    setIsLoading(true);
    let budgetQuery = supabase.from('budgets');
    if (enableCollaboration && household) {
      budgetQuery = budgetQuery.select('*, categories(name), created_by_profile:profiles!created_by(full_name), updated_by_profile:profiles!updated_by(full_name)')
                               .eq('household_id', household.id);
    } else if (enableCollaboration && !household) {
      setBudgets([]); setIsLoading(false); return;
    } else {
      budgetQuery = budgetQuery.select('*, categories(name)').is('household_id', null);
    }
    const { data: budgetsData, error: budgetsError } = await budgetQuery.order('created_at', { ascending: false });

    if (budgetsError) {
      toast({ title: "Error fetching budgets", description: budgetsError.message, variant: "destructive" });
      setIsLoading(false); return;
    }

    const spendingPromises = budgetsData.map(async (budget) => {
      let expenseQuery = supabase.from('expenses').select('amount, currency').eq('category_id', budget.category_id).gte('expense_date', budget.start_date).lte('expense_date', budget.end_date);
      if (enableCollaboration && household) { expenseQuery = expenseQuery.eq('household_id', household.id); }
      else { expenseQuery = expenseQuery.is('household_id', null); }
      
      const { data: expensesData, error: expensesError } = await expenseQuery;
      if (expensesError) return { ...budget, spent_amount: 0 };
      let totalSpent = 0;
      for (const expense of expensesData) {
        totalSpent += await convertCurrency(expense.amount, expense.currency, budget.currency);
      }
      return { ...budget, spent_amount: totalSpent };
    });

    setBudgets(await Promise.all(spendingPromises));
    setIsLoading(false);
  };

  useEffect(() => {
    if (enableCollaboration && !household) { setIsLoading(false); return; }
    fetchBudgetsAndSpending();
    if (categories.length === 0) fetchCategories();
  }, [user, household, enableCollaboration]);

  useEffect(() => { if (!currentBudget) setCurrencyState(budgetCurrency); }, [budgetCurrency, currentBudget]);

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    const now = new Date();
    if (newPeriod === 'monthly') {
      setStartDate(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]);
      setEndDate(new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]);
    } else if (newPeriod === 'yearly') {
      setStartDate(new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]);
      setEndDate(new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0]);
    }
  };

  const resetForm = () => {
    const now = new Date();
    setName(''); setAmount(''); setCurrencyState(budgetCurrency);
    setCategoryId(''); setPeriod('monthly');
    setStartDate(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]);
    setEndDate(new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]);
    setCurrentBudget(null);
  };

  const handleAdd = () => { resetForm(); setIsDialogOpen(true); };
  const handleEdit = (budget) => {
    setCurrentBudget(budget); setName(budget.name); setAmount(budget.amount.toString());
    setCurrencyState(budget.currency || budgetCurrency); setCategoryId(budget.category_id || '');
    setPeriod(budget.period); setStartDate(new Date(budget.start_date).toISOString().split('T')[0]);
    setEndDate(new Date(budget.end_date).toISOString().split('T')[0]); setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    const { error } = await supabase.from('budgets').delete().eq('id', id);
    if (error) toast({ title: "Error deleting budget", variant: "destructive" });
    else { toast({ title: "Budget Deleted" }); fetchBudgetsAndSpending(); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !amount || !categoryId || !startDate || !endDate) {
      toast({ title: "Missing Fields", variant: "destructive" }); return;
    }
    const budgetData = { name, amount: parseFloat(amount), currency, category_id: categoryId, period, start_date: startDate, end_date: endDate };
    if (enableCollaboration) {
      if (!household) { toast({ title: "No Household Found", variant: "destructive" }); return; }
      budgetData.household_id = household.id;
      if (currentBudget) budgetData.updated_by = user.id;
      else budgetData.created_by = user.id;
    }
    const { error } = currentBudget ? await supabase.from('budgets').update(budgetData).eq('id', currentBudget.id) : await supabase.from('budgets').insert([budgetData]);
    if (error) toast({ title: "Error saving budget", variant: "destructive" });
    else { toast({ title: "Budget saved" }); fetchBudgetsAndSpending(); setIsDialogOpen(false); resetForm(); }
  };

  const formatCurrencyDisplay = (val, curr) => new Intl.NumberFormat('en-US', { style: 'currency', currency: curr }).format(val);
  const getProgress = (current, target) => target <= 0 ? 0 : Math.min(Math.max((current / target) * 100, 0), 100);

  return (
    <>
      <Helmet><title>Budgets - Financify</title></Helmet>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Budgets</h1>
          <Button className="bg-gradient-to-r from-amber-500 to-orange-500 text-white" onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" /> Add Budget</Button>
        </div>
        
        <CurrencyInfoBanner 
          enableCurrencyConversion={enableCurrencyConversion}
          defaultCurrency={defaultCurrency}
          exchangeRatesInfo={getExchangeRatesInfo()}
        />

        {isLoading ? <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        : budgets.length === 0 ? (
          <Card className="glassmorphism border-orange-500/30">
            <CardHeader className="text-left">
              <CardTitle>No Budgets Created</CardTitle>
              <CardDescription>Default currency: {budgetCurrency}</CardDescription>
            </CardHeader>
            <CardContent className="py-10 text-left">
              <Wallet className="h-12 w-12 text-slate-500 mb-4" />
              <p className="mt-2 text-lg">Take control of your spending!</p>
              <Button className="mt-6" onClick={handleAdd}>Create First Budget</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {budgets.map(budget => {
              const progress = getProgress(budget.spent_amount, budget.amount);
              const remaining = budget.amount - budget.spent_amount;
              const progressColor = progress > 100 ? 'bg-red-500' : progress > 75 ? 'bg-orange-500' : 'bg-green-500';
              return (
                <motion.div key={budget.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                  <Card className="glassmorphism border-amber-500/30 h-full flex flex-col">
                    <CardHeader>
                      <div className="flex justify-between items-start"><CardTitle>{budget.name}</CardTitle><span className="text-xs bg-slate-700 px-2 py-1 rounded-full">{budget.categories?.name || 'Uncategorized'}</span></div>
                      <CardDescription>Budget: {formatCurrencyDisplay(budget.amount, budget.currency)}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-3">
                      <div>
                        <p className="text-lg font-bold">{formatCurrencyDisplay(budget.spent_amount, budget.currency)} <span className="text-sm text-slate-400">spent</span></p>
                        <p className={`text-sm ${remaining < 0 ? 'text-red-400' : 'text-green-400'}`}>{formatCurrencyDisplay(remaining, budget.currency)} {remaining >= 0 ? 'remaining' : 'overspent'}</p>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1"><span>Progress</span><span>{progress.toFixed(0)}%</span></div>
                        <div className="w-full bg-slate-700 rounded-full h-2.5"><div className={`h-2.5 rounded-full ${progressColor}`} style={{ width: `${progress}%` }}></div></div>
                      </div>
                      {enableCollaboration && <ChangeLog createdBy={budget.created_by_profile} createdAt={budget.created_at} updatedBy={budget.updated_by_profile} updatedAt={budget.updated_at} className="pt-2" />}
                    </CardContent>
                    <CardFooter className="p-4 border-t border-slate-700/50 flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => handleEdit(budget)}><Edit className="mr-2 h-4 w-4" /> Edit</Button>
                      <Button variant="destructive" onClick={() => handleDelete(budget.id)}><Trash2 className="mr-2 h-4 w-4" /> Delete</Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
      <Dialog open={isDialogOpen} onOpenChange={(isOpen) => { setIsDialogOpen(isOpen); if (!isOpen) resetForm(); }}>
        <DialogContent className="bg-slate-800 border-slate-700 text-slate-100">
          <DialogHeader><DialogTitle>{currentBudget ? 'Edit' : 'Add New'} Budget</DialogTitle><DialogDescription>Set a spending limit for a category.</DialogDescription></DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="name" className="text-right">Name*</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" /></div>
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="category" className="text-right">Category*</Label><Select value={categoryId} onValueChange={setCategoryId}><SelectTrigger className="col-span-3"><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{categories.filter(c => c.type === 'expense' || c.type === 'general').map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="amount" className="text-right">Amount*</Label><div className="col-span-3 flex gap-2"><Input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="flex-grow" /><Select value={currency} onValueChange={setCurrencyState}><SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger><SelectContent>{currencies.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent></Select></div></div>
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="period" className="text-right">Period*</Label><Select value={period} onValueChange={handlePeriodChange}><SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="yearly">Yearly</SelectItem><SelectItem value="one-time">One-Time</SelectItem></SelectContent></Select></div>
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="startDate" className="text-right">Start Date*</Label><Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="col-span-3" /></div>
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="endDate" className="text-right">End Date*</Label><Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="col-span-3" /></div>
            <DialogActions><DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose><Button type="submit">Save</Button></DialogActions>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BudgetsPage;
  