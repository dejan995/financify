
import React from 'react';
import { Helmet } from 'react-helmet';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { User, Shield, Palette, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const settingsSections = [
    { id: 'account', label: 'Account', icon: User, path: '/settings/account' },
    { id: 'security', label: 'Security', icon: Shield, path: '/settings/security' },
    { id: 'appearance', label: 'Appearance', icon: Palette, path: '/settings/appearance' },
    { id: 'currency', label: 'Currency', icon: DollarSign, path: '/settings/currency' },
];

const SettingsPage = () => {
    const location = useLocation();

    return (
        <>
            <Helmet>
                <title>Settings | Financify</title>
                <meta name="description" content="Adjust your application settings in Financify." />
            </Helmet>
            <div className="space-y-8">
                <div>
                    <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-sky-400 mb-2">
                        Settings
                    </h1>
                    <p className="text-slate-400">Manage your application preferences and settings.</p>
                </div>

                <nav className="relative border-b border-slate-700/50">
                    <div className="flex items-center overflow-x-auto">
                        {settingsSections.map(section => (
                            <NavLink
                                key={section.id}
                                to={section.path}
                                className={({ isActive }) => cn(
                                    "flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-t-md",
                                    isActive
                                        ? 'text-primary'
                                        : 'text-slate-400 hover:text-slate-100'
                                )}
                            >
                                <section.icon className="h-5 w-5" />
                                <span>{section.label}</span>
                            </NavLink>
                        ))}
                    </div>
                </nav>

                <main className="mt-6">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </>
    );
};

export default SettingsPage;
  