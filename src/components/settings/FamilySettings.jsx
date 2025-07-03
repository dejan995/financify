
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Users, Plus, Home, LogOut, Send, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FamilySettings = () => {
  const { enableCollaboration, setEnableCollaboration, user, household, members, refreshHousehold, dismissHouseholdPrompt } = useAuth();
  const [inviteEmail, setInviteEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [isCollaborationDisabled, setIsCollaborationDisabled] = useState(false);

  useEffect(() => {
    const checkDisabledStatus = () => {
      const dismissed = localStorage.getItem('household_prompt_dismissed') === 'true';
      setIsCollaborationDisabled(dismissed && !household);
    };

    checkDisabledStatus();
    window.addEventListener('storage', checkDisabledStatus);

    return () => {
      window.removeEventListener('storage', checkDisabledStatus);
    };
  }, [household]);

  const handleLeaveHousehold = async () => {
    setIsLoading(true);
    const { error } = await supabase
      .from('household_members')
      .delete()
      .match({ household_id: household.id, user_id: user.id });

    if (error) {
      toast({ title: 'Error leaving household', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'You have left the household.' });
      await refreshHousehold();
    }
    setIsLoading(false);
  };
  
  const handleInviteMember = async () => {
    toast({
      title: '🚧 Feature Not Implemented',
      description: "A full invite system is coming soon!",
    });
    setInviteEmail('');
  };

  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast({
        title: "Copied to clipboard!",
        description: "You can now share the household ID.",
    });
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700/50 text-slate-100">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <Users className="text-primary" /> Family Mode
        </CardTitle>
        <CardDescription className="text-slate-400">
          Share your financial data with family members. Enable to create or join a household.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center space-x-4 p-4 rounded-lg bg-slate-900/50">
          <Switch id="family-mode" checked={enableCollaboration} onCheckedChange={setEnableCollaboration} disabled={isCollaborationDisabled} />
          <Label htmlFor="family-mode" className="text-lg">Enable Family Mode</Label>
        </div>

        {isCollaborationDisabled && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-slate-400 px-4 -mt-4"
          >
            You chose to set up family mode later, so this option is disabled.
          </motion.div>
        )}

        <AnimatePresence>
          {enableCollaboration && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-6 overflow-hidden"
            >
              {!household ? (
                <div className="p-4 border border-dashed border-slate-600 rounded-lg space-y-4 text-center">
                  <h3 className="font-semibold text-lg">You are not in a household.</h3>
                  <p className="text-slate-400">You can create or join one to start collaborating.</p>
                  <Button onClick={() => dismissHouseholdPrompt(false)}>Manage Household</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-900/50 rounded-lg">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-semibold text-lg flex items-center gap-2"><Home /> {household.name}</h3>
                            <p className="text-sm text-slate-400">Household ID</p>
                            <p className="text-xs text-slate-500 font-mono">{household.id}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleCopyToClipboard(household.id)}>
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Members</h4>
                    <ul className="space-y-2">
                      {members.map(member => (
                        <li key={member.users.id} className="flex justify-between items-center p-2 bg-slate-700/50 rounded-md">
                          <span>{member.users.full_name || 'No name'} ({member.role})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                     <h4 className="font-semibold">Invite a new member</h4>
                      <div className="flex gap-2">
                        <Input
                            type="email"
                            placeholder="member@email.com"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                        />
                        <Button onClick={handleInviteMember}><Send className="mr-2 h-4 w-4" /> Invite</Button>
                      </div>
                  </div>

                  <Button variant="destructive" onClick={handleLeaveHousehold} disabled={isLoading}>
                    <LogOut className="mr-2 h-4 w-4" /> Leave Household
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default FamilySettings;
  