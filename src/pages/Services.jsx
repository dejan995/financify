
import React, { useState, useEffect, useContext } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Server, PlusCircle, Edit, Trash2, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Switch } from "@/components/ui/switch";
import { supabase } from '@/lib/customSupabaseClient';
import { AppContext } from '@/contexts/AppContext';
import ServiceDialog from '@/components/services/ServiceDialog';
import ChangeLog from '@/components/ChangeLog';
import CurrencyInfoBanner from '@/components/dashboard/CurrencyInfoBanner';

const ServicesPage = () => {
  const { toast } = useToast();
  const { servicesCurrency, fetchCategories, user, household, enableCollaboration, enableCurrencyConversion, defaultCurrency, getExchangeRatesInfo } = useContext(AppContext);
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentService, setCurrentService] = useState(null);

  const fetchServices = async () => {
    setIsLoading(true);
    let query = supabase.from('services');
    if (enableCollaboration && household) {
      query = query.select(`*, categories(name), created_by_profile:profiles!created_by(full_name), updated_by_profile:profiles!updated_by(full_name)`)
                   .eq('household_id', household.id);
    } else if (enableCollaboration && !household) {
      setServices([]); setIsLoading(false); return;
    } else {
      query = query.select(`*, categories(name)`).is('household_id', null);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) toast({ title: "Error fetching services", variant: "destructive" });
    else setServices(data);
    setIsLoading(false);
  };

  useEffect(() => {
    if (enableCollaboration && !household) { setIsLoading(false); return; }
    fetchServices();
    fetchCategories();
  }, [user, household, enableCollaboration]);

  const handleAdd = () => { setCurrentService(null); setIsDialogOpen(true); };
  const handleEdit = (service) => { setCurrentService(service); setIsDialogOpen(true); };
  const handleSave = () => { setIsDialogOpen(false); fetchServices(); };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) toast({ title: "Error deleting service", variant: "destructive" });
    else { toast({ title: "Service Deleted" }); fetchServices(); }
  };

  const handleToggleActive = async (service) => {
    const newStatus = !service.is_active;
    const { error } = await supabase.from('services').update({ is_active: newStatus, updated_by: user.id }).eq('id', service.id);
    if (error) toast({ title: "Error updating status", variant: "destructive" });
    else { toast({ title: `Service ${newStatus ? 'Activated' : 'Deactivated'}` }); fetchServices(); }
  };

  const formatCurrencyDisplay = (amount, currencyCode) => new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).format(amount);

  return (
    <>
      <Helmet><title>Services - Financify</title></Helmet>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Services</h1>
          <Button onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" /> Add Service</Button>
        </div>

        <CurrencyInfoBanner 
          enableCurrencyConversion={enableCurrencyConversion}
          defaultCurrency={defaultCurrency}
          exchangeRatesInfo={getExchangeRatesInfo()}
        />

        {isLoading ? <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div>
        : services.length === 0 ? (
          <Card className="glassmorphism border-cyan-500/30">
            <CardHeader className="text-left">
              <CardTitle>No Services Added</CardTitle>
              <CardDescription>Default currency: {servicesCurrency}</CardDescription>
            </CardHeader>
            <CardContent className="py-10 text-left">
              <Server className="h-12 w-12 text-slate-500 mb-4" />
              <p className="mt-2 text-lg">Automate recurring expenses!</p>
              <Button className="mt-6" onClick={handleAdd}>Add First Service</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map(service => (
              <motion.div key={service.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <Card className={`glassmorphism border-cyan-500/30 h-full flex flex-col ${!service.is_active && 'opacity-60'}`}>
                  <CardHeader><div className="flex justify-between items-start"><CardTitle>{service.name}</CardTitle><span className="text-xs bg-slate-700 px-2 py-1 rounded-full capitalize">{service.recurrence_interval}</span></div><CardDescription>{service.categories?.name || 'Uncategorized'}</CardDescription></CardHeader>
                  <CardContent className="flex-grow space-y-3">
                    <p className="text-2xl font-bold text-cyan-300">{formatCurrencyDisplay(service.amount, service.currency)}</p>
                    {service.recurrence_interval !== 'none' && (<div><p className="text-sm">Next payment:</p><p className="font-medium">{new Date(service.next_due_date).toLocaleDateString()}</p></div>)}
                    {enableCollaboration && <ChangeLog createdBy={service.created_by_profile} createdAt={service.created_at} updatedBy={service.updated_by_profile} updatedAt={service.updated_at} className="pt-2" />}
                  </CardContent>
                  <CardFooter className="p-4 border-t border-slate-700/50 flex justify-between items-center">
                    <div className="flex items-center space-x-2"><Switch id={`a-${service.id}`} checked={service.is_active} onCheckedChange={() => handleToggleActive(service)} /><label htmlFor={`a-${service.id}`} className="text-sm cursor-pointer">{service.is_active ? 'Active' : 'Inactive'}</label></div>
                    <div className="flex space-x-2"><Button variant="outline" size="icon" onClick={() => handleEdit(service)}><Edit className="h-4 w-4" /></Button><Button variant="destructive" size="icon" onClick={() => handleDelete(service.id)}><Trash2 className="h-4 w-4" /></Button></div>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
      <ServiceDialog isOpen={isDialogOpen} onOpenChange={setIsDialogOpen} currentService={currentService} onSave={handleSave} />
    </>
  );
};

export default ServicesPage;
  