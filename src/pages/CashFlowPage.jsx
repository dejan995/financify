import React, { useState, useContext } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { TrendingUp, PlusCircle, Edit, Trash2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { AppContext } from '@/contexts/AppContext';
import CashFlowDialog from '@/components/cash-flow/CashFlowDialog';
import CurrencyInfoBanner from '@/components/dashboard/CurrencyInfoBanner';
import ReportCard from '@/components/reports/ReportCard';
import { supabase } from '@/lib/customSupabaseClient';

const CashFlowPage = () => {
  const { toast } = useToast();
  const { cashFlow, categories, cashFlowCurrency, formatCurrencyWithConversion, enableCurrencyConversion, defaultCurrency, getExchangeRatesInfo, refreshAppData } = useContext(AppContext);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState(null);

  const handleAdd = () => {
    setCurrentTransaction(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (transaction) => {
    setCurrentTransaction(transaction);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    const { error } = await supabase.from('cash_flow').delete().eq('id', id);
    if (error) {
      toast({ title: "Error deleting transaction", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Transaction Deleted" });
      refreshAppData();
    }
  };

  const handleSaveSuccess = () => {
    setIsDialogOpen(false);
    refreshAppData();
  };

  const sortedTransactions = [...cashFlow].sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date));

  return (
    <>
      <Helmet><title>Cash Flow - Financify</title></Helmet>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">Cash Flow</h1>
          <Button className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white" onClick={handleAdd}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Transaction
          </Button>
        </div>

        <CurrencyInfoBanner 
          enableCurrencyConversion={enableCurrencyConversion}
          defaultCurrency={defaultCurrency}
          exchangeRatesInfo={getExchangeRatesInfo()}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="glassmorphism border-blue-500/30">
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>Default currency for new entries: {cashFlowCurrency}</CardDescription>
              </CardHeader>
              <CardContent>
                {sortedTransactions.length === 0 ? (
                  <div className="text-center py-10">
                    <TrendingUp className="mx-auto h-12 w-12 text-slate-500" />
                    <h3 className="mt-2 text-lg">No Transactions Logged Yet</h3>
                    <Button className="mt-6 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white" onClick={handleAdd}>Log First Transaction</Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-xs uppercase bg-slate-700/50">
                        <tr>
                          <th className="px-4 py-3 text-left">Date</th>
                          <th className="px-4 py-3 text-left">Description</th>
                          <th className="px-4 py-3 text-left">Category</th>
                          <th className="px-4 py-3 text-right">Amount</th>
                          <th className="px-4 py-3 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/50">
                        {sortedTransactions.map(t => {
                          const category = categories.find(c => c.id === t.category_id);
                          return (
                            <tr key={t.id} className="hover:bg-slate-800/50">
                              <td className="px-4 py-3">{new Date(t.transaction_date).toLocaleDateString()}</td>
                              <td className="px-4 py-3 font-medium flex items-center gap-2">
                                {t.type === 'income' ? <ArrowUpCircle className="h-5 w-5 text-green-400" /> : <ArrowDownCircle className="h-5 w-5 text-red-400" />}
                                {t.description}
                              </td>
                              <td className="px-4 py-3">{category?.name || 'N/A'}</td>
                              <td className={`px-4 py-3 text-right font-semibold ${t.type === 'income' ? 'text-green-400' : 'text-red-400'}`} dangerouslySetInnerHTML={{ __html: formatCurrencyWithConversion(t.amount, t.currency) }} />
                              <td className="px-4 py-3">
                                  <div className="flex items-center justify-center gap-2">
                                      <Button variant="ghost" size="icon" onClick={() => handleEdit(t)}><Edit className="h-4 w-4" /></Button>
                                      <Button variant="ghost" size="icon" className="text-red-400" onClick={() => handleDelete(t.id)}><Trash2 className="h-4 w-4" /></Button>
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
              reportType="cashflow-analysis"
              title="Cash Flow Analysis"
              description="Visualize your income vs. outflow over time."
              icon={TrendingUp}
              color="text-green-400"
            />
          </div>
        </div>
      </motion.div>

      <CashFlowDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        currentTransaction={currentTransaction}
        onSaveSuccess={handleSaveSuccess}
      />
    </>
  );
};

export default CashFlowPage;