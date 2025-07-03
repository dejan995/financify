
import React from 'react';
import { Auth as SupabaseAuth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/lib/customSupabaseClient';
import { motion } from 'framer-motion';

const Auth = () => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex justify-center items-center min-h-screen bg-slate-900 p-4"
    >
      <div className="w-full max-w-md p-8 space-y-8 bg-slate-800/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-slate-700">
        <h1 className="text-4xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-primary to-sky-400">
          Welcome to Financify
        </h1>
        <p className="text-center text-slate-400">Sign in or create an account to continue</p>
        <SupabaseAuth
          supabaseClient={supabase}
          appearance={{ 
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#0ea5e9',
                  brandAccent: '#0284c7',
                  defaultButtonBackground: '#1e293b',
                  defaultButtonBackgroundHover: '#334155',
                  inputBackground: '#334155',
                  inputBorder: '#475569',
                  inputText: '#f1f5f9',
                  messageText: '#f1f5f9',
                },
                radii: {
                  borderRadius: '8px',
                  buttonBorderRadius: '8px',
                  inputBorderRadius: '8px',
                }
              }
            }
          }}
          theme="dark"
          providers={['google', 'github']}
          socialLayout="horizontal"
        />
      </div>
    </motion.div>
  );
};

export default Auth;
  