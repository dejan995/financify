import React from 'react';
import { Helmet } from 'react-helmet';
import CurrencySettings from '@/components/settings/CurrencySettings';
import ThemeSettings from '@/components/settings/ThemeSettings';
import FamilySettings from '@/components/settings/FamilySettings';
import AccountSettings from '@/components/settings/AccountSettings';

const SettingsPage = () => {
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
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
             <FamilySettings />
             <CurrencySettings />
          </div>
          <div className="space-y-8">
             <AccountSettings />
             <ThemeSettings />
          </div>
        </div>
      </div>
    </>
  );
};

export default SettingsPage;