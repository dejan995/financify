import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

const DashboardHeader = ({ enableCurrencyConversion, refreshingRates, handleRefreshRates }) => (
  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
    <h1 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">Dashboard</h1>
    {enableCurrencyConversion && (
      <Button 
        variant="outline" 
        onClick={handleRefreshRates}
        disabled={refreshingRates}
        className="border-indigo-500 text-indigo-400 hover:bg-indigo-500/20"
      >
        <RefreshCw className={`mr-2 h-4 w-4 ${refreshingRates ? 'animate-spin' : ''}`} />
        Refresh Rates
      </Button>
    )}
  </div>
);

export default DashboardHeader;