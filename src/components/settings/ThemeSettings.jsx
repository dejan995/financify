import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Palette } from 'lucide-react';

const ThemeSettings = () => {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'financify' ? 'classic' : 'financify');
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700/50 text-slate-100">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <Palette className="text-primary" /> App Theme
        </CardTitle>
        <CardDescription className="text-slate-400">
          Choose your preferred look and feel for the application.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center space-y-4">
        <p>Current theme: <span className="font-bold capitalize text-primary">{theme}</span></p>
        <Button onClick={toggleTheme} className="w-full">
          {theme === 'financify' ? (
            <>
              <Sun className="mr-2 h-4 w-4" /> Switch to Classic Theme
            </>
          ) : (
            <>
              <Moon className="mr-2 h-4 w-4" /> Switch to Financify Theme
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ThemeSettings;