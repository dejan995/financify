
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import currencyConverter from '@/lib/currencyConverter';
import { useToast } from "@/components/ui/use-toast";

export const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();

    const [profile, setProfile] = useState(null);
    const [loadingData, setLoadingData] = useState(true);
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [creditCards, setCreditCards] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [services, setServices] = useState([]);
    const [cashFlow, setCashFlow] = useState([]);
    const [savings, setSavings] = useState([]);
    const [budgets, setBudgets] = useState([]);

    const preferences = profile?.preferences || {};
    const theme = preferences.theme || 'financify';
    const defaultCurrency = preferences.defaultCurrency || 'USD';
    const expensesCurrency = preferences.expensesCurrency || 'USD';
    const productsCurrency = preferences.productsCurrency || 'USD';
    const cashFlowCurrency = preferences.cashFlowCurrency || 'USD';
    const savingsCurrency = preferences.savingsCurrency || 'USD';
    const budgetCurrency = preferences.budgetCurrency || 'USD';
    const servicesCurrency = preferences.servicesCurrency || 'USD';
    const creditCardsCurrency = preferences.creditCardsCurrency || 'USD';
    const enableCurrencyConversion = preferences.hasOwnProperty('enableCurrencyConversion') ? preferences.enableCurrencyConversion : true;
    const showOriginalCurrency = preferences.hasOwnProperty('showOriginalCurrency') ? preferences.showOriginalCurrency : false;
    
    useEffect(() => {
        const fetchProfile = async () => {
            if (user) {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (error && error.code !== 'PGRST116') {
                    toast({ title: 'Error fetching profile', description: error.message, variant: 'destructive' });
                } else {
                    setProfile(data);
                }
            } else {
                setProfile(null);
            }
        };
        fetchProfile();
    }, [user, toast]);

    const refreshAppData = useCallback(async () => {
        if (!user) {
            setLoadingData(false);
            return;
        };
        setLoadingData(true);
        try {
            const tables = ['categories', 'products', 'credit_cards', 'expenses', 'services', 'cash_flow', 'savings', 'budgets'];
            const fetches = tables.map(table => supabase.from(table).select('*'));
            const results = await Promise.all(fetches);

            results.forEach((res, index) => {
                if (res.error) throw new Error(`Failed to fetch ${tables[index]}: ${res.error.message}`);
            });
            
            const [catRes, prodRes, ccRes, expRes, srvRes, cfRes, savRes, budRes] = results;

            setCategories(catRes.data);
            setProducts(prodRes.data);
            setCreditCards(ccRes.data);
            setExpenses(expRes.data);
            setServices(srvRes.data);
            setCashFlow(cfRes.data);
            setSavings(savRes.data);
            setBudgets(budRes.data);
        } catch (error) {
            toast({ title: 'Error fetching app data', description: error.message, variant: 'destructive' });
        } finally {
            setLoadingData(false);
        }
    }, [user, toast]);

    useEffect(() => {
        if (user) {
            refreshAppData();
        }
    }, [user, refreshAppData]);

    useEffect(() => {
        if (profile?.preferences) {
            const root = window.document.documentElement;
            root.setAttribute('data-theme', profile.preferences.theme || 'financify');
        }
    }, [profile]);

    useEffect(() => {
        if (enableCurrencyConversion) {
            currencyConverter.ensureRatesLoaded(defaultCurrency).catch(console.warn);
        }
    }, [defaultCurrency, enableCurrencyConversion]);
    
    const updateUserPreferences = async (newPrefs) => {
        if (!profile) return;
        const updatedPreferences = { ...profile.preferences, ...newPrefs };
        const { data, error } = await supabase
            .from('profiles')
            .update({ preferences: updatedPreferences })
            .eq('id', user.id)
            .select()
            .single();

        if (error) {
            toast({ title: "Error saving preferences", description: error.message, variant: "destructive" });
        } else {
            setProfile(data);
            toast({ title: "Preferences saved!" });
        }
    };
    
    const addEntry = async (tableName, entryData) => {
        const { data, error } = await supabase.from(tableName).insert([{ ...entryData, created_by: user.id }]).select();
        if (error) throw error;
        await refreshAppData();
        return data;
    };
    
    const updateEntry = async (tableName, id, updateData) => {
        const { data, error } = await supabase.from(tableName).update(updateData).eq('id', id).select();
        if (error) throw error;
        await refreshAppData();
        return data;
    };

    const deleteEntry = async (tableName, id) => {
        const { error } = await supabase.from(tableName).delete().eq('id', id);
        if (error) throw error;
        await refreshAppData();
    };

    const deleteCategory = async (categoryId) => {
        await supabase.from('budgets').delete().eq('category_id', categoryId);
        await supabase.from('products').update({ category_id: null }).eq('category_id', categoryId);
        await supabase.from('expenses').update({ category_id: null }).eq('category_id', categoryId);
        await supabase.from('services').update({ category_id: null }).eq('category_id', categoryId);
        await supabase.from('cash_flow').update({ category_id: null }).eq('category_id', categoryId);
        await supabase.from('categories').delete().eq('id', categoryId);
        await refreshAppData();
    };

    const deleteProduct = async (productId) => {
        await supabase.from('expenses').update({ product_id: null }).eq('product_id', productId);
        await supabase.from('products').delete().eq('id', productId);
        await refreshAppData();
    };

    const deleteService = async (serviceId) => {
        await supabase.from('expenses').update({ service_id: null }).eq('service_id', serviceId);
        await supabase.from('cash_flow').update({ service_id: null }).eq('service_id', serviceId);
        await supabase.from('services').delete().eq('id', serviceId);
        await refreshAppData();
    };

    const convertCurrency = async (amount, fromCurrency, toCurrency = defaultCurrency) => {
        if (!enableCurrencyConversion || !amount || !fromCurrency || !toCurrency || fromCurrency === toCurrency) return amount || 0;
        try { 
            return await currencyConverter.convertAsync(amount, fromCurrency, toCurrency, defaultCurrency); 
        } catch (error) { 
            console.warn('Currency conversion failed:', error); 
            return amount; 
        }
    };
    
    const formatCurrencyWithConversion = (amount, fromCurrency, toCurrency = defaultCurrency) => {
        if (!enableCurrencyConversion) return new Intl.NumberFormat('en-US', { style: 'currency', currency: fromCurrency || defaultCurrency }).format(amount || 0);
        return currencyConverter.formatCurrencyWithConversion(amount, fromCurrency, toCurrency, showOriginalCurrency);
    };

    const refreshExchangeRates = async () => {
        try { 
            await currencyConverter.fetchExchangeRates(defaultCurrency); 
            toast({ title: "Exchange Rates Updated" }); 
        } catch (error) { 
            toast({ title: "Failed to Update Rates", variant: "destructive" }); 
        }
    };

    const getExchangeRatesInfo = () => currencyConverter.getRatesInfo();
    
    const appContextValue = {
        loading: authLoading || loadingData || !profile,
        profile, setProfile,
        categories, addCategory: (c) => addEntry('categories', c), updateCategory: (id, d) => updateEntry('categories', id, d), deleteCategory,
        products, addProduct: (p) => addEntry('products', p), updateProduct: (id, d) => updateEntry('products', id, d), deleteProduct,
        creditCards, addCreditCard: (c) => addEntry('credit_cards', c), updateCreditCard: (id, d) => updateEntry('credit_cards', id, d), deleteCreditCard: (id) => deleteEntry('credit_cards', id),
        expenses, addExpense: (e) => addEntry('expenses', e), updateExpense: (id, d) => updateEntry('expenses', id, d), deleteExpense: (id) => deleteEntry('expenses', id),
        services, addService: (s) => addEntry('services', s), updateService: (id, d) => updateEntry('services', id, d), deleteService,
        cashFlow, addCashFlow: (c) => addEntry('cash_flow', c), updateCashFlow: (id, d) => updateEntry('cash_flow', id, d), deleteCashFlow: (id) => deleteEntry('cash_flow', id),
        savings, addSaving: (s) => addEntry('savings', s), updateSaving: (id, d) => updateEntry('savings', id, d), deleteSaving: (id) => deleteEntry('savings', id),
        budgets, addBudget: (b) => addEntry('budgets', b), updateBudget: (id, d) => updateEntry('budgets', id, d), deleteBudget: (id) => deleteEntry('budgets', id),
        refreshAppData,
        
        defaultCurrency, expensesCurrency, productsCurrency, cashFlowCurrency, savingsCurrency, budgetCurrency, servicesCurrency, creditCardsCurrency,
        enableCurrencyConversion, showOriginalCurrency, theme,
        updateUserPreferences,
        
        convertCurrency, formatCurrencyWithConversion, refreshExchangeRates, getExchangeRatesInfo,
    };

    return (
        <AppContext.Provider value={appContextValue}>
            {children}
        </AppContext.Provider>
    );
};
