
import React, { useState, useEffect, useContext } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { PackagePlus, ScanLine, Package, Edit, Trash2, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/lib/customSupabaseClient';
import { AppContext } from '@/contexts/AppContext';
import currencies from '@/lib/currencies';
import SkuScanner from '@/components/SkuScanner';
import ChangeLog from '@/components/ChangeLog';
import CurrencyInfoBanner from '@/components/dashboard/CurrencyInfoBanner';

const ProductsPage = () => {
  const { toast } = useToast();
  const { categories, fetchCategories, products: contextProducts, fetchProducts: refreshAppContextProducts, productsCurrency, user, household, enableCollaboration, enableCurrencyConversion, defaultCurrency, getExchangeRatesInfo } = useContext(AppContext);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const [productName, setProductName] = useState('');
  const [productSku, setProductSku] = useState('');
  const [productCategory, setProductCategory] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productCurrencyState, setProductCurrencyState] = useState(productsCurrency);
  const [productNotes, setProductNotes] = useState('');

  useEffect(() => {
    if (enableCollaboration && !household) { setIsLoading(false); return; }
    refreshAppContextProducts().then(() => setIsLoading(false));
    if (categories.length === 0) fetchCategories();
  }, [user, household, enableCollaboration]);
  
  useEffect(() => { if (!currentProduct) setProductCurrencyState(productsCurrency); }, [productsCurrency, currentProduct]);

  const resetForm = () => {
    setProductName(''); setProductSku(''); setProductCategory('');
    setProductPrice(''); setProductCurrencyState(productsCurrency);
    setProductNotes(''); setCurrentProduct(null);
  };

  const handleAddProduct = () => { resetForm(); setIsDialogOpen(true); };
  const handleEditProduct = (product) => {
    setCurrentProduct(product); setProductName(product.name);
    setProductSku(product.sku || ''); setProductCategory(product.category_id || '');
    setProductPrice(product.default_price ? product.default_price.toString() : '');
    setProductCurrencyState(product.currency || productsCurrency);
    setProductNotes(product.notes || ''); setIsDialogOpen(true);
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) toast({ title: "Error deleting product", variant: "destructive" });
    else { toast({ title: "Product Deleted" }); refreshAppContextProducts(); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!productName) { toast({ title: "Product name is required", variant: "destructive" }); return; }
    const productData = { name: productName, sku: productSku || null, category_id: productCategory || null, default_price: productPrice ? parseFloat(productPrice) : null, currency: productCurrencyState, notes: productNotes };
    
    if (enableCollaboration) {
      if (!household) { toast({ title: "No Household Found", variant: "destructive" }); return; }
      productData.household_id = household.id;
    }

    if (currentProduct) {
      productData.updated_by = user.id;
    } else {
      productData.created_by = user.id;
    }

    const { error } = currentProduct ? await supabase.from('products').update(productData).eq('id', currentProduct.id) : await supabase.from('products').insert([productData]);
    if (error) toast({ title: `Error saving product`, description: error.message, variant: "destructive" });
    else { toast({ title: `Product saved` }); refreshAppContextProducts(); setIsDialogOpen(false); resetForm(); }
  };

  const handleScanSuccess = (decodedText) => {
    setProductSku(decodedText); setIsScannerOpen(false); 
    if (!isDialogOpen) { handleAddProduct(); setTimeout(() => setProductSku(decodedText), 0); }
    toast({ title: "SKU Scanned!", description: `SKU: ${decodedText}` });
  };
  const handleScanError = (msg) => toast({ title: "Scanner Issue", description: msg, variant: "destructive" });
  const formatCurrencyDisplay = (amount, currencyCode) => amount === null ? 'N/A' : new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).format(amount);

  return (
    <>
      <Helmet><title>Products - Financify</title></Helmet>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-500">Products</h1>
          <div className="flex gap-2">
            <Button onClick={handleAddProduct}><PackagePlus className="mr-2 h-4 w-4" /> Add Product</Button>
            <Button variant="outline" onClick={() => { resetForm(); setIsScannerOpen(true); }}><ScanLine className="mr-2 h-4 w-4" /> Scan SKU</Button>
          </div>
        </div>

        <CurrencyInfoBanner 
          enableCurrencyConversion={enableCurrencyConversion}
          defaultCurrency={defaultCurrency}
          exchangeRatesInfo={getExchangeRatesInfo()}
        />

        <Card className="glassmorphism border-cyan-500/30">
          <CardHeader><CardTitle>Product List</CardTitle><CardDescription>Default currency: {productsCurrency}</CardDescription></CardHeader>
          <CardContent>
            {isLoading ? <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div>
            : contextProducts.length === 0 ? (
              <div className="py-10">
                <Package className="h-12 w-12 text-slate-500 mb-4" />
                <h3 className="mt-2 text-lg">No Products Added Yet</h3>
                <Button className="mt-6" onClick={handleAddProduct}>Add First Product</Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-slate-700/50">
                    <tr><th className="px-6 py-3">Name</th><th className="px-6 py-3">SKU</th><th className="px-6 py-3">Category</th><th className="px-6 py-3">Price</th><th className="px-6 py-3">Actions</th></tr>
                  </thead>
                  <tbody>
                    {contextProducts.map((product) => (
                      <tr key={product.id} className="border-b border-slate-700 hover:bg-slate-700/30">
                        <td className="px-6 py-4 font-medium">{product.name}</td>
                        <td className="px-6 py-4">{product.sku || 'N/A'}</td>
                        <td className="px-6 py-4">{product.categories?.name || 'N/A'}</td>
                        <td className="px-6 py-4">{formatCurrencyDisplay(product.default_price, product.currency)}</td>
                        <td className="px-6 py-4 flex items-center gap-4">
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEditProduct(product)}><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="text-red-400" onClick={() => handleDeleteProduct(product.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                          {enableCollaboration && <ChangeLog createdBy={product.created_by_profile} createdAt={product.created_at} updatedBy={product.updated_by_profile} updatedAt={product.updated_at} />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={isDialogOpen} onOpenChange={(isOpen) => { setIsDialogOpen(isOpen); if (!isOpen) resetForm(); }}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader><DialogTitle>{currentProduct ? 'Edit' : 'Add'} Product</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="productName" className="text-right">Name*</Label><Input id="productName" value={productName} onChange={(e) => setProductName(e.target.value)} className="col-span-3" /></div>
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="productSku" className="text-right">SKU</Label><div className="col-span-3 flex gap-2"><Input id="productSku" value={productSku} onChange={(e) => setProductSku(e.target.value)} /><Button type="button" variant="outline" size="icon" onClick={() => setIsScannerOpen(true)}><ScanLine className="h-4 w-4"/></Button></div></div>
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="productCategory" className="text-right">Category</Label><Select value={productCategory} onValueChange={(v) => setProductCategory(v === 'none' ? '' : v)}><SelectTrigger className="col-span-3"><SelectValue placeholder="Select..."/></SelectTrigger><SelectContent>{categories.filter(c=>c.type==='product'||c.type==='general').map(c=><SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="productPrice" className="text-right">Price</Label><div className="col-span-3 flex gap-2"><Input id="productPrice" type="number" step="0.01" value={productPrice} onChange={(e) => setProductPrice(e.target.value)} /><Select value={productCurrencyState} onValueChange={setProductCurrencyState}><SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger><SelectContent>{currencies.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent></Select></div></div>
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="productNotes" className="text-right">Notes</Label><textarea id="productNotes" value={productNotes} onChange={(e) => setProductNotes(e.target.value)} className="col-span-3 bg-slate-700 p-2 rounded-md"></textarea></div>
            <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose><Button type="submit">Save</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}><DialogContent className="p-0"><SkuScanner onScanSuccess={handleScanSuccess} onScanError={handleScanError} onClose={() => setIsScannerOpen(false)}/></DialogContent></Dialog>
    </>
  );
};

export default ProductsPage;
  