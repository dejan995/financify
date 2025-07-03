import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const CurrencyInfoBanner = ({ enableCurrencyConversion, defaultCurrency, exchangeRatesInfo }) => {
  const navigate = useNavigate();

  if (enableCurrencyConversion) {
    return (
      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
        <p className="text-sm text-slate-300">
          <span className="text-indigo-400 font-medium">Multi-Currency Mode:</span> All amounts are converted to {defaultCurrency} using live exchange rates.
        </p>
        {exchangeRatesInfo.lastUpdated && (
          <p className="text-xs text-slate-400 mt-1">
            Last updated: {new Date(exchangeRatesInfo.lastUpdated).toLocaleString()} 
            ({exchangeRatesInfo.ratesCount} currencies available)
          </p>
        )}
      </div>
    );
  }

  return (
    <p className="text-sm text-slate-400">
      Summary figures show only items in your default currency: {defaultCurrency}. 
      <Button variant="link" className="text-indigo-400 hover:text-indigo-300 p-0 h-auto ml-1" onClick={() => navigate("/settings")}>
        Enable multi-currency conversion
      </Button>
    </p>
  );
};

export default CurrencyInfoBanner;