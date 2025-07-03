import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const RecentTransactionsCard = ({ transactions, formatCurrencyWithConversion }) => {
  const navigate = useNavigate();
  return (
    <Card className="glassmorphism border-purple-500/30 flex flex-col">
      <CardHeader>
        <CardTitle className="text-xl text-slate-200">Recent Transactions</CardTitle>
        <CardDescription className="text-slate-400">
          Your latest income and outflows.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        {transactions.length > 0 ? (
          <ul className="space-y-3">
            {transactions.map(tx => (
              <li key={tx.id} className="flex justify-between items-center p-2 rounded-md bg-slate-700/30">
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-medium text-slate-200 truncate">{tx.description || (tx.type === 'income' ? 'Income' : 'Outflow')}</p>
                  <p className="text-xs text-slate-400">{new Date(tx.transaction_date).toLocaleDateString()}</p>
                </div>
                <span className={`text-sm font-semibold ml-4 flex-shrink-0 ${tx.type === 'income' ? 'text-green-400' : 'text-red-400'}`}
                  dangerouslySetInnerHTML={{ __html: `${tx.type === 'income' ? '+' : '-'}${formatCurrencyWithConversion(tx.amount, tx.currency)}`}}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-300">No recent transactions. Add income or expenses to see them here.</p>
        )}
      </CardContent>
      <div className="p-6 pt-4">
        <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white" onClick={() => navigate("/cashflow")}>
          View All Transactions
        </Button>
      </div>
    </Card>
  );
};

export default RecentTransactionsCard;