
import React, { useState, useEffect, useContext } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { TrendingUp, ArrowDownCircle, ArrowUpCircle, Edit, Trash2, Repeat } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/lib/customSupabaseClient';
import { AppContext } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import currencies from '@/lib/currencies';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import CurrencyInfoBanner from '@/components/dashboard/CurrencyInfoBanner';

const CashFlowPage = () => {
  const { toast } = useToast();
  const { categories, fetchCategories, defaultCurrency, cashFlowCurrency, formatCurrencyWithConversion, enableCurrencyConversion, getExchangeRatesInfo } = useContext(AppContext);
  const { user, household, enableCollaboration } = useAuth();
  
  const [cashFlows, setCashFlows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);

  const [transactionType, setTransactionType] = useState('income'); 
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionDescription, setTransactionDescription] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [transactionCategory, setTransactionCategory] = useState('');
  const [transactionCurrencyState, setTransactionCurrencyState] = useState(cashFlowCurrency || defaultCurrency);

  const fetchCashFlows = async () => {
    setIsLoading(true);
    let query = supabase.from('cash_flow');

    if (enableCollaboration && household) {
        query = query.select(`*, categories(name), services(name), creator:profiles!created_by(full_name)`)
                     .eq('household_id', household.id);
    } else {
        query = query.select(`*, categories(name), services(name)`)
                     .is('household_id', null);
    }
    
    const { data, error } = await query.order('transaction_date', { ascending: false });

    if (error) {
      toast({ title: "Error fetching cash flow data", description: error.message, variant: "destructive" });
    } else {
      setCashFlows(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (user) {
        fetchCashFlows();
        if (categories.length === 0) fetchCategories();
    }
  }, [user, enableCollaboration, household]);

  useEffect(() => {
    if (!currentTransaction) {
      setTransactionCurrencyState(cashFlowCurrency || defaultCurrency);
    }
  }, [cashFlowCurrency, defaultCurrency, currentTransaction]);

  const resetForm = () => {
    setTransactionType('income');
    setTransactionAmount('');
    setTransactionDescription('');
    setTransactionDate(new Date().toISOString().split('T')[0]);
    setTransactionCategory('');
    setTransactionCurrencyState(cashFlowCurrency || defaultCurrency);
    setCurrentTransaction(null);
  };

  const handleAddTransaction = (type) => {
    resetForm();
    setTransactionType(type);
    setIsDialogOpen(true);
  };

  const handleEditTransaction = (transaction) => {
    setCurrentTransaction(transaction);
    setTransactionType(transaction.type);
    setTransactionAmount(transaction.amount.toString());
    setTransactionDescription(transaction.description || '');
    setTransactionDate(transaction.transaction_date ? new Date(transaction.transaction_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    setTransactionCategory(transaction.category_id || '');
    setTransactionCurrencyState(transaction.currency || cashFlowCurrency || defaultCurrency);
    setIsDialogOpen(true);
  };

  const handleDeleteTransaction = (transaction) => {
    setTransactionToDelete(transaction);
    setIsAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (!transactionToDelete) return;
    const { error } = await supabase.from('cash_flow').delete().eq('id', transactionToDelete.id);
    if (error) {
      toast({ title: "Error deleting transaction", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Transaction Deleted", description: "The transaction has been successfully deleted." });
      fetchCashFlows();
    }
    setTransactionToDelete(null);
    setIsAlertOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!transactionAmount || !transactionDescription || !transactionDate || !user) {
      toast({ title: "Missing Fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    const transactionData = {
      type: transactionType,
      amount: parseFloat(transactionAmount),
      description: transactionDescription,
      transaction_date: transactionDate,
      category_id: transactionCategory || null,
      currency: transactionCurrencyState,
    };
    
    if (enableCollaboration) {
        if (!household) { toast({ title: "No household found.", variant: "destructive" }); return; }
        transactionData.household_id = household.id;
    }

    let error;
    if (currentTransaction) {
      transactionData.updated_by = user.id;
      ({ error } = await supabase.from('cash_flow').update(transactionData).eq('id', currentTransaction.id));
    } else {
      transactionData.created_by = user.id;
      ({ error } = await supabase.from('cash_flow').insert([transactionData]));
    }

    if (error) {
      toast({ title: `Error ${currentTransaction ? 'updating' : 'adding'} transaction`, description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Transaction ${currentTransaction ? 'Updated' : 'Added'}`, description: `The transaction has been successfully saved.` });
      fetchCashFlows();
      setIsDialogOpen(false);
      resetForm();
    }
  };

  return (
    <>
      <Helmet>
        <title>Cash Flow | Financify</title>
        <meta name="description" content="Monitor your income and expenses over time." />
      </Helmet>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-lime-400 to-green-500">Cash Flow</h1>
          <div className="flex flex-wrap gap-2">
            <Button className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white" onClick={() => handleAddTransaction('income')}>
              <ArrowUpCircle className="mr-2 h-4 w-4" /> Add Income
            </Button>
            <Button className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white" onClick={() => handleAddTransaction('outflow')}>
              <ArrowDownCircle className="mr-2 h-4 w-4" /> Add Outflow
            </Button>
          </div>
        </div>

        <CurrencyInfoBanner 
          enableCurrencyConversion={enableCurrencyConversion}
          defaultCurrency={defaultCurrency}
          exchangeRatesInfo={getExchangeRatesInfo()}
        />

        <Card className="glassmorphism border-green-500/30">
          <CardHeader>
            <CardTitle className="text-xl text-slate-200">Cash Flow Statement</CardTitle>
            <CardDescription className="text-slate-400">Track your income (cash in) and expenses (cash out). Default currency for new entries: {cashFlowCurrency || defaultCurrency}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-10 text-slate-300">Loading transactions...</div>
            ) : cashFlows.length === 0 ? (
              <div className="py-10">
                <TrendingUp className="h-12 w-12 text-slate-500 mb-4" />
                <h3 className="mt-2 text-lg font-medium text-slate-300">No Cash Flow Data Yet</h3>
                <p className="mt-1 text-sm text-slate-400">Record income and expenses to see your cash flow.</p>
                <Button className="mt-6 bg-gradient-to-r from-lime-500 to-green-500 hover:from-lime-600 hover:to-green-600 text-white" onClick={() => handleAddTransaction('income')}>
                  Record First Transaction
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-300">
                  <thead className="text-xs text-slate-400 uppercase bg-slate-700/50">
                    <tr>
                      <th scope="col" className="px-6 py-3">Date</th>
                      <th scope="col" className="px-6 py-3">Description</th>
                      <th scope="col" className="px-6 py-3">Category</th>
                      <th scope="col" className="px-6 py-3">Type</th>
                      <th scope="col" className="px-6 py-3">Amount</th>
                      <th scope="col" className="px-6 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cashFlows.map((transaction) => (
                      <tr key={transaction.id} className="border-b border-slate-700 hover:bg-slate-700/30">
                        <td className="px-6 py-4">{new Date(transaction.transaction_date).toLocaleDateString()}</td>
                        <td className="px-6 py-4 font-medium text-slate-100 whitespace-nowrap">
                            <div className="flex flex-col">
                                <div className="flex items-center">
                                    {transaction.description}
                                    {transaction.service_id && <Repeat className="h-4 w-4 ml-2 text-cyan-400" title={`Recurring from: ${transaction.services?.name || 'Service'}`} />}
                                </div>
                                {enableCollaboration && transaction.creator && (
                                    <span className="text-xs text-slate-500 italic">
                                        By: {transaction.creator.full_name || 'a user'}
                                    </span>
                                )}
                            </div>
                        </td>
                        <td className="px-6 py-4">{transaction.categories?.name || 'N/A'}</td>
                        <td className={`px-6 py-4 capitalize ${transaction.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>{transaction.type}</td>
                        <td className={`px-6 py-4 font-semibold ${transaction.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                          {transaction.type === 'income' ? '+' : ''}{formatCurrencyWithConversion(transaction.amount, transaction.currency, cashFlowCurrency)}
                        </td>
                        <td className="px-6 py-4 flex space-x-2">
                          <Button variant="ghost" size="icon" className="text-blue-400 hover:text-blue-300" onClick={() => handleEditTransaction(transaction)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-300" onClick={() => handleDeleteTransaction(transaction)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={isDialogOpen} onOpenChange={(isOpen) => { setIsDialogOpen(isOpen); if (!isOpen) resetForm(); }}>
        <DialogContent className="bg-slate-800 border-slate-700 text-slate-100 sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle className={`text-2xl text-transparent bg-clip-text bg-gradient-to-r ${transactionType === 'income' ? 'from-green-400 to-lime-500' : 'from-red-400 to-orange-500'}`}>
              {currentTransaction ? 'Edit Transaction' : (transactionType === 'income' ? 'Add Income' : 'Add Outflow')}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Fill in the details for your transaction. Amount, description, and date are required. Currency defaults to {transactionCurrencyState || defaultCurrency}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-x-4 gap-y-2">
              <Label htmlFor="transactionDescription" className="text-left md:text-right text-slate-300">Description*</Label>
              <Input id="transactionDescription" value={transactionDescription} onChange={(e) => setTransactionDescription(e.target.value)} className="md:col-span-3 bg-slate-700 border-slate-600 text-slate-100" placeholder="e.g., Salary, Groceries Bill" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-x-4 gap-y-2">
              <Label htmlFor="transactionAmount" className="text-left md:text-right text-slate-300">Amount*</Label>
              <div className="flex items-center gap-2 md:col-span-3">
                <Input id="transactionAmount" type="number" step="0.01" value={transactionAmount} onChange={(e) => setTransactionAmount(e.target.value)} className="flex-grow bg-slate-700 border-slate-600 text-slate-100" placeholder="e.g., 1000.00" />
                <Select value={transactionCurrencyState} onValueChange={setTransactionCurrencyState}>
                  <SelectTrigger className="w-[120px] bg-slate-700 border-slate-600 text-slate-100">
                    <span className="truncate">{transactionCurrencyState}</span>
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600 text-slate-100">
                    {currencies.map(curr => (
                      <SelectItem key={curr.value} value={curr.value}>{curr.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-x-4 gap-y-2">
              <Label htmlFor="transactionDate" className="text-left md:text-right text-slate-300">Date*</Label>
              <Input id="transactionDate" type="date" value={transactionDate} onChange={(e) => setTransactionDate(e.target.value)} className="md:col-span-3 bg-slate-700 border-slate-600 text-slate-100" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-x-4 gap-y-2">
              <Label htmlFor="transactionCategory" className="text-left md:text-right text-slate-300">Category</Label>
              <Select value={transactionCategory} onValueChange={(value) => setTransactionCategory(value === 'none' ? '' : value)}>
                <SelectTrigger className="md:col-span-3 bg-slate-700 border-slate-600 text-slate-100">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600 text-slate-100">
                  <SelectItem value="none">None</SelectItem>
                  {categories.filter(c => c.type === 'general' || c.type === (transactionType === 'income' ? 'income' : 'expense') ).map(cat => ( 
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-x-4 gap-y-2">
              <Label htmlFor="transactionTypeField" className="text-left md:text-right text-slate-300">Type</Label>
              <Select value={transactionType} onValueChange={setTransactionType} disabled={!!currentTransaction}>
                <SelectTrigger id="transactionTypeField" className="md:col-span-3 bg-slate-700 border-slate-600 text-slate-100">
                  <SelectValue placeholder="Select transaction type" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600 text-slate-100">
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="outflow">Outflow</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-slate-100">Cancel</Button>
              </DialogClose>
              <Button type="submit" className={`text-white ${transactionType === 'income' ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600' : 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600'}`}>
                {currentTransaction ? 'Save Changes' : 'Add Transaction'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent className="bg-slate-800 border-slate-700 text-slate-100">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This action cannot be undone. This will permanently delete the transaction: "{transactionToDelete?.description}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CashFlowPage;
  