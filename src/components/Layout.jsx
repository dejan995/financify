
import React, { useState, useContext } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LayoutGrid, ShoppingCart, Package, Folder, TrendingUp, PiggyBank, Wallet, Server, Settings, Menu, X, Sun, Moon, LogOut, CreditCard, User as UserIcon } from 'lucide-react';
import { AppContext } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const navItems = [
  { to: '/dashboard', icon: LayoutGrid, label: 'Dashboard' },
  { to: '/expenses', icon: ShoppingCart, label: 'Expenses' },
  { to: '/products', icon: Package, label: 'Products' },
  { to: '/categories', icon: Folder, label: 'Categories' },
  { to: '/cashflow', icon: TrendingUp, label: 'Cash Flow' },
  { to: '/savings', icon: PiggyBank, label: 'Savings' },
  { to: '/budgets', icon: Wallet, label: 'Budgets' },
  { to: '/credit-cards', icon: CreditCard, label: 'Credit Cards' },
  { to: '/services', icon: Server, label: 'Services' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const SidebarContent = ({ onLinkClick }) => {
  const { theme, updateUserPreferences } = useContext(AppContext);

  return (
    <div className="flex h-full flex-col bg-slate-800/80 backdrop-blur-lg text-slate-100">
      <div className="flex items-center justify-center p-6 border-b border-slate-700/50">
        <Logo />
      </div>
      <nav className="flex-1 space-y-2 p-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onLinkClick}
            className={({ isActive }) =>
              cn(
                'flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-700/50',
                isActive ? 'bg-primary text-white' : 'text-slate-300'
              )
            }
          >
            <item.icon className="mr-3 h-5 w-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-700/50 space-y-2">
        <Button
          variant="ghost"
          className="w-full flex justify-start gap-2 text-slate-300 hover:bg-slate-700/50 hover:text-white"
          onClick={() => updateUserPreferences({ theme: theme === 'classic' ? 'financify' : 'classic' })}
        >
          {theme === 'classic' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          <span>Switch Theme</span>
        </Button>
      </div>
    </div>
  );
};

const Header = ({ onMenuClick }) => {
    const { user, signOut } = useAuth();
    const { profile } = useContext(AppContext);
    const navigate = useNavigate();
    
    return (
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-800/50 bg-slate-900/50 px-4 sm:px-6 backdrop-blur-sm">
            <Button variant="ghost" size="icon" className="md:hidden text-slate-300 hover:text-white hover:bg-slate-700/50" onClick={onMenuClick}>
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle Menu</span>
            </Button>
            <div className="flex-1" />
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-slate-700/50">
                        <Avatar className="h-10 w-10 border-2 border-slate-600">
                            <AvatarImage src={profile?.avatar_url} alt={profile?.full_name || user?.email} />
                            <AvatarFallback className="bg-primary text-white">{(profile?.full_name || user?.email || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-slate-800 text-slate-100 border-slate-700">
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{profile?.full_name}</p>
                            <p className="text-xs leading-none text-slate-400">{user?.email}</p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-slate-700" />
                    <DropdownMenuItem onClick={() => navigate('/settings/account')} className="cursor-pointer focus:bg-slate-700/80">
                        <UserIcon className="mr-2 h-4 w-4" />
                        <span>Account</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer focus:bg-slate-700/80">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled className="cursor-not-allowed">
                        Support
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-slate-700" />
                    <DropdownMenuItem onClick={signOut} className="cursor-pointer text-red-400 focus:bg-red-500/20 focus:text-red-400">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Logout</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </header>
    );
};


const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen bg-slate-900">
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <SidebarContent />
      </div>

      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col md:hidden"
          >
            <SidebarContent onLinkClick={() => setSidebarOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>      
      <div className="md:pl-64 flex flex-col flex-1">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default Layout;
