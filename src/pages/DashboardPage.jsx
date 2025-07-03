import React, { useEffect, useState, useContext, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { DollarSign, ShoppingCart, PiggyBank as SavingsIcon, Wallet, CreditCard } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
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
    expenses,
    cashFlow,
    savings,
    creditCards,
    budgets
  } = useContext(AppContext);
  
  const [summary, setSummary] = useState({
    totalBalance: 0,
    monthlyExpenses: 0,
    totalSavings: 0,
    totalCreditDebt: 0,
    budgetStatus: { spent: 0, budgeted: 0 },
    recentTransactions: [],
    currencyBreakdown: {},
  });
  const [refreshingRates, setRefreshingRates] = useState(false);

  const formatCurrency = (amount, currencyCode = defaultCurrency) => {
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).format(amount);
    } catch (e) {
      console.warn(`Invalid currency code for formatting: ${currencyCode}. Falling back to USD.`);
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    }
  };

  const calculateSummary = useCallback(async () => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    let totalBalance = 0;
    let monthlyExpenses = 0;
    let totalCurrentSavings = 0;
    let totalCreditDebt = 0;
    let totalBudgeted = 0;
    let totalSpentForBudgets = 0;
    const currencyBreakdown = {};

    const processItems = async (items, amountField, currencyField, factor = 1) => {
        let total = 0;
        for (const item of items) {
            const amount = parseFloat(item[amountField]) || 0;
            const currency = item[currencyField];
            if (enableCurrencyConversion) {
                total += await convertCurrency(amount, currency) * factor;
            } else if (currency === defaultCurrency) {
                total += amount * factor;
            }

            if (factor > 0) {
                 currencyBreakdown[currency] = (currencyBreakdown[currency] || 0) + amount;
            }
        }
        return total;
    };
    
    const incomeTotal = await processItems(cashFlow.filter(t => t.type === 'income'), 'amount', 'currency');
    const outflowTotal = await processItems(cashFlow.filter(t => t.type === 'outflow'), 'amount', 'currency', -1);
    totalBalance = incomeTotal + outflowTotal;
    
    monthlyExpenses = await processItems(expenses.filter(e => new Date(e.expense_date) >= thirtyDaysAgo), 'amount', 'currency');
    totalCurrentSavings = await processItems(savings, 'current_amount', 'currency');
    totalCreditDebt = await processItems(creditCards, 'current_balance', 'currency');
    totalBudgeted = await processItems(budgets, 'amount', 'currency');
    totalSpentForBudgets = await processItems(expenses.filter(e => budgets.some(b => b.category_id === e.category_id)), 'amount', 'currency');

    setSummary({
      totalBalance,
      monthlyExpenses,
      totalSavings: totalCurrentSavings,
      totalCreditDebt,
      budgetStatus: { spent: totalSpentForBudgets, budgeted: totalBudgeted },
      recentTransactions: [...cashFlow].sort((a,b) => new Date(b.transaction_date) - new Date(a.transaction_date)).slice(0,5),
      currencyBreakdown,
    });
  }, [cashFlow, expenses, savings, creditCards, budgets, defaultCurrency, enableCurrencyConversion, convertCurrency]);

  useEffect(() => {
    calculateSummary();
  }, [calculateSummary]);

  const handleRefreshRates = async () => {
    setRefreshingRates(true);
    await refreshExchangeRates();
    setRefreshingRates(false);
    toast({title: "Rates refreshed"})
  };

  const budgetProgress = summary.budgetStatus.budgeted > 0 ? (summary.budgetStatus.spent / summary.budgetStatus.budgeted) * 100 : 0;

  const summaryCards = [
    { title: `Total Balance`, value: formatCurrencyWithConversion(summary.totalBalance, defaultCurrency), icon: DollarSign, color: "text-green-400", action: () => navigate("/cashflow"), actionLabel: "View Cash Flow" },
    { title: `Monthly Expenses`, value: formatCurrencyWithConversion(summary.monthlyExpenses, defaultCurrency), icon: ShoppingCart, color: "text-red-400", action: () => navigate("/expenses"), actionLabel: "Manage Expenses" },
    { title: `Total Savings`, value: formatCurrencyWithConversion(summary.totalSavings, defaultCurrency), icon: SavingsIcon, color: "text-blue-400", action: () => navigate("/savings"), actionLabel: "View Savings" },
    { title: `Total Card Debt`, value: formatCurrencyWithConversion(summary.totalCreditDebt, defaultCurrency), icon: CreditCard, color: "text-orange-400", action: () => navigate("/credit-cards"), actionLabel: "Manage Cards" },
    { title: `Budget Progress`, value: `${budgetProgress.toFixed(0)}%`, description: `${formatCurrencyWithConversion(summary.budgetStatus.spent, defaultCurrency)} of ${formatCurrencyWithConversion(summary.budgetStatus.budgeted, defaultCurrency)}`, icon: Wallet, color: "text-amber-400", action: () => navigate("/budgets"), actionLabel: "Manage Budgets" },
  ];

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