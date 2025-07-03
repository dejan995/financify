
import React, { useState, useEffect, useContext } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { AppContext } from '@/contexts/AppContext';
import { currencies } from '@/lib/currencies';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from 'lucide-react';

const CreditCardDialog = ({ isOpen, setIsOpen, card, onSuccess }) => {
  const { toast } = useToast();
  const { defaultCurrency, addCreditCard, updateCreditCard } = useContext(AppContext);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (card) {
      setFormData({
        id: card.id,
        card_name: card.card_name || '',
        last_four_digits: card.last_four_digits || '',
        card_issuer: card.card_issuer || '',
        credit_limit: card.credit_limit || '',
        current_balance: card.current_balance || '',
        statement_date: card.statement_date || '',
        due_date: card.due_date || '',
        currency: card.currency || defaultCurrency,
        notes: card.notes || '',
      });
    } else {
      setFormData({
        card_name: '',
        last_four_digits: '',
        card_issuer: '',
        credit_limit: '',
        current_balance: '0',
        statement_date: '',
        due_date: '',
        currency: defaultCurrency,
        notes: '',
      });
    }
  }, [card, isOpen, defaultCurrency]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };
  
  const handleCurrencyChange = (value) => {
    setFormData((prev) => ({ ...prev, currency: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    
    if ((formData.statement_date && (parseInt(formData.statement_date) < 1 || parseInt(formData.statement_date) > 31)) ||
        (formData.due_date && (parseInt(formData.due_date) < 1 || parseInt(formData.due_date) > 31))) {
      toast({ title: 'Invalid Date', description: 'Statement and due dates must be between 1 and 31.', variant: 'destructive' });
      setLoading(false);
      return;
    }

    const cardData = {
      ...formData,
      credit_limit: parseFloat(formData.credit_limit),
      current_balance: parseFloat(formData.current_balance),
      statement_date: formData.statement_date ? parseInt(formData.statement_date) : null,
      due_date: formData.due_date ? parseInt(formData.due_date) : null,
    };
    delete cardData.id;

    try {
        if (card) {
            updateCreditCard(card.id, cardData);
        } else {
            addCreditCard(cardData);
        }
        toast({ title: `Credit Card ${card ? 'Updated' :'Added'}`, description: `${formData.card_name} was successfully saved.` });
        onSuccess();
    } catch (error) {
        toast({ title: 'Error Saving Card', description: error.message, variant: 'destructive' });
    } finally {
        setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="bg-slate-900 text-white border-slate-700 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{card ? 'Edit Credit Card' : 'Add New Credit Card'}</DialogTitle>
          <DialogDescription>
            {card ? 'Update the details of your credit card.' : 'Fill in the details for your new credit card.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="card_name" className="text-right">Name</Label>
            <Input id="card_name" value={formData.card_name || ''} onChange={handleChange} className="col-span-3 bg-slate-800 border-slate-600" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="last_four_digits" className="text-right">Last 4 Digits</Label>
            <Input id="last_four_digits" value={formData.last_four_digits || ''} onChange={handleChange} className="col-span-3 bg-slate-800 border-slate-600" required maxLength="4" pattern="\d{4}" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="card_issuer" className="text-right">Issuer</Label>
            <Input id="card_issuer" value={formData.card_issuer || ''} onChange={handleChange} className="col-span-3 bg-slate-800 border-slate-600" placeholder="e.g., Visa, Amex" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="credit_limit" className="text-right">Limit</Label>
            <Input id="credit_limit" type="number" step="0.01" value={formData.credit_limit || ''} onChange={handleChange} className="col-span-3 bg-slate-800 border-slate-600" required />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="current_balance" className="text-right">Current Balance</Label>
            <Input id="current_balance" type="number" step="0.01" value={formData.current_balance || ''} onChange={handleChange} className="col-span-3 bg-slate-800 border-slate-600" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="currency" className="text-right">Currency</Label>
            <Select onValueChange={handleCurrencyChange} value={formData.currency || defaultCurrency}>
              <SelectTrigger className="col-span-3 bg-slate-800 border-slate-600">
                <SelectValue placeholder="Select a currency" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 text-white border-slate-700">
                {currencies.map(c => <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="statement_date" className="text-right">Statement Day</Label>
            <Input id="statement_date" type="number" min="1" max="31" value={formData.statement_date || ''} onChange={handleChange} className="col-span-3 bg-slate-800 border-slate-600" placeholder="Day of month (1-31)" />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="due_date" className="text-right">Due Day</Label>
            <Input id="due_date" type="number" min="1" max="31" value={formData.due_date || ''} onChange={handleChange} className="col-span-3 bg-slate-800 border-slate-600" placeholder="Day of month (1-31)" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="notes" className="text-right">Notes</Label>
            <Textarea id="notes" value={formData.notes || ''} onChange={handleChange} className="col-span-3 bg-slate-800 border-slate-600" />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {card ? 'Save Changes' : 'Add Card'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreditCardDialog;
