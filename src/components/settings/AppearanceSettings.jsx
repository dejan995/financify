import React, { useContext } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Palette } from 'lucide-react';

const AppearanceSettings = () => {
  const { theme, updateUserPreferences } = useContext(AppContext);

  return (
    <Card className="glassmorphism border-slate-600/50">
      <CardHeader>
        <CardTitle className="flex items-center text-xl text-slate-200"><Palette className="mr-2 h-5 w-5 text-sky-400" /> Appearance</CardTitle>
        <CardDescription className="text-slate-400">Customize the look and feel of the application.</CardDescription>
      </CardHeader>
      <CardContent>
        <Label htmlFor="theme-select" className="block text-sm font-medium text-slate-300 mb-2">Theme</Label>
        <Select value={theme} onValueChange={(newTheme) => updateUserPreferences({ theme: newTheme })}>
          <SelectTrigger id="theme-select" className="w-full bg-slate-700 border-slate-600">
            <SelectValue placeholder="Select theme" />
          </SelectTrigger>
          <SelectContent className="bg-slate-700 border-slate-600" position="popper">
            <SelectItem value="financify">Financify (Default)</SelectItem>
            <SelectItem value="classic">Classic Dark</SelectItem>
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
};

export default AppearanceSettings;