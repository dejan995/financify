
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from "@/components/ui/use-toast";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('authToken'));
  const [household, setHousehold] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHouseholdPrompt, setShowHouseholdPrompt] = useState(false);
  const { toast } = useToast();

  const [enableCollaboration, setEnableCollaboration] = useState(() => {
    const stored = localStorage.getItem('enableCollaboration');
    return stored !== null ? JSON.parse(stored) : true;
  });

  const updateAndStoreEnableCollaboration = (enabled) => {
    setEnableCollaboration(enabled);
    localStorage.setItem('enableCollaboration', JSON.stringify(enabled));
    if (!enabled) {
      setHousehold(null);
      setMembers([]);
    } else if (user && !household) {
      if (!user.has_completed_onboarding) {
          setShowHouseholdPrompt(true);
      }
    }
  };
  
  const dismissHouseholdPrompt = async (persist) => {
    setShowHouseholdPrompt(false);
    if (persist && user) {
      const { error } = await supabase
        .from('users')
        .update({ has_completed_onboarding: true })
        .eq('id', user.id);

      if (error) {
        toast({ title: "Error", description: "Could not save your preference. You might see this screen again.", variant: "destructive" });
      } else {
        setUser(prevUser => ({ ...prevUser, has_completed_onboarding: true }));
      }
    }
  };

  const fetchHouseholdData = useCallback(async (userId) => {
    if (!userId) {
      setHousehold(null);
      setMembers([]);
      return null;
    }
    
    const { data: memberData, error: memberError } = await supabase
      .from('household_members')
      .select('households(*)')
      .eq('user_id', userId);

    if (memberError) {
      console.error('Error fetching household member info:', memberError);
      setHousehold(null);
      setMembers([]);
      return null;
    }

    const currentHousehold = (memberData && memberData.length > 0) ? memberData[0].households : null;
    setHousehold(currentHousehold);

    if (currentHousehold) {
      const { data: membersData, error: membersError } = await supabase
        .from('household_members')
        .select('role, users(id, full_name)')
        .eq('household_id', currentHousehold.id);

      if (membersError) {
        console.error('Error fetching household members:', membersError);
        setMembers([]);
      } else {
        setMembers(membersData || []);
      }
    } else {
      setMembers([]);
    }
    return currentHousehold;
  }, []);

  const login = async (email, password) => {
    const { data, error } = await supabase.functions.invoke('login', {
      body: { email, password },
    });

    if (error || data.error) {
      toast({ title: "Login Failed", description: error?.message || data.error, variant: "destructive" });
      return;
    }

    localStorage.setItem('authToken', data.token);
    setToken(data.token);
    setUser(data.user);
    supabase.auth.setSession({ access_token: data.token, refresh_token: '' });
    toast({ title: "Login Successful!", description: `Welcome back, ${data.user.full_name}!` });

    const currentHousehold = await fetchHouseholdData(data.user.id);
    const collaborationEnabled = localStorage.getItem('enableCollaboration') !== 'false';

    if (collaborationEnabled && !currentHousehold && !data.user.has_completed_onboarding) {
        setShowHouseholdPrompt(true);
    }
  };

  const register = async (email, password, fullName) => {
    const { data, error } = await supabase.functions.invoke('register', {
      body: { email, password, fullName },
    });

    if (error || data.error) {
      toast({ title: "Registration Failed", description: error?.message || data.error, variant: "destructive" });
      throw new Error(error?.message || data.error);
    }
    
    toast({ title: "Registration Successful!", description: "You can now log in with your credentials." });
    return data;
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
    setHousehold(null);
    setMembers([]);
    setShowHouseholdPrompt(false);
    supabase.auth.signOut();
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
  };

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      const storedToken = localStorage.getItem('authToken');
      if (storedToken) {
        try {
          const payload = JSON.parse(atob(storedToken.split('.')[1]));
          if (payload.exp * 1000 > Date.now()) {
            setToken(storedToken);
            supabase.auth.setSession({ access_token: storedToken, refresh_token: '' });
            
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('*')
              .eq('id', payload.sub)
              .single();

            if (userError) throw userError;
            
            setUser(userData);
            const currentHousehold = await fetchHouseholdData(userData.id);
            const collaborationEnabled = localStorage.getItem('enableCollaboration') !== 'false';

            if (collaborationEnabled && !currentHousehold && !userData.has_completed_onboarding) {
                setShowHouseholdPrompt(true);
            }
          } else {
            logout();
          }
        } catch (e) {
          console.error("Token validation failed", e);
          logout();
        }
      }
      setLoading(false);
    };
    initializeAuth();
  }, [fetchHouseholdData]);
  
  const refreshHousehold = useCallback(async () => {
    if (user) {
      await fetchHouseholdData(user.id);
    }
  }, [user, fetchHouseholdData]);

  const value = {
    user,
    setUser,
    token,
    household,
    members,
    loading,
    enableCollaboration,
    setEnableCollaboration: updateAndStoreEnableCollaboration,
    refreshHousehold,
    login,
    register,
    logout,
    showHouseholdPrompt,
    dismissHouseholdPrompt,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
  