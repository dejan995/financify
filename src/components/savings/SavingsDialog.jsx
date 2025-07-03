
import React, { useState, useEffect, useContext } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/components/ui/use-toast';
import { AppContext } from '@/contexts/AppContext';
import { currencies } from '@/lib/currencies';
import { Loader2 } from 'lucide-react';

const SavingsDialog = ({ isOpen, onOpenChange, currentGoal, onSaveSuccess }) => {
  const { toast } = useToast();
  const { savingsCurrency, addSaving, updateSaving } = useContext(AppContext);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [currency, setCurrency] = useState(savingsCurrency);
  const [targetDate, setTargetDate] = useState('');
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setGoalName('');
    setTargetAmount('');
    setCurrentAmount('');
    setCurrency(savingsCurrency);
    setTargetDate('');
    setNotes('');
  };

  useEffect(() => {
    if (isOpen) {
      if (currentGoal) {
        setGoalName(currentGoal.goal_name);
        setTargetAmount(currentGoal.target_amount.toString());
        setCurrentAmount(currentGoal.current_amount.toString());
        setCurrency(currentGoal.currency);
        setTargetDate(currentGoal.target_date ? new Date(currentGoal.target_date).toISOString().slice(0, 10) : '');
        setNotes(currentGoal.notes || '');
      } else {
        resetForm();
      }
    }
  }, [currentGoal, isOpen, savingsCurrency]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const savingsData = {
      goal_name: goalName,
      target_amount: parseFloat(targetAmount),
      current_amount: parseFloat(currentAmount) || 0,
      currency,
      target_date: targetDate || null,
      notes,
    };
    
    try {
        if (currentGoal) {
            updateSaving(currentGoal.id, savingsData);
        } else {
            addSaving(savingsData);
        }
        toast({ title: `Savings goal saved` });
        onSaveSuccess();
    } catch (error) {
        toast({ title: "Error saving savings goal", description: error.message, variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700">
        <DialogHeader><DialogTitle>{currentGoal ? 'Edit' : 'Add'} Savings Goal</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="goalName" className="text-right">Goal Name</Label><Input id="goalName" value={goalName} onChange={(e) => setGoalName(e.target.value)} className="col-span-3" required /></div>
          <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="targetAmount" className="text-right">Target Amount</Label><div className="col-span-3 flex gap-2"><Input id="targetAmount" type="number" step="0.01" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} required /><Select value={currency} onValueChange={setCurrency}><SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger><SelectContent>{currencies.map(c => <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>)}</SelectContent></Select></div></div>
          <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="currentAmount" className="text-right">Current Amount</Label><Input id="currentAmount" type="number" step="0.01" value={currentAmount} onChange={(e) => setCurrentAmount(e.target.value)} className="col-span-3" /></div>
          <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="targetDate" className="text-right">Target Date</Label><Input id="targetDate" type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="col-span-3" /></div>
          <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="notes" className="text-right">Notes</Label><Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="col-span-3" /></div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button></DialogClose>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SavingsDialog;
