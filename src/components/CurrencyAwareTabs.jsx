
import React, { useContext } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const CurrencyAwareTabs = ({ page, currency, onCurrencyChange, totalBalance, balanceLabel }) => {
  const { formatCurrencyWithConversion } = useContext(AppContext);
  const popularCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF'];
  
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 rounded-lg bg-slate-800/50 border border-slate-700">
        <Tabs value={currency} onValueChange={onCurrencyChange}>
            <TabsList className="bg-slate-700/50 text-white">
                {popularCurrencies.map(c => (
                    <TabsTrigger key={c} value={c} className="data-[state=active]:bg-primary data-[state=active]:text-white">
                        {c}
                    </TabsTrigger>
                ))}
            </TabsList>
        </Tabs>
        <div className="text-right">
            <p className="text-sm text-slate-400">{balanceLabel} ({currency})</p>
            <p className="text-2xl font-bold text-white">
                {formatCurrencyWithConversion(totalBalance, currency)}
            </p>
        </div>
    </div>
  );
};

export default CurrencyAwareTabs;
