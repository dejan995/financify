
import React, { useState, useEffect, useContext } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScanLine as Scan } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { AppContext } from '@/contexts/AppContext';
import { currencies } from '@/lib/currencies';
import SkuScanner from '@/components/SkuScanner';

const ExpenseDialog = ({ isOpen, onOpenChange, currentExpense, onSaveSuccess }) => {
  const { toast } = useToast();
  const { categories, products, expensesCurrency, creditCards, addExpense, updateExpense } = useContext(AppContext);

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState('');
  const [productId, setProductId] = useState('');
  const [sku, setSku] = useState('');
  const [notes, setNotes] = useState('');
  const [currency, setCurrency] = useState(expensesCurrency);
  const [paymentSourceType, setPaymentSourceType] = useState('cash_flow');
  const [paymentSourceId, setPaymentSourceId] = useState(null);

  const resetForm = () => {
    setName(''); setAmount(''); setDate(new Date().toISOString().split('T')[0]);
    setCategoryId(''); setProductId(''); setSku(''); setNotes('');
    setCurrency(expensesCurrency);
    setPaymentSourceType('cash_flow');
    setPaymentSourceId(null);
  };

  useEffect(() => {
    if (isOpen) {
      if (currentExpense) {
        setName(currentExpense.name);
        setAmount(currentExpense.amount.toString());
        setDate(currentExpense.expense_date ? new Date(currentExpense.expense_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
        setCategoryId(currentExpense.category_id || '');
        setProductId(currentExpense.product_id || '');
        setSku(currentExpense.sku || '');
        setNotes(currentExpense.notes || '');
        setCurrency(currentExpense.currency || expensesCurrency);
        setPaymentSourceType(currentExpense.payment_source_type || 'cash_flow');
        setPaymentSourceId(currentExpense.payment_source_id || null);
      } else {
        resetForm();
      }
    }
  }, [isOpen, currentExpense, expensesCurrency]);

  const populateFormWithProduct = (product) => {
    if (product) {
      setProductId(product.id);
      setSku(product.sku || '');
      if (!name) setName(product.name);
      if (!amount && product.default_price) setAmount(product.default_price.toString());
      if (!currency && product.currency) setCurrency(product.currency);
      else if (!currency) setCurrency(expensesCurrency);
      if (!categoryId && product.category_id) setCategoryId(product.category_id);
    }
  };

  const handleProductChange = (selectedProductId) => {
    const selectedProduct = products.find(p => p.id.toString() === selectedProductId.toString());
    populateFormWithProduct(selectedProduct);
  };

  const handleScanSuccess = (decodedText) => {
    setSku(decodedText);
    setIsScannerOpen(false);
    toast({ title: "SKU Scanned!", description: `SKU: ${decodedText}` });
    const matchedProduct = products.find(p => p.sku === decodedText);
    if (matchedProduct) {
      toast({ title: "Product Found!", description: `Matched: ${matchedProduct.name}` });
      populateFormWithProduct(matchedProduct);
    } else {
      toast({ title: "Product Not Found" });
      setProductId('');
    }
  };

  const handleScanError = (scanErrorMessage) => {
    toast({ title: "Scanner Issue", description: scanErrorMessage, variant: "destructive" });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !amount || !date) {
      toast({ title: "Missing Fields", description: "Please fill in name, amount, and date.", variant: "destructive" });
      return;
    }

    const expenseData = {
      name,
      amount: parseFloat(amount),
      expense_date: date,
      category_id: categoryId || null,
      product_id: productId || null,
      sku: sku || null,
      notes,
      currency,
      payment_source_type: paymentSourceType,
      payment_source_id: paymentSourceId,
    };

    try {
        if (currentExpense) {
            updateExpense(currentExpense.id, expenseData);
        } else {
            addExpense(expenseData);
        }
        toast({ title: `Expense ${currentExpense ? 'updated' : 'added'} successfully` });
        onSaveSuccess();
    } catch (error) {
        toast({ title: "Error saving expense", description: error.message, variant: "destructive" });
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="bg-slate-800 border-slate-700 text-slate-100 sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle className="text-2xl text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-500">
              {currentExpense ? 'Edit Expense' : 'Add New Expense'}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Fill in the details for your expense. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-x-4 gap-y-2">
              <Label htmlFor="expenseName" className="text-left md:text-right text-slate-300">Name*</Label>
              <Input id="expenseName" value={name} onChange={(e) => setName(e.target.value)} className="md:col-span-3 bg-slate-700 border-slate-600 text-slate-100" placeholder="e.g., Groceries, Rent" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-x-4 gap-y-2">
              <Label htmlFor="expenseAmount" className="text-left md:text-right text-slate-300">Amount*</Label>
              <div className="flex items-center gap-2 md:col-span-3">
                <Input id="expenseAmount" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="flex-grow bg-slate-700 border-slate-600 text-slate-100" placeholder="e.g., 50.00" />
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="w-[120px] bg-slate-700 border-slate-600 text-slate-100">
                    <span className="truncate">{currency}</span>
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600 text-slate-100 max-h-60">
                    {currencies.map(curr => (
                      <SelectItem key={curr.code} value={curr.code}>{curr.code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-x-4 gap-y-2">
              <Label htmlFor="paymentSource" className="text-left md:text-right text-slate-300">Source</Label>
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
                <SelectTrigger className="md:col-span-3 bg-slate-700 border-slate-600 text-slate-100">
                    <SelectValue placeholder="Select a source" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600 text-slate-100">
                    <SelectItem value="cash_flow">Cash Flow</SelectItem>
                    {creditCards.map(card => (
                        <SelectItem key={card.id} value={card.id}>
                            {card.card_name} (....{card.last_four_digits})
                        </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-x-4 gap-y-2">
              <Label htmlFor="expenseDate" className="text-left md:text-right text-slate-300">Date*</Label>
              <Input id="expenseDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="md:col-span-3 bg-slate-700 border-slate-600 text-slate-100" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-x-4 gap-y-2">
              <Label htmlFor="expenseCategory" className="text-left md:text-right text-slate-300">Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="md:col-span-3 bg-slate-700 border-slate-600 text-slate-100">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600 text-slate-100">
                  {categories.filter(c => c.type === 'expense' || c.type === 'general').map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-x-4 gap-y-2">
              <Label htmlFor="expenseSku" className="text-left md:text-right text-slate-300">SKU</Label>
              <div className="flex items-center gap-2 md:col-span-3">
                <Input id="expenseSku" value={sku} onChange={(e) => setSku(e.target.value)} className="flex-grow bg-slate-700 border-slate-600 text-slate-100" placeholder="Product SKU (if any)" />
                <Button type="button" variant="outline" size="icon" className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-slate-100" onClick={() => setIsScannerOpen(true)}>
                  <Scan className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-x-4 gap-y-2">
              <Label htmlFor="expenseProduct" className="text-left md:text-right text-slate-300">Product</Label>
              <Select value={productId} onValueChange={handleProductChange}>
                <SelectTrigger className="md:col-span-3 bg-slate-700 border-slate-600 text-slate-100">
                  <SelectValue placeholder="Select a product (optional)" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600 text-slate-100">
                  {products.map(prod => (
                    <SelectItem key={prod.id} value={prod.id}>{prod.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 md:items-start gap-x-4 gap-y-2">
              <Label htmlFor="expenseNotes" className="text-left md:text-right pt-2 text-slate-300">Notes</Label>
              <textarea id="expenseNotes" value={notes} onChange={(e) => setNotes(e.target.value)} className="md:col-span-3 bg-slate-700 border-slate-600 text-slate-100 rounded-md p-2 h-20" placeholder="Any additional notes..."></textarea>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-slate-100">Cancel</Button>
              </DialogClose>
              <Button type="submit" className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white">
                {currentExpense ? 'Save Changes' : 'Add Expense'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-slate-100 p-0 max-w-md">
          <SkuScanner
            onScanSuccess={handleScanSuccess}
            onScanError={handleScanError}
            onClose={() => setIsScannerOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ExpenseDialog;
