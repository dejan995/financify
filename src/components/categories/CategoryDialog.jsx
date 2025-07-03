
import React, { useState, useEffect, useContext } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { AppContext } from '@/contexts/AppContext';

const CategoryDialog = ({ isOpen, onOpenChange, currentCategory, onSaveSuccess }) => {
  const { toast } = useToast();
  const { addCategory, updateCategory } = useContext(AppContext);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [type, setType] = useState('general');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (currentCategory) {
      setName(currentCategory.name);
      setType(currentCategory.type || 'general');
      setNotes(currentCategory.notes || '');
    } else {
      setName('');
      setType('general');
      setNotes('');
    }
  }, [currentCategory, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: "Category name is required", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    const categoryData = { 
      name: name.trim(), 
      type, 
      notes: notes.trim(),
    };
    
    try {
        if (currentCategory) {
            updateCategory(currentCategory.id, categoryData);
        } else {
            addCategory(categoryData);
        }
        toast({ title: `Category saved` });
        onSaveSuccess();
    } catch (error) {
        toast({ title: "Error saving category", description: error.message, variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700">
        <DialogHeader><DialogTitle>{currentCategory ? 'Edit' : 'Add'} Category</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name*</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" disabled={isSubmitting} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">Type</Label>
            <Select value={type} onValueChange={setType} disabled={isSubmitting}>
              <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="product">Product</SelectItem>
                <SelectItem value="income">Income</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="notes" className="text-right">Notes</Label>
            <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="col-span-3 bg-slate-700 p-2 rounded-md" disabled={isSubmitting}></textarea>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button></DialogClose>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryDialog;
