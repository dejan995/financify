
import React, { useState, useEffect, useContext } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { BarChart2, Loader2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { AppContext } from '@/contexts/AppContext';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#d0ed57', '#a4de6c', '#8dd1e1', '#83a6ed', '#8e44ad'];

const CustomTooltip = ({ active, payload, label, formatter }) => {
    if (active && payload && payload.length) {
        return (
            <div className="p-2 text-xs bg-slate-800 rounded-md border border-slate-700 text-white">
                <p className="label font-bold text-base mb-1">{`${label}`}</p>
                {payload.map((entry, index) => (
                    <p key={`item-${index}`} style={{ color: entry.color || entry.payload.fill }}>
                        {`${entry.name}: ${formatter ? formatter(entry.value, entry.payload.currency) : entry.value}`}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const ReportCard = ({ title, description, reportType, icon: Icon = BarChart2, color = "text-indigo-400" }) => {
    const { 
        formatCurrencyWithConversion, defaultCurrency, convertCurrency,
        budgets, expenses, cashFlow, categories, creditCards, products, savings, services
    } = useContext(AppContext);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const processData = async () => {
            setLoading(true);
            let reportData = [];

            try {
                switch (reportType) {
                    case 'budget-performance': {
                        reportData = await Promise.all(budgets.map(async (budget) => {
                            const relevantExpenses = expenses.filter(e => 
                                e.category_id === budget.category_id &&
                                new Date(e.expense_date) >= new Date(budget.start_date) &&
                                new Date(e.expense_date) <= new Date(budget.end_date)
                            );
                            const spentInOriginalCurrency = relevantExpenses.reduce((sum, exp) => sum + exp.amount, 0);
                            const spent = await convertCurrency(spentInOriginalCurrency, relevantExpenses[0]?.currency || budget.currency);
                            const budgeted = await convertCurrency(budget.amount, budget.currency);
                            return { name: budget.name, Budgeted: budgeted, Spent: spent };
                        }));
                        break;
                    }
                    case 'cashflow-analysis': {
                        const monthlyData = {};
                        for (const t of cashFlow) {
                            const date = new Date(t.transaction_date);
                            const month = date.toLocaleString('default', { month: 'short', year: '2-digit' });
                            if (!monthlyData[month]) monthlyData[month] = { name: month, Income: 0, Outflow: 0 };
                            const convertedAmount = await convertCurrency(t.amount, t.currency);
                            if (t.type === 'income') monthlyData[month].Income += convertedAmount;
                            else monthlyData[month].Outflow += convertedAmount;
                        }
                        reportData = Object.values(monthlyData).sort((a, b) => new Date(a.name) - new Date(b.name));
                        break;
                    }
                    case 'category-usage':
                    case 'expense-by-category':
                    case 'cc-spending-by-category': {
                        let filteredExpenses = expenses;
                        if(reportType === 'cc-spending-by-category') {
                            filteredExpenses = expenses.filter(e => e.payment_source_type === 'credit_card');
                        }
                        
                        const categoryTotals = {};
                        for (const expense of filteredExpenses) {
                            const category = categories.find(c => c.id === expense.category_id);
                            const categoryName = category?.name || 'Uncategorized';
                            const convertedAmount = await convertCurrency(expense.amount, expense.currency);
                            categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + convertedAmount;
                        }
                        reportData = Object.entries(categoryTotals).map(([name, value]) => ({ name, value }));
                        break;
                    }
                    case 'cc-balance': {
                        reportData = await Promise.all(creditCards.map(async (card) => ({
                            name: card.card_name,
                            Balance: await convertCurrency(card.current_balance, card.currency),
                            Limit: await convertCurrency(card.credit_limit, card.currency),
                        })));
                        break;
                    }
                    case 'product-cost-comparison': {
                        const pricedProducts = products.filter(p => p.default_price != null);
                        const sortedProducts = pricedProducts.sort((a,b) => b.default_price - a.default_price).slice(0, 10);

                        reportData = await Promise.all(sortedProducts.map(async (p) => ({
                            name: p.name,
                            Price: await convertCurrency(p.default_price, p.currency)
                        })));
                        break;
                    }
                    case 'savings-goal-progress': {
                        reportData = await Promise.all(savings.map(async (g) => ({
                            name: g.goal_name,
                            Saved: await convertCurrency(g.current_amount, g.currency),
                            Target: await convertCurrency(g.target_amount, g.currency),
                        })));
                        break;
                    }
                    case 'service-cost-breakdown': {
                        const activeServices = services.filter(s => s.is_active);
                        reportData = await Promise.all(activeServices.map(async (s) => {
                            let monthlyCost = s.amount;
                            if (s.recurrence_interval === 'yearly') monthlyCost /= 12;
                            if (s.recurrence_interval === 'weekly') monthlyCost *= 4.33;
                            if (s.recurrence_interval === 'daily') monthlyCost *= 30;
                            return {
                                name: s.name,
                                value: await convertCurrency(monthlyCost, s.currency)
                            }
                        }));
                        break;
                    }
                    default:
                        reportData = [];
                }
            } catch (error) {
                console.error(`Report Error (${reportType}):`, error);
                reportData = [];
            } finally {
                setData(reportData);
                setLoading(false);
            }
        };
        processData();
    }, [reportType, defaultCurrency, convertCurrency, budgets, expenses, cashFlow, categories, creditCards, products, savings, services]);

    const currencyFormatter = (value) => formatCurrencyWithConversion(value, defaultCurrency).split(' ')[0];

    const renderChart = () => {
        if (loading) return <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div>;
        if (!data || data.length === 0) return <div className="flex justify-center items-center h-48 text-slate-400">No data available for this report.</div>;
        
        const chartProps = { data, margin: { top: 5, right: 20, left: 0, bottom: 5 }};
        const tooltipProps = { content: <CustomTooltip formatter={currencyFormatter} />, cursor: { fill: 'rgba(128, 128, 128, 0.1)' } };
        const xAxis = <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} interval={0} angle={-30} textAnchor="end" height={50} />;
        const yAxis = <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={value => currencyFormatter(value)} />;

        switch (reportType) {
            case 'budget-performance':
            case 'cc-balance':
            case 'savings-goal-progress':
            case 'product-cost-comparison':
            case 'expense-by-category':
                 const keys = Object.keys(data[0]).filter(k => k !== 'name');
                 return (
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart {...chartProps}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                            {xAxis}
                            {yAxis}
                            <Tooltip {...tooltipProps} />
                            <Legend />
                            {keys.map((key, index) => (
                                <Bar key={key} dataKey={key} name={key} fill={COLORS[index % COLORS.length]} radius={[4, 4, 0, 0]} />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                );

            case 'cashflow-analysis':
                return (
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart {...chartProps}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                            {yAxis}
                            <Tooltip {...tooltipProps} />
                            <Legend />
                            <Line type="monotone" dataKey="Income" stroke={COLORS[1]} />
                            <Line type="monotone" dataKey="Outflow" stroke={COLORS[3]} />
                        </LineChart>
                    </ResponsiveContainer>
                );

            case 'category-usage':
            case 'cc-spending-by-category':
            case 'service-cost-breakdown':
                 return (
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} >
                                {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip content={<CustomTooltip formatter={currencyFormatter} />} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                );

            default:
                return <div className="flex justify-center items-center h-48 text-slate-400">Invalid report type specified.</div>
        }
    };

    return (
        <Card className="glassmorphism border-slate-700/50 h-full">
            <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                    <Icon className={`h-6 w-6 ${color}`} />
                    {title}
                </CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent>
                {renderChart()}
            </CardContent>
        </Card>
    );
};

export default ReportCard;
