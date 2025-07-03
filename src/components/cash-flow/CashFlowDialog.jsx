
import React, { useState, useEffect, useContext } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/components/ui/use-toast';
import { AppContext } from '@/contexts/AppContext';
import { currencies } from '@/lib/currencies';
import { Loader2 } from 'lucide-react';

const CashFlowDialog = ({ isOpen, onOpenChange, currentTransaction, onSaveSuccess }) => {
  const { toast } = useToast();
  const { categories, cashFlowCurrency, addCashFlow, updateCashFlow } = useContext(AppContext);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [type, setType] = useState('income');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(cashFlowCurrency);
  const [description, setDescription] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().slice(0, 10));
  const [categoryId, setCategoryId] = useState('');

  const resetForm = () => {
    setType('income');
    setAmount('');
    setCurrency(cashFlowCurrency);
    setDescription('');
    setTransactionDate(new Date().toISOString().slice(0, 10));
    setCategoryId('');
  };

  useEffect(() => {
    if (isOpen) {
      if (currentTransaction) {
        setType(currentTransaction.type);
        setAmount(currentTransaction.amount.toString());
        setCurrency(currentTransaction.currency);
        setDescription(currentTransaction.description || '');
        setTransactionDate(new Date(currentTransaction.transaction_date).toISOString().slice(0, 10));
        setCategoryId(currentTransaction.category_id || '');
      } else {
        resetForm();
      }
    }
  }, [currentTransaction, isOpen, cashFlowCurrency]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const transactionData = {
      type,
      amount: parseFloat(amount),
      currency,
      description,
      transaction_date: transactionDate,
      category_id: categoryId || null,
    };
    
    try {
        if (currentTransaction) {
            updateCashFlow(currentTransaction.id, transactionData);
        } else {
            addCashFlow(transactionData);
        }
        toast({ title: `Transaction saved` });
        onSaveSuccess();
    } catch (error) {
        toast({ title: "Error saving transaction", description: error.message, variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700">
        <DialogHeader><DialogTitle>{currentTransaction ? 'Edit' : 'Add'} Transaction</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4"><Label className="text-right">Type</Label><Select value={type} onValueChange={setType}><SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="income">Income</SelectItem><SelectItem value="outflow">Outflow</SelectItem></SelectContent></Select></div>
          <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="amount" className="text-right">Amount</Label><div className="col-span-3 flex gap-2"><Input id="amount" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required /><Select value={currency} onValueChange={setCurrency}><SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger><SelectContent>{currencies.map(c => <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>)}</SelectContent></Select></div></div>
          <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="description" className="text-right">Description</Label><Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" required /></div>
          <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="transactionDate" className="text-right">Date</Label><Input id="transactionDate" type="date" value={transactionDate} onChange={(e) => setTransactionDate(e.target.value)} className="col-span-3" required /></div>
          <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="categoryId" className="text-right">Category</Label><Select value={categoryId} onValueChange={setCategoryId}><SelectTrigger className="col-span-3"><SelectValue placeholder="Select a category" /></SelectTrigger><SelectContent>{categories.filter(c => c.type === type || c.type === 'general').map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button></DialogClose>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CashFlowDialog;
