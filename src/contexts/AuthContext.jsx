import React, { useState, useEffect } from 'react';
import { AuthContext } from './AuthContextDefinition';  
import { supabase } from '../lib/supabaseClient';

// 2. Create the provider component that will wrap your app
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for an active session when the app first loads
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.warn('Session error:', error.message);
          // Clear any invalid session data
          await supabase.auth.signOut();
          setUser(null);
        } else {
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.warn('Failed to get session:', error.message);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Listen for real-time changes in authentication state (e.g., login, logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully');
      } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        console.log('User signed out');
        setUser(null);
      } else if (event === 'SIGNED_IN') {
        console.log('User signed in');
        setUser(session?.user ?? null);
      } else {
        setUser(session?.user ?? null);
      }
    });

    // Cleanup the listener when the component is no longer on screen
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 3. Define the data and functions to be shared with the whole app
  const value = {
    signUp: (data) => supabase.auth.signUp(data),
    signIn: (data) => supabase.auth.signInWithPassword(data),
    signOut: () => supabase.auth.signOut(),
    user,
    loading,
  };

  // 4. Render the children (your app) only when the initial session check is complete
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
