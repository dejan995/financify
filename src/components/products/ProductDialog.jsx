
import React, { useState, useEffect, useContext } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScanLine } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { AppContext } from '@/contexts/AppContext';
import { currencies } from '@/lib/currencies';
import SkuScanner from '@/components/SkuScanner';
import { Loader2 } from 'lucide-react';

const ProductDialog = ({ isOpen, onOpenChange, currentProduct, onSaveSuccess }) => {
  const { toast } = useToast();
  const { categories, productsCurrency, addProduct, updateProduct } = useContext(AppContext);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState(productsCurrency);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (currentProduct) {
      setName(currentProduct.name);
      setSku(currentProduct.sku || '');
      setCategoryId(currentProduct.category_id || '');
      setPrice(currentProduct.default_price ? currentProduct.default_price.toString() : '');
      setCurrency(currentProduct.currency || productsCurrency);
      setNotes(currentProduct.notes || '');
    } else {
      setName('');
      setSku('');
      setCategoryId('');
      setPrice('');
      setCurrency(productsCurrency);
      setNotes('');
    }
  }, [currentProduct, isOpen, productsCurrency]);

  const handleScanSuccess = (decodedText) => {
    setSku(decodedText);
    setIsScannerOpen(false);
    toast({ title: "SKU Scanned!", description: `SKU: ${decodedText}` });
  };

  const handleScanError = (msg) => {
    toast({ title: "Scanner Issue", description: msg, variant: "destructive" });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name) {
      toast({ title: "Product name is required", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    const productData = { 
      name, 
      sku: sku || null, 
      category_id: categoryId || null, 
      default_price: price ? parseFloat(price) : null, 
      currency, 
      notes,
    };
    
    try {
        if (currentProduct) {
            updateProduct(currentProduct.id, productData);
        } else {
            addProduct(productData);
        }
        toast({ title: `Product saved` });
        onSaveSuccess();
    } catch (error) {
        toast({ title: "Error saving product", description: error.message, variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader><DialogTitle>{currentProduct ? 'Edit' : 'Add'} Product</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="name" className="text-right">Name*</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" /></div>
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="sku" className="text-right">SKU</Label><div className="col-span-3 flex gap-2"><Input id="sku" value={sku} onChange={(e) => setSku(e.target.value)} /><Button type="button" variant="outline" size="icon" onClick={() => setIsScannerOpen(true)}><ScanLine className="h-4 w-4"/></Button></div></div>
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="category" className="text-right">Category</Label><Select value={categoryId} onValueChange={setCategoryId}><SelectTrigger className="col-span-3"><SelectValue placeholder="Select..."/></SelectTrigger><SelectContent>{categories.filter(c=>c.type==='product'||c.type==='general').map(c=><SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="price" className="text-right">Price</Label><div className="col-span-3 flex gap-2"><Input id="price" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} /><Select value={currency} onValueChange={setCurrency}><SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger><SelectContent>{currencies.map(c => <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>)}</SelectContent></Select></div></div>
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="notes" className="text-right">Notes</Label><textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="col-span-3 bg-slate-700 p-2 rounded-md"></textarea></div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button></DialogClose>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}><DialogContent className="p-0"><SkuScanner onScanSuccess={handleScanSuccess} onScanError={handleScanError} onClose={() => setIsScannerOpen(false)}/></DialogContent></Dialog>
    </>
  );
};

export default ProductDialog;
