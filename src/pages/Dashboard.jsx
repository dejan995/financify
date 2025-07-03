
import React, { useEffect, useState, useContext } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { DollarSign, ShoppingCart, PiggyBank as SavingsIcon, Wallet, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { AppContext } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';

import DashboardHeader from '@/components/dashboard/DashboardHeader';
import CurrencyInfoBanner from '@/components/dashboard/CurrencyInfoBanner';
import StatCard from '@/components/dashboard/StatCard';
import RecentTransactionsCard from '@/components/dashboard/RecentTransactionsCard';
import BreakdownCard from '@/components/dashboard/BreakdownCard';
import QuickActionsCard from '@/components/dashboard/QuickActionsCard';

const DashboardPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { 
    defaultCurrency, 
    enableCurrencyConversion, 
    convertCurrency, 
    formatCurrencyWithConversion,
    refreshExchangeRates,
    getExchangeRatesInfo,
    household,
    enableCollaboration
  } = useContext(AppContext);
  
  const [summary, setSummary] = useState({
    totalBalance: 0,
    monthlyExpenses: 0,
    totalSavings: 0,
    budgetStatus: { spent: 0, budgeted: 0 },
    recentTransactions: [],
    currencyBreakdown: {},
  });
  const [loading, setLoading] = useState(true);
  const [refreshingRates, setRefreshingRates] = useState(false);

  const formatCurrency = (amount, currencyCode = defaultCurrency) => {
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).format(amount);
    } catch (e) {
      console.warn(`Invalid currency code for formatting: ${currencyCode}. Falling back to USD.`);
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    }
  };

  const handleRefreshRates = async () => {
    setRefreshingRates(true);
    await refreshExchangeRates();
    setRefreshingRates(false);
    fetchData();
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (enableCollaboration && !household) {
        setSummary({ totalBalance: 0, monthlyExpenses: 0, totalSavings: 0, budgetStatus: { spent: 0, budgeted: 0 }, recentTransactions: [], currencyBreakdown: {} });
        setLoading(false);
        return;
      }

      const applyScope = (query) => {
        if (enableCollaboration && household) {
          return query.eq('household_id', household.id);
        }
        return query.is('household_id', null);
      };

      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const { data: expensesData, error: expensesError } = await applyScope(supabase.from('expenses'))
        .select('amount, created_at, currency')
        .gte('created_at', thirtyDaysAgo.toISOString());
      if (expensesError) throw expensesError;

      const { data: cashFlowData, error: cashFlowError } = await applyScope(supabase.from('cash_flow'))
        .select('id, amount, type, transaction_date, description, currency')
        .order('transaction_date', { ascending: false })
        .limit(5);
      if (cashFlowError) throw cashFlowError;

      const { data: allIncome, error: allIncomeError } = await applyScope(supabase.from('cash_flow'))
        .select('amount, currency')
        .eq('type', 'income');
      
      const { data: allOutflow, error: allOutflowError } = await applyScope(supabase.from('cash_flow'))
        .select('amount, currency')
        .eq('type', 'outflow');
      if (allIncomeError || allOutflowError) throw (allIncomeError || allOutflowError);

      const { data: savingsData, error: savingsError } = await applyScope(supabase.from('savings'))
        .select('current_amount, target_amount, currency');
      if (savingsError) throw savingsError;

      const { data: budgetsData, error: budgetsError } = await applyScope(supabase.from('budgets'))
        .select('amount, currency, category_id')
        .gte('start_date', firstDayOfMonth.toISOString())
        .lte('end_date', lastDayOfMonth.toISOString());
      if (budgetsError) throw budgetsError;

      const { data: monthlyExpensesForBudgets, error: monthlyExpensesError } = await applyScope(supabase.from('expenses'))
        .select('amount, currency, category_id')
        .gte('expense_date', firstDayOfMonth.toISOString())
        .lte('expense_date', lastDayOfMonth.toISOString());
      if (monthlyExpensesError) throw monthlyExpensesError;

      let totalBalance = 0;
      let monthlyExpenses = 0;
      let totalCurrentSavings = 0;
      let totalBudgeted = 0;
      let totalSpentForBudgets = 0;
      const currencyBreakdown = {};

      if (enableCurrencyConversion) {
        for (const income of allIncome || []) {
          totalBalance += await convertCurrency(parseFloat(income.amount), income.currency);
          currencyBreakdown[income.currency] = (currencyBreakdown[income.currency] || 0) + parseFloat(income.amount);
        }
        for (const outflow of allOutflow || []) {
          totalBalance -= await convertCurrency(parseFloat(outflow.amount), outflow.currency);
        }
        for (const expense of expensesData || []) {
          monthlyExpenses += await convertCurrency(parseFloat(expense.amount), expense.currency);
        }
        for (const saving of savingsData || []) {
          totalCurrentSavings += await convertCurrency(parseFloat(saving.current_amount), saving.currency);
        }
        for (const budget of budgetsData || []) {
          totalBudgeted += await convertCurrency(parseFloat(budget.amount), budget.currency);
        }
        for (const expense of monthlyExpensesForBudgets || []) {
          if (budgetsData.some(b => b.category_id === expense.category_id)) {
            totalSpentForBudgets += await convertCurrency(parseFloat(expense.amount), expense.currency);
          }
        }
      } else {
        totalBalance = (allIncome || []).filter(i => i.currency === defaultCurrency).reduce((s, i) => s + parseFloat(i.amount), 0) - 
                       (allOutflow || []).filter(o => o.currency === defaultCurrency).reduce((s, o) => s + parseFloat(o.amount), 0);
        monthlyExpenses = (expensesData || []).filter(e => e.currency === defaultCurrency).reduce((s, e) => s + parseFloat(e.amount), 0);
        totalCurrentSavings = (savingsData || []).filter(s => s.currency === defaultCurrency).reduce((s, i) => s + parseFloat(i.current_amount), 0);
        totalBudgeted = (budgetsData || []).filter(b => b.currency === defaultCurrency).reduce((s, b) => s + parseFloat(b.amount), 0);
        totalSpentForBudgets = (monthlyExpensesForBudgets || []).filter(e => e.currency === defaultCurrency && budgetsData.some(b => b.category_id === e.category_id)).reduce((s, e) => s + parseFloat(e.amount), 0);
      }
      
      setSummary({
        totalBalance,
        monthlyExpenses,
        totalSavings: totalCurrentSavings,
        budgetStatus: { spent: totalSpentForBudgets, budgeted: totalBudgeted },
        recentTransactions: cashFlowData,
        currencyBreakdown,
      });

    } catch (error) {
      console.error("Dashboard data fetch error:", error);
      toast({ title: "Error fetching dashboard data", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [toast, defaultCurrency, enableCurrencyConversion, household, enableCollaboration]);

  const budgetProgress = summary.budgetStatus.budgeted > 0 ? (summary.budgetStatus.spent / summary.budgetStatus.budgeted) * 100 : 0;

  const summaryCards = [
    { title: `Total Balance`, value: formatCurrencyWithConversion(summary.totalBalance, defaultCurrency), icon: DollarSign, color: "text-green-400", action: () => navigate("/cashflow"), actionLabel: "View Cash Flow" },
    { title: `Monthly Expenses`, value: formatCurrencyWithConversion(summary.monthlyExpenses, defaultCurrency), icon: ShoppingCart, color: "text-red-400", action: () => navigate("/expenses"), actionLabel: "Manage Expenses" },
    { title: `Total Savings`, value: formatCurrencyWithConversion(summary.totalSavings, defaultCurrency), icon: SavingsIcon, color: "text-blue-400", action: () => navigate("/savings"), actionLabel: "View Savings" },
    { title: `Budget Progress`, value: `${budgetProgress.toFixed(0)}%`, description: `${formatCurrencyWithConversion(summary.budgetStatus.spent, defaultCurrency)} of ${formatCurrencyWithConversion(summary.budgetStatus.budgeted, defaultCurrency)}`, icon: Wallet, color: "text-amber-400", action: () => navigate("/budgets"), actionLabel: "Manage Budgets" },
  ];

  if (loading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <>
      <Helmet>
        <title>Dashboard - Financify</title>
        <meta name="description" content="Overview of your financial status." />
      </Helmet>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        <DashboardHeader 
          enableCurrencyConversion={enableCurrencyConversion}
          refreshingRates={refreshingRates}
          handleRefreshRates={handleRefreshRates}
        />

        <CurrencyInfoBanner 
          enableCurrencyConversion={enableCurrencyConversion}
          defaultCurrency={defaultCurrency}
          exchangeRatesInfo={getExchangeRatesInfo()}
        />
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((item, index) => (
            <StatCard key={item.title} item={item} index={index} />
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <RecentTransactionsCard 
            transactions={summary.recentTransactions}
            formatCurrencyWithConversion={formatCurrencyWithConversion}
          />
          <BreakdownCard 
            enableCurrencyConversion={enableCurrencyConversion}
            currencyBreakdown={summary.currencyBreakdown}
            formatCurrency={formatCurrency}
          />
        </div>
        
        <QuickActionsCard />

      </motion.div>
    </>
  );
};

export default DashboardPage;
  