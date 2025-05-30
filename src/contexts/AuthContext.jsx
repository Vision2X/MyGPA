import React, { createContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUserProfile = useCallback(async (userId) => {
    if (!userId) return null;
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return null;
      }
      return profile;
    } catch (e) {
      console.error('Exception fetching profile:', e);
      return null;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const getSession = async () => {
      setLoading(true);
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (!isMounted) return;

      if (error) {
        console.error("Error getting session:", error.message);
        setUser(null);
        setLoading(false);
        return;
      }

      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        if (isMounted) setUser({ ...session.user, ...profile });
      } else {
        if (isMounted) setUser(null);
      }
      if (isMounted) setLoading(false);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      setLoading(true);
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        if (isMounted) setUser({ ...session.user, ...profile });
      } else {
        if (isMounted) setUser(null);
      }
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({ title: "Login Failed", description: error.message, variant: "destructive" });
      setLoading(false);
      throw error;
    }
    if (data.user) {
      const profile = await fetchUserProfile(data.user.id);
      setUser({ ...data.user, ...profile });
      toast({ title: "Login Successful!", description: `Welcome back, ${profile?.name || data.user.email}!`, variant: "default" });
    }
    setLoading(false);
    return data;
  }, [toast, fetchUserProfile]);

  const signup = useCallback(async (name, email, password) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
        }
      }
    });

    if (error) {
      toast({ title: "Signup Failed", description: error.message, variant: "destructive" });
      setLoading(false);
      throw error;
    }

    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          { id: data.user.id, name, email, updated_at: new Date(), created_at: new Date() }
        ]);

      if (profileError) {
        toast({ title: "Profile Creation Failed", description: profileError.message, variant: "destructive" });
        setLoading(false);
        throw profileError;
      }
      setUser({ ...data.user, name, email }); 
      toast({ title: "Signup Successful!", description: `Welcome, ${name}! Please check your email to verify your account.`, variant: "default" });
    }
    setLoading(false);
    return data;
  }, [toast]);

  const logout = useCallback(async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({ title: "Logout Failed", description: error.message, variant: "destructive" });
    } else {
      setUser(null);
      toast({ title: "Logged Out", description: "You have been successfully logged out.", variant: "default" });
    }
    setLoading(false);
  }, [toast]);
  
  const updateUserProfileContext = useCallback(async (updatedProfileData) => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updatedProfileData, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      toast({ title: "Profile Update Failed", description: error.message, variant: "destructive" });
      setLoading(false);
      throw error;
    }
    if (data) {
      setUser(prevUser => ({ ...prevUser, ...data }));
      toast({ title: "Profile Updated", description: "Your profile has been updated." });
    }
    setLoading(false);
    return data;
  }, [user, toast]);

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    isAuthenticated: !!user,
    updateUserProfileContext,
    fetchUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;