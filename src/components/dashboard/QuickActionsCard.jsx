import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const QuickActionsCard = () => {
  const navigate = useNavigate();
  return (
    <Card className="glassmorphism border-orange-500/30">
      <CardHeader>
        <CardTitle className="text-xl text-slate-200">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-4">
        <Button className="bg-gradient-to-r from-green-500 to-lime-500 hover:from-green-600 hover:to-lime-600 text-white" onClick={() => navigate("/cashflow")}>Add Income</Button>
        <Button className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white" onClick={() => navigate("/expenses")}>Add Expense</Button>
        <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white" onClick={() => navigate("/budgets")}>Create Budget</Button>
        <Button className="bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-white" onClick={() => navigate("/savings")}>Set Savings Goal</Button>
      </CardContent>
    </Card>
  );
};

export default QuickActionsCard;