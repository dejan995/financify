import React, { useState, useContext } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Server, PlusCircle, Edit, Trash2, CalendarClock, CreditCard } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AppContext } from '@/contexts/AppContext';
import ServiceDialog from '@/components/services/ServiceDialog';
import CurrencyInfoBanner from '@/components/dashboard/CurrencyInfoBanner';
import ReportCard from '@/components/reports/ReportCard';
import { supabase } from '@/lib/customSupabaseClient';

const ServicesPage = () => {
  const { toast } = useToast();
  const { services, servicesCurrency, formatCurrencyWithConversion, creditCards, enableCurrencyConversion, defaultCurrency, getExchangeRatesInfo, refreshAppData } = useContext(AppContext);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentService, setCurrentService] = useState(null);

  const handleAdd = () => { setCurrentService(null); setIsDialogOpen(true); };
  const handleEdit = (service) => { setCurrentService(service); setIsDialogOpen(true); };
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) {
      toast({ title: "Error deleting service", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Service Deleted" });
      refreshAppData();
    }
  };

  const handleSaveSuccess = () => {
    setIsDialogOpen(false);
    refreshAppData();
  };

  const sortedServices = [...services].sort((a, b) => new Date(a.next_due_date) - new Date(b.next_due_date));

  return (
    <>
      <Helmet><title>Services - Financify</title></Helmet>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Recurring Services</h1>
          <Button className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white" onClick={handleAdd}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Service
          </Button>
        </div>

        <CurrencyInfoBanner 
          enableCurrencyConversion={enableCurrencyConversion}
          defaultCurrency={defaultCurrency}
          exchangeRatesInfo={getExchangeRatesInfo()}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="glassmorphism border-indigo-500/30">
              <CardHeader>
                <CardTitle>Your Services</CardTitle>
                <CardDescription>Default currency for new entries: {servicesCurrency}</CardDescription>
              </CardHeader>
              <CardContent>
                {sortedServices.length === 0 ? (
                  <div className="text-center py-10">
                    <Server className="mx-auto h-12 w-12 text-slate-500" />
                    <h3 className="mt-2 text-lg">No Services Tracked Yet</h3>
                    <Button className="mt-6 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white" onClick={handleAdd}>Add First Service</Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-xs uppercase bg-slate-700/50">
                        <tr>
                          <th className="px-4 py-3 text-left">Service</th>
                          <th className="px-4 py-3 text-left">Amount</th>
                          <th className="px-4 py-3 text-left">Source</th>
                          <th className="px-4 py-3 text-right">Next Due</th>
                          <th className="px-4 py-3 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/50">
                        {sortedServices.map(s => {
                          const card = s.payment_source_type === 'credit_card' ? creditCards.find(c => c.id === s.payment_source_id) : null;
                          return (
                            <tr key={s.id} className="hover:bg-slate-800/50">
                              <td className="px-4 py-3 font-medium flex items-center gap-2">
                                  <Badge variant={s.is_active ? 'default' : 'secondary'} className={s.is_active ? 'bg-green-500' : 'bg-slate-600'}>
                                      {s.is_active ? 'Active' : 'Paused'}
                                  </Badge>
                                  {s.name}
                              </td>
                              <td className="px-4 py-3 font-semibold text-blue-300" dangerouslySetInnerHTML={{ __html: formatCurrencyWithConversion(s.amount, s.currency) }} />
                              <td className="px-4 py-3">
                                {card ? (
                                  <div className="flex items-center gap-2 text-xs">
                                    <CreditCard className="h-4 w-4 text-blue-400" />
                                    <span>{card.card_name} (...{card.last_four_digits})</span>
                                  </div>
                                ) : (
                                  <span className="text-xs">Cash Flow</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right">{new Date(s.next_due_date).toLocaleDateString()}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-center gap-2">
                                  <Button variant="ghost" size="icon" onClick={() => handleEdit(s)}><Edit className="h-4 w-4" /></Button>
                                  <Button variant="ghost" size="icon" className="text-red-400" onClick={() => handleDelete(s.id)}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          <div className="space-y-8">
            <ReportCard 
              reportType="service-cost-breakdown"
              title="Monthly Subscription Costs"
              description="A breakdown of your active recurring payments."
              icon={CalendarClock}
              color="text-indigo-400"
            />
          </div>
        </div>
      </motion.div>
      <ServiceDialog isOpen={isDialogOpen} onOpenChange={setIsDialogOpen} currentService={currentService} onSaveSuccess={handleSaveSuccess} />
    </>
  );
};

export default ServicesPage;