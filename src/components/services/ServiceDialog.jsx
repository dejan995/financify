
import React, { useState, useEffect, useContext } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/components/ui/use-toast';
import { AppContext } from '@/contexts/AppContext';
import { currencies } from '@/lib/currencies';
import { Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

const ServiceDialog = ({ isOpen, onOpenChange, currentService, onSaveSuccess }) => {
  const { toast } = useToast();
  const { categories, servicesCurrency, creditCards, addService, updateService } = useContext(AppContext);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(servicesCurrency);
  const [recurrenceInterval, setRecurrenceInterval] = useState('monthly');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [isActive, setIsActive] = useState(true);
  const [categoryId, setCategoryId] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentSourceType, setPaymentSourceType] = useState('cash_flow');
  const [paymentSourceId, setPaymentSourceId] = useState(null);
  
  const resetForm = () => {
    setName('');
    setAmount('');
    setCurrency(servicesCurrency);
    setRecurrenceInterval('monthly');
    setStartDate(new Date().toISOString().slice(0, 10));
    setIsActive(true);
    setCategoryId('');
    setNotes('');
    setPaymentSourceType('cash_flow');
    setPaymentSourceId(null);
  };

  useEffect(() => {
    if (isOpen) {
      if (currentService) {
        setName(currentService.name);
        setAmount(currentService.amount.toString());
        setCurrency(currentService.currency);
        setRecurrenceInterval(currentService.recurrence_interval);
        setStartDate(new Date(currentService.start_date).toISOString().slice(0, 10));
        setIsActive(currentService.is_active);
        setCategoryId(currentService.category_id || '');
        setNotes(currentService.notes || '');
        setPaymentSourceType(currentService.payment_source_type || 'cash_flow');
        setPaymentSourceId(currentService.payment_source_id || null);
      } else {
        resetForm();
      }
    }
  }, [currentService, isOpen, servicesCurrency]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const serviceData = {
        name,
        amount: parseFloat(amount),
        currency,
        recurrence_interval: recurrenceInterval,
        start_date: startDate,
        is_active: isActive,
        category_id: categoryId || null,
        notes,
        next_due_date: startDate, // Simplified for local mode
        payment_source_type: paymentSourceType,
        payment_source_id: paymentSourceId,
    };
    
    try {
        if (currentService) {
            updateService(currentService.id, serviceData);
        } else {
            addService(serviceData);
        }
        toast({ title: `Service saved` });
        onSaveSuccess();
    } catch (error) {
        toast({ title: "Error saving service", description: error.message, variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700">
        <DialogHeader><DialogTitle>{currentService ? 'Edit' : 'Add'} Service</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="name" className="text-right">Name</Label><Input id="name" value={name} onChange={e => setName(e.target.value)} className="col-span-3" required /></div>
          <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="amount" className="text-right">Amount</Label><div className="col-span-3 flex gap-2"><Input id="amount" type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required /><Select value={currency} onValueChange={setCurrency}><SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger><SelectContent>{currencies.map(c => <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>)}</SelectContent></Select></div></div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="paymentSource" className="text-right">Source</Label>
            <Select
              value={paymentSourceType === 'credit_card' ? paymentSourceId || '' : 'cash_flow'}
              onValueChange={(value) => {
                  if (value === 'cash_flow') {
                      setPaymentSourceType('cash_flow');
                      setPaymentSourceId(null);
                  } else {
                      setPaymentSourceType('credit_card');
                      setPaymentSourceId(value);
                  }
              }}
            >
              <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a source" />
              </SelectTrigger>
              <SelectContent>
                  <SelectItem value="cash_flow">Cash Flow</SelectItem>
                  {creditCards.map(card => (
                      <SelectItem key={card.id} value={card.id}>
                          {card.card_name} (....{card.last_four_digits})
                      </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="recurrenceInterval" className="text-right">Recurs</Label><Select value={recurrenceInterval} onValueChange={setRecurrenceInterval}><SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="daily">Daily</SelectItem><SelectItem value="weekly">Weekly</SelectItem><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="yearly">Yearly</SelectItem></SelectContent></Select></div>
          <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="startDate" className="text-right">Start Date</Label><Input id="startDate" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="col-span-3" required /></div>
          <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="categoryId" className="text-right">Category</Label><Select value={categoryId} onValueChange={setCategoryId}><SelectTrigger className="col-span-3"><SelectValue placeholder="Select a category" /></SelectTrigger><SelectContent>{categories.filter(c => c.type === 'expense' || c.type === 'general').map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
          <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="notes" className="text-right">Notes</Label><Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="col-span-3" /></div>
          <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="isActive" className="text-right">Active</Label><Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} /></div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button></DialogClose>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceDialog;
