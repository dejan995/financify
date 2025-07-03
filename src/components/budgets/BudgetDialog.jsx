
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/components/ui/use-toast';
import { AppContext } from '@/contexts/AppContext';
import { currencies } from '@/lib/currencies';
import { Loader2 } from 'lucide-react';

const BudgetDialog = ({ isOpen, onOpenChange, currentBudget, onSaveSuccess }) => {
  const { toast } = useToast();
  const { categories, budgetCurrency, addBudget, updateBudget } = useContext(AppContext);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(budgetCurrency);
  const [categoryId, setCategoryId] = useState('');
  const [period, setPeriod] = useState('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const resetForm = useCallback(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);
    setName('');
    setAmount('');
    setCurrency(budgetCurrency);
    setCategoryId('');
    setPeriod('monthly');
    setStartDate(firstDay);
    setEndDate(lastDay);
  }, [budgetCurrency]);

  useEffect(() => {
    if (isOpen) {
      if (currentBudget) {
        setName(currentBudget.name);
        setAmount(currentBudget.amount.toString());
        setCurrency(currentBudget.currency);
        setCategoryId(currentBudget.category_id);
        setPeriod(currentBudget.period);
        setStartDate(new Date(currentBudget.start_date).toISOString().slice(0, 10));
        setEndDate(new Date(currentBudget.end_date).toISOString().slice(0, 10));
      } else {
        resetForm();
      }
    }
  }, [currentBudget, isOpen, resetForm]);

  const handlePeriodChange = (value) => {
    setPeriod(value);
    const today = new Date();
    let firstDay, lastDay;

    if (value === 'monthly') {
      firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    } else if (value === 'yearly') {
      firstDay = new Date(today.getFullYear(), 0, 1);
      lastDay = new Date(today.getFullYear(), 11, 31);
    }
    if (firstDay && lastDay) {
        setStartDate(firstDay.toISOString().slice(0, 10));
        setEndDate(lastDay.toISOString().slice(0, 10));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const budgetData = { 
      name, 
      amount: parseFloat(amount), 
      currency, 
      category_id: categoryId, 
      period, 
      start_date: startDate, 
      end_date: endDate
    };
    
    try {
        if (currentBudget) {
            updateBudget(currentBudget.id, budgetData);
        } else {
            addBudget(budgetData);
        }
        toast({ title: `Budget saved` });
        onSaveSuccess();
    } catch (error) {
        toast({ title: "Error saving budget", description: error.message, variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700">
        <DialogHeader><DialogTitle>{currentBudget ? 'Edit' : 'Add'} Budget</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="name" className="text-right">Name</Label><Input id="name" value={name} onChange={e => setName(e.target.value)} className="col-span-3" required /></div>
          <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="amount" className="text-right">Amount</Label><div className="col-span-3 flex gap-2"><Input id="amount" type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required /><Select value={currency} onValueChange={setCurrency}><SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger><SelectContent>{currencies.map(c => <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>)}</SelectContent></Select></div></div>
          <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="categoryId" className="text-right">Category</Label><Select value={categoryId} onValueChange={setCategoryId} required><SelectTrigger className="col-span-3"><SelectValue placeholder="Select a category" /></SelectTrigger><SelectContent>{categories.filter(c => c.type === 'expense' || c.type === 'general').map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
          <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="period" className="text-right">Period</Label><Select value={period} onValueChange={handlePeriodChange}><SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="yearly">Yearly</SelectItem><SelectItem value="custom">Custom</SelectItem></SelectContent></Select></div>
          <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="startDate" className="text-right">Start Date</Label><Input id="startDate" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="col-span-3" required disabled={period !== 'custom'} /></div>
          <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="endDate" className="text-right">End Date</Label><Input id="endDate" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="col-span-3" required disabled={period !== 'custom'} /></div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button></DialogClose>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BudgetDialog;
