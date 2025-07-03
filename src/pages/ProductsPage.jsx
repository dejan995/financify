import React, { useState, useContext } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { PackagePlus, Package, Edit, Trash2, BarChart2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { AppContext } from '@/contexts/AppContext';
import ProductDialog from '@/components/products/ProductDialog';
import CurrencyInfoBanner from '@/components/dashboard/CurrencyInfoBanner';
import ReportCard from '@/components/reports/ReportCard';
import { supabase } from '@/lib/customSupabaseClient';

const ProductsPage = () => {
  const { toast } = useToast();
  const { products, categories, refreshAppData, productsCurrency, enableCurrencyConversion, defaultCurrency, getExchangeRatesInfo } = useContext(AppContext);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);

  const handleAddProduct = () => {
    setCurrentProduct(null);
    setIsDialogOpen(true);
  };

  const handleEditProduct = (product) => {
    setCurrentProduct(product);
    setIsDialogOpen(true);
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Are you sure? This will also delete associated expenses.")) return;
    
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      toast({ title: "Error deleting product", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Product Deleted" });
      refreshAppData();
    }
  };

  const handleSaveSuccess = () => {
    setIsDialogOpen(false);
    refreshAppData();
  };

  const formatCurrencyDisplay = (amount, currencyCode) => {
    if (amount === null || amount === undefined) return 'N/A';
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).format(amount);
    } catch (e) {
      return 'Invalid Currency';
    }
  };

  return (
    <>
      <Helmet><title>Products - Financify</title></Helmet>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-500">Products</h1>
          <Button className="bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white" onClick={handleAddProduct}>
            <PackagePlus className="mr-2 h-4 w-4" /> Add Product
          </Button>
        </div>

        <CurrencyInfoBanner 
          enableCurrencyConversion={enableCurrencyConversion}
          defaultCurrency={defaultCurrency}
          exchangeRatesInfo={getExchangeRatesInfo()}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="glassmorphism border-cyan-500/30">
              <CardHeader>
                <CardTitle>Product List</CardTitle>
                <CardDescription>Default currency for new entries: {productsCurrency}</CardDescription>
              </CardHeader>
              <CardContent>
                {products.length === 0 ? (
                  <div className="text-center py-10">
                    <Package className="mx-auto h-12 w-12 text-slate-500" />
                    <h3 className="mt-2 text-lg">No Products Added Yet</h3>
                    <Button className="mt-6 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white" onClick={handleAddProduct}>Add First Product</Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs uppercase bg-slate-700/50">
                        <tr><th className="px-6 py-3">Name</th><th className="px-6 py-3">SKU</th><th className="px-6 py-3">Category</th><th className="px-6 py-3">Price</th><th className="px-6 py-3">Actions</th></tr>
                      </thead>
                      <tbody>
                        {products.map((product) => {
                          const category = categories.find(c => c.id === product.category_id);
                          return (
                          <tr key={product.id} className="border-b border-slate-700 hover:bg-slate-700/30">
                            <td className="px-6 py-4 font-medium">{product.name}</td>
                            <td className="px-6 py-4">{product.sku || 'N/A'}</td>
                            <td className="px-6 py-4">{category?.name || 'N/A'}</td>
                            <td className="px-6 py-4">{formatCurrencyDisplay(product.default_price, product.currency)}</td>
                            <td className="px-6 py-4 flex items-center gap-4">
                              <div className="flex space-x-2">
                                <Button variant="ghost" size="icon" onClick={() => handleEditProduct(product)}><Edit className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="text-red-400" onClick={() => handleDeleteProduct(product.id)}><Trash2 className="h-4 w-4" /></Button>
                              </div>
                            </td>
                          </tr>
                        )})}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          <div className="space-y-8">
            <ReportCard
              reportType="product-cost-comparison"
              title="Product Cost Comparison"
              description="Analytics on your most expensive products."
              icon={BarChart2}
              color="text-cyan-400"
            />
          </div>
        </div>
      </motion.div>

      <ProductDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        currentProduct={currentProduct}
        onSaveSuccess={handleSaveSuccess}
      />
    </>
  );
};

export default ProductsPage;