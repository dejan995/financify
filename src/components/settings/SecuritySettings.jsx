
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, Shield } from 'lucide-react';

const SecuritySettings = () => {
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Password too short", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    setIsUpdating(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
        toast({ title: "Error updating password", description: error.message, variant: "destructive" });
    } else {
        toast({ title: "Password updated successfully!" });
        setNewPassword('');
        setConfirmPassword('');
    }
    setIsUpdating(false);
  };

  return (
    <Card className="glassmorphism border-slate-700/50">
      <CardHeader>
        <CardTitle className="flex items-center text-xl text-slate-200"><Shield className="mr-2 h-5 w-5 text-red-400" /> Change Password</CardTitle>
        <CardDescription className="text-slate-400">Update your password for enhanced security.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handlePasswordUpdate} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              disabled={isUpdating}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              disabled={isUpdating}
            />
          </div>
          <Button type="submit" disabled={isUpdating || !newPassword}>
            {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Update Password'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SecuritySettings;
