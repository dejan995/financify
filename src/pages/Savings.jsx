
import React, { useState, useEffect, useContext } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { PiggyBank, Target, Edit, Trash2, DollarSign, Loader2 } from 'lucide-react';
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

const SavingsPage = () => {
  const { toast } = useToast();
  const { savingsCurrency, user, household, enableCollaboration, enableCurrencyConversion, defaultCurrency, getExchangeRatesInfo } = useContext(AppContext);
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [isContributionDialogOpen, setIsContributionDialogOpen] = useState(false);
  const [currentGoal, setCurrentGoal] = useState(null);
  const [selectedGoalForContribution, setSelectedGoalForContribution] = useState(null);

  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0'); 
  const [goalCurrencyState, setGoalCurrencyState] = useState(savingsCurrency);
  const [targetDate, setTargetDate] = useState('');
  const [goalNotes, setGoalNotes] = useState('');
  const [contributionAmount, setContributionAmount] = useState('');

  const fetchSavingsGoals = async () => {
    setIsLoading(true);
    let query = supabase.from('savings');
    if (enableCollaboration && household) {
      query = query.select(`*, created_by_profile:profiles!created_by(full_name), updated_by_profile:profiles!updated_by(full_name)`)
                   .eq('household_id', household.id);
    } else if (enableCollaboration && !household) {
      setSavingsGoals([]); setIsLoading(false); return;
    } else {
      query = query.select('*').is('household_id', null);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) toast({ title: "Error fetching savings goals", variant: "destructive" });
    else setSavingsGoals(data);
    setIsLoading(false);
  };

  useEffect(() => {
    if (enableCollaboration && !household) { setIsLoading(false); return; }
    fetchSavingsGoals();
  }, [user, household, enableCollaboration]);

  useEffect(() => { if (!currentGoal) setGoalCurrencyState(savingsCurrency); }, [savingsCurrency, currentGoal]);

  const resetGoalForm = () => {
    setGoalName(''); setTargetAmount(''); setCurrentAmount('0');
    setGoalCurrencyState(savingsCurrency); setTargetDate('');
    setGoalNotes(''); setCurrentGoal(null);
  };
  
  const resetContributionForm = () => { setContributionAmount(''); setSelectedGoalForContribution(null); };

  const handleAddGoal = () => { resetGoalForm(); setIsGoalDialogOpen(true); };
  const handleEditGoal = (goal) => {
    setCurrentGoal(goal); setGoalName(goal.goal_name);
    setTargetAmount(goal.target_amount.toString()); setCurrentAmount(goal.current_amount.toString());
    setGoalCurrencyState(goal.currency || savingsCurrency); setTargetDate(goal.target_date ? new Date(goal.target_date).toISOString().split('T')[0] : '');
    setGoalNotes(goal.notes || ''); setIsGoalDialogOpen(true);
  };

  const handleDeleteGoal = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    const { error } = await supabase.from('savings').delete().eq('id', id);
    if (error) toast({ title: "Error deleting goal", variant: "destructive" });
    else { toast({ title: "Savings Goal Deleted" }); fetchSavingsGoals(); }
  };

  const handleGoalSubmit = async (e) => {
    e.preventDefault();
    if (!goalName || !targetAmount) { toast({ title: "Missing Fields", variant: "destructive" }); return; }
    const goalData = { goal_name: goalName, target_amount: parseFloat(targetAmount), current_amount: parseFloat(currentAmount), currency: goalCurrencyState, target_date: targetDate || null, notes: goalNotes };
    
    if (enableCollaboration) {
      if (!household) { toast({ title: "No Household Found", variant: "destructive" }); return; }
      goalData.household_id = household.id;
    }

    if (currentGoal) {
      goalData.updated_by = user.id;
    } else {
      goalData.created_by = user.id;
    }

    const { error } = currentGoal ? await supabase.from('savings').update(goalData).eq('id', currentGoal.id) : await supabase.from('savings').insert([goalData]);
    if (error) toast({ title: `Error saving goal`, variant: "destructive" });
    else { toast({ title: `Savings Goal saved` }); fetchSavingsGoals(); setIsGoalDialogOpen(false); resetGoalForm(); }
  };
  
  const handleOpenContributionModal = (goal) => { setSelectedGoalForContribution(goal); setContributionAmount(''); setIsContributionDialogOpen(true); };
  const handleContributionSubmit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(contributionAmount);
    if (!amount || amount <= 0 || !selectedGoalForContribution) { toast({ title: "Invalid amount", variant: "destructive" }); return; }
    const newCurrentAmount = parseFloat(selectedGoalForContribution.current_amount) + amount;
    const { error } = await supabase.from('savings').update({ current_amount: newCurrentAmount, updated_by: user.id }).eq('id', selectedGoalForContribution.id);
    if (error) toast({ title: "Error adding contribution", variant: "destructive" });
    else { toast({ title: "Contribution Added!" }); fetchSavingsGoals(); setIsContributionDialogOpen(false); resetContributionForm(); }
  };
  
  const formatCurrencyDisplay = (amount, currencyCode) => new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).format(amount);
  const getProgress = (current, target) => target <= 0 ? 0 : Math.min(Math.max((current / target) * 100, 0), 100);

  return (
    <>
      <Helmet><title>Savings - Financify</title></Helmet>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Savings</h1>
          <Button onClick={handleAddGoal}><Target className="mr-2 h-4 w-4" /> Add Savings Goal</Button>
        </div>

        <CurrencyInfoBanner 
          enableCurrencyConversion={enableCurrencyConversion}
          defaultCurrency={defaultCurrency}
          exchangeRatesInfo={getExchangeRatesInfo()}
        />

        {isLoading ? <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div>
        : savingsGoals.length === 0 ? (
          <Card className="glassmorphism border-purple-500/30">
            <CardHeader className="text-left">
              <CardTitle>No Savings Goals Yet</CardTitle>
              <CardDescription>Default currency: {savingsCurrency}</CardDescription>
            </CardHeader>
            <CardContent className="py-10 text-left">
              <PiggyBank className="h-12 w-12 text-slate-500 mb-4" />
              <p className="mt-2 text-lg">Start planning for your future!</p>
              <Button className="mt-6" onClick={handleAddGoal}>Set First Goal</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {savingsGoals.map(goal => {
              const progress = getProgress(parseFloat(goal.current_amount), parseFloat(goal.target_amount));
              return (
                <motion.div key={goal.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                  <Card className="glassmorphism border-indigo-500/30 h-full flex flex-col">
                    <CardHeader><div className="flex justify-between"><CardTitle>{goal.goal_name}</CardTitle><Target /></div><CardDescription>Target: {formatCurrencyDisplay(goal.target_amount, goal.currency)}</CardDescription></CardHeader>
                    <CardContent className="flex-grow space-y-3"><p className="text-2xl font-bold">{formatCurrencyDisplay(goal.current_amount, goal.currency)} <span className="text-sm">saved</span></p><div><div className="flex justify-between text-xs mb-1"><span>Progress</span><span>{progress.toFixed(0)}%</span></div><div className="w-full bg-slate-700 rounded-full h-2.5"><div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div></div></div>{enableCollaboration && <ChangeLog createdBy={goal.created_by_profile} createdAt={goal.created_at} updatedBy={goal.updated_by_profile} updatedAt={goal.updated_at} className="pt-2" />}</CardContent>
                    <CardFooter className="p-4 border-t border-slate-700/50 flex flex-wrap justify-end gap-2">
                      <Button variant="outline" onClick={() => handleOpenContributionModal(goal)}><DollarSign className="mr-2 h-4 w-4" /> Contribute</Button>
                      <Button variant="outline" onClick={() => handleEditGoal(goal)}><Edit className="mr-2 h-4 w-4" /> Edit</Button>
                      <Button variant="destructive" onClick={() => handleDeleteGoal(goal.id)}><Trash2 className="mr-2 h-4 w-4" /> Delete</Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      <Dialog open={isGoalDialogOpen} onOpenChange={(isOpen) => { setIsGoalDialogOpen(isOpen); if (!isOpen) resetGoalForm(); }}>
        <DialogContent className="bg-slate-800 border-slate-700"><DialogHeader><DialogTitle>{currentGoal ? 'Edit' : 'Add'} Savings Goal</DialogTitle></DialogHeader>
        <form onSubmit={handleGoalSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="goalName" className="text-right">Name*</Label><Input id="goalName" value={goalName} onChange={(e) => setGoalName(e.target.value)} className="col-span-3" /></div>
          <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="targetAmount" className="text-right">Target*</Label><div className="col-span-3 flex gap-2"><Input id="targetAmount" type="number" step="0.01" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} /><Select value={goalCurrencyState} onValueChange={setGoalCurrencyState}><SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger><SelectContent>{currencies.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent></Select></div></div>
          <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="currentAmount" className="text-right">Current</Label><Input id="currentAmount" type="number" step="0.01" value={currentAmount} onChange={(e) => setCurrentAmount(e.target.value)} className="col-span-3" /></div>
          <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="targetDate" className="text-right">Target Date</Label><Input id="targetDate" type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="col-span-3" /></div>
          <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="goalNotes" className="text-right">Notes</Label><textarea id="goalNotes" value={goalNotes} onChange={(e) => setGoalNotes(e.target.value)} className="col-span-3 bg-slate-700 p-2 rounded-md" /></div>
          <DialogActions><DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose><Button type="submit">Save</Button></DialogActions>
        </form></DialogContent>
      </Dialog>
      <Dialog open={isContributionDialogOpen} onOpenChange={(isOpen) => { setIsContributionDialogOpen(isOpen); if (!isOpen) resetContributionForm(); }}>
        <DialogContent className="bg-slate-800 border-slate-700"><DialogHeader><DialogTitle>Add Contribution to "{selectedGoalForContribution?.goal_name}"</DialogTitle><DialogDescription>Current: {selectedGoalForContribution ? formatCurrencyDisplay(selectedGoalForContribution.current_amount, selectedGoalForContribution.currency) : ''}</DialogDescription></DialogHeader>
        <form onSubmit={handleContributionSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="contributionAmountField" className="text-right">Amount*</Label><Input id="contributionAmountField" type="number" step="0.01" value={contributionAmount} onChange={(e) => setContributionAmount(e.target.value)} className="col-span-3" /></div>
          <DialogActions><DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose><Button type="submit">Add</Button></DialogActions>
        </form></DialogContent>
      </Dialog>
    </>
  );
};

export default SavingsPage;
  