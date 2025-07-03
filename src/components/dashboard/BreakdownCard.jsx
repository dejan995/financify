import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';

const BreakdownCard = ({ enableCurrencyConversion, currencyBreakdown, formatCurrency }) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleNotImplemented = (feature) => {
    toast({
      title: "🚧 Feature Coming Soon!",
      description: `The "${feature}" functionality is not yet implemented. Stay tuned! 🚀`,
      variant: "default",
    });
  };

  return (
    <Card className="glassmorphism border-teal-500/30 flex flex-col">
      <CardHeader>
        <CardTitle className="text-xl text-slate-200">
          {enableCurrencyConversion ? 'Currency Overview' : 'Expense Breakdown'}
        </CardTitle>
        <CardDescription className="text-slate-400">
          {enableCurrencyConversion 
            ? 'Your financial data across different currencies.' 
            : 'Visual representation of your spending.'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col items-center justify-center">
        {enableCurrencyConversion && Object.keys(currencyBreakdown).length > 0 ? (
          <div className="w-full space-y-3">
            {Object.entries(currencyBreakdown).map(([currency, amount]) => (
              <div key={currency} className="flex justify-between items-center p-2 rounded-md bg-slate-700/30">
                <span className="text-sm font-medium text-slate-200">{currency}</span>
                <span className="text-sm text-slate-300">{formatCurrency(amount, currency)}</span>
              </div>
            ))}
          </div>
        ) : (
          <>
            <BarChart2 className="h-16 w-16 text-teal-400 mb-4" />
            <p className="text-slate-300 text-center">
              {enableCurrencyConversion 
                ? 'No multi-currency data available yet.' 
                : 'Expense chart will appear here once data is available and charting is implemented.'
              }
            </p>
          </>
        )}
      </CardContent>
      <div className="p-6 pt-4">
        <Button className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white" onClick={() => enableCurrencyConversion ? navigate("/settings") : handleNotImplemented("View Chart Details")}>
          {enableCurrencyConversion ? 'Manage Currencies' : 'View Details'}
        </Button>
      </div>
    </Card>
  );
};

export default BreakdownCard;