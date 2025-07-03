import React, { useState, useContext } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Tag as TagIcon, PlusCircle, Edit, Trash2, PieChart } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { AppContext } from '@/contexts/AppContext';
import ReportCard from '@/components/reports/ReportCard';
import CategoryDialog from '@/components/categories/CategoryDialog';
import { supabase } from '@/lib/customSupabaseClient';

const CategoriesPage = () => {
  const { toast } = useToast();
  const { categories, refreshAppData } = useContext(AppContext);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);

  const handleAddCategory = () => {
    setCurrentCategory(null);
    setIsDialogOpen(true);
  };

  const handleEditCategory = (category) => {
    setCurrentCategory(category);
    setIsDialogOpen(true);
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) {
      toast({ title: "Error deleting category", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Category Deleted" });
      refreshAppData();
    }
  };

  const handleSaveSuccess = () => {
    setIsDialogOpen(false);
    refreshAppData();
  };
  
  return (
    <>
      <Helmet><title>Categories - Financify</title></Helmet>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">Categories</h1>
          <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white" onClick={handleAddCategory}><PlusCircle className="mr-2 h-4 w-4" /> Add Category</Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="glassmorphism border-teal-500/30">
              <CardHeader><CardTitle>Category List</CardTitle><CardDescription>Organize your finances by grouping items.</CardDescription></CardHeader>
              <CardContent>
                {categories.length === 0 ? (
                  <div className="text-center py-10">
                    <TagIcon className="mx-auto h-12 w-12 text-slate-500" />
                    <h3 className="mt-2 text-lg">No Categories Created Yet</h3>
                    <Button className="mt-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white" onClick={handleAddCategory}>Create First Category</Button>
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
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          <div className="space-y-8">
            <ReportCard 
              reportType="category-usage"
              title="Category Usage"
              description="Breakdown of expenses by category."
              icon={PieChart}
              color="text-teal-400"
            />
          </div>
        </div>
      </motion.div>

      <CategoryDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        currentCategory={currentCategory}
        onSaveSuccess={handleSaveSuccess}
      />
    </>
  );
};

export default CategoriesPage;