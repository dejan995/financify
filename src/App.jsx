import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { AppContextProvider } from '@/contexts/AppContext';
import Layout from '@/components/Layout';
import AuthPage from '@/pages/AuthPage';
import DashboardPage from '@/pages/DashboardPage';
import ExpensesPage from '@/pages/ExpensesPage';
import ProductsPage from '@/pages/ProductsPage';
import CategoriesPage from '@/pages/CategoriesPage';
import CashFlowPage from '@/pages/CashFlowPage';
import SavingsPage from '@/pages/SavingsPage';
import SettingsPage from '@/pages/SettingsPage';
import BudgetsPage from '@/pages/BudgetsPage';
import ServicesPage from '@/pages/ServicesPage';
import CreditCardsPage from '@/pages/CreditCardsPage';
import { Loader2 } from 'lucide-react';
import AppearanceSettings from '@/components/settings/AppearanceSettings';
import CurrencySettingsContainer from '@/components/settings/CurrencySettingsContainer';
import AccountSettings from '@/components/settings/AccountSettings';
import SecuritySettings from '@/components/settings/SecuritySettings';
import { Helmet } from 'react-helmet';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="h-screen w-screen flex justify-center items-center bg-slate-900"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  const { user } = useAuth();

  return (
    <AppContextProvider>
      <Helmet>
        <title>Financify - Financial Management</title>
        <meta name="description" content="Manage your home finances with ease with Financify. Track expenses, products, cash flow, and savings." />
      </Helmet>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <AuthPage />} />
        
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="cashflow" element={<CashFlowPage />} />
          <Route path="savings" element={<SavingsPage />} />
          <Route path="budgets" element={<BudgetsPage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="credit-cards" element={<CreditCardsPage />} />
          <Route path="settings" element={<SettingsPage />}>
            <Route index element={<Navigate to="appearance" replace />} />
            <Route path="appearance" element={<AppearanceSettings />} />
            <Route path="currency" element={<CurrencySettingsContainer />} />
            <Route path="account" element={<AccountSettings />} />
            <Route path="security" element={<SecuritySettings />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </AppContextProvider>
  );
}

export default App;