
import React, { useState, useEffect, useContext } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Tag as TagIcon, PlusCircle, ListFilter, Edit, Trash2, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/lib/customSupabaseClient';
import { AppContext } from '@/contexts/AppContext';
import ChangeLog from '@/components/ChangeLog';
import CurrencyInfoBanner from '@/components/dashboard/CurrencyInfoBanner';

const CategoriesPage = () => {
  const { toast } = useToast();
  const { categories, fetchCategories: fetchCategoriesFromContext, user, household, enableCollaboration, enableCurrencyConversion, defaultCurrency, getExchangeRatesInfo } = useContext(AppContext);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);

  const [categoryName, setCategoryName] = useState('');
  const [categoryType, setCategoryType] = useState('general'); 
  const [categoryNotes, setCategoryNotes] = useState('');

  useEffect(() => {
    if (enableCollaboration && !household) {
      setIsLoading(false);
      return;
    }
    fetchCategoriesFromContext().then(() => setIsLoading(false));
  }, [user, household, enableCollaboration]);

  const resetForm = () => {
    setCategoryName('');
    setCategoryType('general');
    setCategoryNotes('');
    setCurrentCategory(null);
  };

  const handleAddCategory = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEditCategory = (category) => {
    setCurrentCategory(category);
    setCategoryName(category.name);
    setCategoryType(category.type || 'general');
    setCategoryNotes(category.notes || '');
    setIsDialogOpen(true);
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) {
      toast({ title: "Error deleting category", description: "It may be linked to existing items.", variant: "destructive" });
    } else {
      toast({ title: "Category Deleted" });
      fetchCategoriesFromContext();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      toast({ title: "Category name is required", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    const categoryData = { name: categoryName.trim(), type: categoryType, notes: categoryNotes.trim() };
    
    if (enableCollaboration) {
      if (!household) { toast({ title: "No Household Found", variant: "destructive" }); setIsSubmitting(false); return; }
      categoryData.household_id = household.id;
    }

    if (currentCategory) {
      categoryData.updated_by = user.id;
    } else {
      categoryData.created_by = user.id;
    }

    const { error } = currentCategory
      ? await supabase.from('categories').update(categoryData).eq('id', currentCategory.id)
      : await supabase.from('categories').insert([categoryData]);

    if (error) {
      toast({ title: `Error saving category`, description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Category saved` });
      fetchCategoriesFromContext();
      setIsDialogOpen(false);
      resetForm();
    }
    setIsSubmitting(false);
  };
  
  return (
    <>
      <Helmet><title>Categories - Financify</title></Helmet>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">Categories</h1>
          <Button onClick={handleAddCategory}><PlusCircle className="mr-2 h-4 w-4" /> Add Category</Button>
        </div>

        <CurrencyInfoBanner 
          enableCurrencyConversion={enableCurrencyConversion}
          defaultCurrency={defaultCurrency}
          exchangeRatesInfo={getExchangeRatesInfo()}
        />

        <Card className="glassmorphism border-teal-500/30">
          <CardHeader><CardTitle>Category List</CardTitle><CardDescription>Organize your finances.</CardDescription></CardHeader>
          <CardContent>
            {isLoading ? <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            : categories.length === 0 ? (
              <div className="py-10">
                <TagIcon className="h-12 w-12 text-slate-500 mb-4" />
                <h3 className="mt-2 text-lg">No Categories Created Yet</h3>
                <Button className="mt-6" onClick={handleAddCategory}>Create First Category</Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-slate-700/50">
                    <tr>
                      <th scope="col" className="px-6 py-3">Name</th>
                      <th scope="col" className="px-6 py-3">Type</th>
                      <th scope="col" className="px-6 py-3">Notes</th>
                      <th scope="col" className="px-6 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category) => (
                      <tr key={category.id} className="border-b border-slate-700 hover:bg-slate-700/30">
                        <td className="px-6 py-4 font-medium">{category.name}</td>
                        <td className="px-6 py-4 capitalize">{category.type}</td>
                        <td className="px-6 py-4">{category.notes || 'N/A'}</td>
                        <td className="px-6 py-4 flex items-center gap-4">
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEditCategory(category)}><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="text-red-400" onClick={() => handleDeleteCategory(category.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                          {enableCollaboration && <ChangeLog createdBy={category.created_by_profile} createdAt={category.created_at} updatedBy={category.updated_by_profile} updatedAt={category.updated_at} />}
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
          <DialogHeader><DialogTitle>{currentCategory ? 'Edit' : 'Add'} Category</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="categoryName" className="text-right">Name*</Label><Input id="categoryName" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} className="col-span-3" disabled={isSubmitting} /></div>
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="categoryTypeField" className="text-right">Type</Label><Select value={categoryType} onValueChange={setCategoryType} disabled={isSubmitting}><SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="general">General</SelectItem><SelectItem value="expense">Expense</SelectItem><SelectItem value="product">Product</SelectItem><SelectItem value="income">Income</SelectItem></SelectContent></Select></div>
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="categoryNotes" className="text-right">Notes</Label><textarea id="categoryNotes" value={categoryNotes} onChange={(e) => setCategoryNotes(e.target.value)} className="col-span-3 bg-slate-700 p-2 rounded-md" disabled={isSubmitting}></textarea></div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button></DialogClose>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CategoriesPage;
  