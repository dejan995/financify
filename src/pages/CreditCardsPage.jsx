import React, { useState, useContext } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { PlusCircle, CreditCard, MoreHorizontal, PieChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { AppContext } from '@/contexts/AppContext';
import CreditCardDialog from '@/components/credit-cards/CreditCardDialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import ReportCard from '@/components/reports/ReportCard';
import CurrencyAwareTabs from '@/components/CurrencyAwareTabs';
import { supabase } from '@/lib/customSupabaseClient';

const CreditCardsPage = () => {
  const { toast } = useToast();
  const { creditCards, creditCardsCurrency, setCreditCardsCurrency, formatCurrencyWithConversion, refreshAppData } = useContext(AppContext);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);

  const handleAddCard = () => {
    setSelectedCard(null);
    setIsDialogOpen(true);
  };

  const handleEditCard = (card) => {
    setSelectedCard(card);
    setIsDialogOpen(true);
  };

  const handleDeleteCard = (card) => {
    setSelectedCard(card);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedCard) return;
    const { error } = await supabase.from('credit_cards').delete().eq('id', selectedCard.id);
    if (error) {
      toast({ title: 'Error Deleting Card', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Credit Card Deleted', description: `${selectedCard.card_name} was successfully deleted.` });
      refreshAppData();
    }
    setIsDeleteDialogOpen(false);
    setSelectedCard(null);
  };

  const handleSaveSuccess = () => {
    setIsDialogOpen(false);
    refreshAppData();
  };
  
  const totalDebt = creditCards.reduce((acc, card) => {
    if (card.currency === creditCardsCurrency) {
      return acc + parseFloat(card.current_balance);
    }
    return acc;
  }, 0);

  return (
    <>
      <Helmet>
        <title>Credit Cards - Financify</title>
        <meta name="description" content="Manage your credit cards." />
      </Helmet>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight text-white">Credit Card Management</h1>
          <Button onClick={handleAddCard} className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5" />
            Add Credit Card
          </Button>
        </div>

        <CurrencyAwareTabs
            page="credit-cards"
            currency={creditCardsCurrency}
            onCurrencyChange={setCreditCardsCurrency}
            totalBalance={totalDebt}
            balanceLabel="Total Debt"
        />

        <div className="grid gap-6 md:grid-cols-2">
            <ReportCard 
                reportType="cc-balance"
                title="Card Balance Overview"
                description="Current balance vs. credit limit for each card."
                icon={CreditCard}
                color="text-lime-400"
            />
            <ReportCard 
                reportType="cc-spending-by-category"
                title="Spending by Category"
                description="Breakdown of spending on your credit cards."
                icon={PieChart}
                color="text-amber-400"
            />
        </div>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Your Credit Cards</CardTitle>
          </CardHeader>
          <CardContent>
            {creditCards.length === 0 ? (
                <div className="text-center py-10 text-slate-400 flex flex-col items-center gap-4">
                    <CreditCard className="h-12 w-12 text-slate-500" />
                    <p className="font-semibold">No credit cards found.</p>
                    <p className="text-sm">Get started by adding your first credit card.</p>
                    <Button onClick={handleAddCard} size="sm" className="mt-2">
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Card
                    </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-slate-700/50 border-slate-700">
                    <TableHead className="text-white">Card Name</TableHead>
                    <TableHead className="text-white">Issuer</TableHead>
                    <TableHead className="text-white text-right">Current Balance</TableHead>
                    <TableHead className="text-white text-right">Limit</TableHead>
                    <TableHead className="text-white text-center">Statement Day</TableHead>
                    <TableHead className="text-white text-center">Due Day</TableHead>
                    <TableHead className="text-white text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {creditCards.map((card) => (
                    <TableRow key={card.id} className="hover:bg-slate-700/50 border-slate-700">
                      <TableCell className="font-medium text-slate-200">{card.card_name} (•••• {card.last_four_digits})</TableCell>
                      <TableCell className="text-slate-300">{card.card_issuer}</TableCell>
                      <TableCell className="text-right text-slate-300">{formatCurrencyWithConversion(card.current_balance, card.currency)}</TableCell>
                      <TableCell className="text-right text-slate-300">{formatCurrencyWithConversion(card.credit_limit, card.currency)}</TableCell>
                      <TableCell className="text-center text-slate-300">{card.statement_date}</TableCell>
                      <TableCell className="text-center text-slate-300">{card.due_date}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-slate-800 text-white border-slate-700">
                            <DropdownMenuItem onClick={() => handleEditCard(card)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteCard(card)} className="text-red-400 focus:bg-red-500/20 focus:text-red-400">Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <CreditCardDialog
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        card={selectedCard}
        onSuccess={handleSaveSuccess}
      />
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent className="bg-slate-900 text-white border-slate-700">
              <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your credit card 
                      <span className="font-bold text-amber-400"> {selectedCard?.card_name}</span>.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel className="border-slate-600 hover:bg-slate-800">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CreditCardsPage;