
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Home, UserPlus } from 'lucide-react';

const HouseholdManager = () => {
  const { user, dismissHouseholdPrompt, refreshHousehold } = useAuth();
  const { toast } = useToast();
  const [householdName, setHouseholdName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('create');

  const handleCreateHousehold = async () => {
    if (!householdName.trim()) {
      toast({ title: "Household name is required.", variant: "destructive" });
      return;
    }
    if (!user) {
      toast({ title: "Authentication error", description: "Could not identify user.", variant: "destructive" });
      return;
    }
    setIsLoading(true);

    const { data, error } = await supabase
      .from('households')
      .insert({ name: householdName, owner_id: user.id })
      .select()
      .single();

    if (error) {
      toast({ title: "Failed to create household", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Household Created!", description: `Successfully created "${data.name}".` });
      await refreshHousehold();
      dismissHouseholdPrompt(true);
    }
    setIsLoading(false);
  };
  
  const handleJoinHousehold = async () => {
    if (!inviteCode.trim()) {
      toast({ title: "Invite code is required.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    const { data, error } = await supabase.functions.invoke('join-household', {
      body: { household_id: inviteCode },
    });

    if (error || (data && data.error)) {
      toast({ title: "Failed to join household", description: error?.message || data.error, variant: "destructive" });
    } else {
      toast({ title: "Successfully joined household!" });
      await refreshHousehold();
      dismissHouseholdPrompt(true);
    }
    setIsLoading(false);
  };

  const handleDoLater = () => {
    dismissHouseholdPrompt(true);
    toast({ title: "Got it!", description: "You can set up your household later in the settings." });
  };
  
  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-700 text-slate-50">
        <DialogHeader>
          <DialogTitle className="text-2xl text-transparent bg-clip-text bg-gradient-to-r from-primary to-sky-400">Collaborate with your Household</DialogTitle>
          <DialogDescription className="text-slate-400">
            Create or join a household to share financial data with your family.
          </DialogDescription>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800">
            <TabsTrigger value="create"><Home className="mr-2 h-4 w-4" /> Create</TabsTrigger>
            <TabsTrigger value="join"><UserPlus className="mr-2 h-4 w-4" /> Join</TabsTrigger>
          </TabsList>
          <TabsContent value="create">
            <div className="py-4 space-y-4">
              <Label htmlFor="household-name" className="text-slate-300">Household Name</Label>
              <Input
                id="household-name"
                placeholder="e.g., The Smiths' Home"
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
                className="bg-slate-800 border-slate-700 focus:ring-primary"
              />
              <Button onClick={handleCreateHousehold} disabled={isLoading} className="w-full bg-primary hover:bg-primary/90">
                {isLoading && activeTab === 'create' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Create Household'}
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="join">
             <div className="py-4 space-y-4">
              <Label htmlFor="invite-code" className="text-slate-300">Invite Code (Household ID)</Label>
              <Input
                id="invite-code"
                placeholder="Enter the household ID"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="bg-slate-800 border-slate-700 focus:ring-primary"
              />
              <Button onClick={handleJoinHousehold} disabled={isLoading} className="w-full bg-primary hover:bg-primary/90">
                {isLoading && activeTab === 'join' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Join Household'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button variant="ghost" onClick={handleDoLater} className="w-full text-slate-400 hover:bg-slate-800 hover:text-slate-50">
            I'll do this later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default HouseholdManager;
  