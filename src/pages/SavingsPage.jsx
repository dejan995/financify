import React, { useState, useContext } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { PiggyBank, PlusCircle, Edit, Trash2, Target } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AppContext } from '@/contexts/AppContext';
import SavingsDialog from '@/components/savings/SavingsDialog';
import CurrencyInfoBanner from '@/components/dashboard/CurrencyInfoBanner';
import ReportCard from '@/components/reports/ReportCard';
import { supabase } from '@/lib/customSupabaseClient';

const SavingsPage = () => {
  const { toast } = useToast();
  const { savings, savingsCurrency, formatCurrencyWithConversion, enableCurrencyConversion, defaultCurrency, getExchangeRatesInfo, refreshAppData } = useContext(AppContext);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentGoal, setCurrentGoal] = useState(null);

  const handleAdd = () => {
    setCurrentGoal(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (goal) => {
    setCurrentGoal(goal);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    const { error } = await supabase.from('savings').delete().eq('id', id);
    if (error) {
      toast({ title: "Error deleting savings goal", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Savings Goal Deleted" });
      refreshAppData();
    }
  };

  const handleSaveSuccess = () => {
    setIsDialogOpen(false);
    refreshAppData();
  };

  const sortedGoals = [...savings].sort((a, b) => new Date(a.target_date) - new Date(b.target_date));

  return (
    <>
      <Helmet><title>Savings - Financify</title></Helmet>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Savings</h1>
          <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white" onClick={handleAdd}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Savings Goal
          </Button>
        </div>

        <CurrencyInfoBanner 
          enableCurrencyConversion={enableCurrencyConversion}
          defaultCurrency={defaultCurrency}
          exchangeRatesInfo={getExchangeRatesInfo()}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="glassmorphism border-pink-500/30">
              <CardHeader>
                <CardTitle>Savings Goals</CardTitle>
                <CardDescription>Default currency for new entries: {savingsCurrency}</CardDescription>
              </CardHeader>
              <CardContent>
                {sortedGoals.length === 0 ? (
                  <div className="text-center py-10">
                    <PiggyBank className="mx-auto h-12 w-12 text-slate-500" />
                    <h3 className="mt-2 text-lg">No Savings Goals Yet</h3>
                    <Button className="mt-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white" onClick={handleAdd}>Create First Goal</Button>
                  </div>
                ) : (
                    <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-xs uppercase bg-slate-700/50">
                        <tr>
                          <th className="px-4 py-3 text-left">Goal</th>
                          <th className="px-4 py-3 text-left">Progress</th>
                          <th className="px-4 py-3 text-right">Target Date</th>
                          <th className="px-4 py-3 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/50">
                        {sortedGoals.map(goal => {
                            const progress = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
                            return (
                                <tr key={goal.id} className="hover:bg-slate-800/50">
                                    <td className="px-4 py-3 font-medium">{goal.goal_name}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-col gap-1">
                                            <Progress value={progress} className="h-2" />
                                            <span className="text-xs text-slate-400" dangerouslySetInnerHTML={{ __html: `${formatCurrencyWithConversion(goal.current_amount, goal.currency)} of ${formatCurrencyWithConversion(goal.target_amount, goal.currency)}`}}></span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right">{goal.target_date ? new Date(goal.target_date).toLocaleDateString() : 'N/A'}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-center gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(goal)}><Edit className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" className="text-red-400" onClick={() => handleDelete(goal.id)}><Trash2 className="h-4 w-4" /></Button>
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
          <div className="space-y-8">
            <ReportCard 
              reportType="savings-goal-progress"
              title="Savings Progress"
              description="Visualize how close you are to your goals."
              icon={Target}
              color="text-pink-400"
            />
          </div>
        </div>
      </motion.div>

      <SavingsDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        currentGoal={currentGoal}
        onSaveSuccess={handleSaveSuccess}
      />
    </>
  );
};

export default SavingsPage;