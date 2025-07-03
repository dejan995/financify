
import React, { useContext, useState } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { DollarSign, Globe, RefreshCw, ShoppingBag, Package, TrendingUp as CashFlowIcon, PiggyBank, Wallet, Server } from 'lucide-react';
import { currencies } from '@/lib/currencies';

const CurrencySettings = ({ settings, setSettings, handleSave, handleRefreshRates, refreshingRates }) => {
  const { getExchangeRatesInfo } = useContext(AppContext);
  const exchangeRatesInfo = getExchangeRatesInfo();

  const sectionCurrencySettings = [
    { id: 'expensesCurrency', label: 'Expenses', icon: ShoppingBag },
    { id: 'productsCurrency', label: 'Products', icon: Package },
    { id: 'cashFlowCurrency', label: 'Cash Flow', icon: CashFlowIcon },
    { id: 'savingsCurrency', label: 'Savings', icon: PiggyBank },
    { id: 'budgetsCurrency', label: 'Budgets', icon: Wallet },
    { id: 'servicesCurrency', label: 'Services', icon: Server },
  ];

  return (
    <>
      <Card className="glassmorphism border-slate-600/50">
        <CardHeader>
          <CardTitle className="flex items-center text-xl text-slate-200"><DollarSign className="mr-2 h-5 w-5 text-green-400" /> Global Default Currency</CardTitle>
          <CardDescription className="text-slate-400">Set the main default currency for the application.</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={settings.defaultCurrency} onValueChange={(value) => setSettings(prev => ({ ...prev, defaultCurrency: value }))}>
            <SelectTrigger className="w-full bg-slate-700 border-slate-600"><SelectValue placeholder="Select currency" /></SelectTrigger>
            <SelectContent className="bg-slate-700 border-slate-600 max-h-60" position="popper">
              {currencies.map(curr => <SelectItem key={curr.code} value={curr.code}>{curr.code}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="glassmorphism border-indigo-500/50">
        <CardHeader>
          <CardTitle className="flex items-center text-xl text-slate-200"><Globe className="mr-2 h-5 w-5 text-indigo-400" /> Multi-Currency Conversion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="conversion-switch" className="font-medium text-slate-300">Enable Currency Conversion</Label>
            <Switch id="conversion-switch" checked={settings.enableCurrencyConversion} onCheckedChange={(checked) => setSettings(prev => ({...prev, enableCurrencyConversion: checked}))} />
          </div>
          {settings.enableCurrencyConversion && (
            <>
              <div className="flex items-center justify-between">
                <Label htmlFor="original-switch" className="font-medium text-slate-300">Show Original Currency</Label>
                <Switch id="original-switch" checked={settings.showOriginalCurrency} onCheckedChange={(checked) => setSettings(prev => ({...prev, showOriginalCurrency: checked}))} />
              </div>
              <div className="border-t border-slate-700 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-slate-400">
                    {exchangeRatesInfo.lastUpdated ? `Rates last updated: ${new Date(exchangeRatesInfo.lastUpdated).toLocaleString()}` : 'No rates loaded'}
                  </p>
                  <Button variant="outline" onClick={handleRefreshRates} disabled={refreshingRates} className="border-primary text-primary hover:bg-primary/20">
                    <RefreshCw className={`mr-2 h-4 w-4 ${refreshingRates ? 'animate-spin' : ''}`} /> Refresh
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <h2 className="text-2xl font-semibold text-slate-300 mt-8 mb-4">Section-Specific Currencies</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sectionCurrencySettings.map(section => (
          <Card key={section.id} className="glassmorphism border-slate-600/50">
            <CardHeader>
              <CardTitle className="flex items-center text-lg text-slate-200"><section.icon className="mr-2 h-5 w-5 text-primary" /> {section.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={settings[section.id]} onValueChange={(value) => setSettings(prev => ({ ...prev, [section.id]: value }))}>
                <SelectTrigger className="w-full bg-slate-700 border-slate-600"><SelectValue placeholder="Select currency" /></SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600 max-h-60" position="popper">
                  {currencies.map(curr => <SelectItem key={curr.code} value={curr.code}>{curr.code}</SelectItem>)}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
};

export default CurrencySettings;
