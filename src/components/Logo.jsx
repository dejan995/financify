
import React from 'react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

const Logo = ({ className }) => {
  return (
    <Link to="/dashboard" className={cn("flex items-center gap-2", className)}>
      <img src="/logo.svg" alt="Financify Logo" className="h-8 w-8" />
      <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-sky-400">
        Financify
      </span>
    </Link>
  );
};

export default Logo;
