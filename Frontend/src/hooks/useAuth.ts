import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export type AuthUser = {
  id: string;
  email: string;
  role: 'student' | 'instructor' | 'admin';
};

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          const { data: userData } = await supabase
            .from('users')
            .select('id, email, role')
            .eq('id', session.user.id)
            .maybeSingle();

          if (userData) {
            setUser({
              id: userData.id,
              email: userData.email,
              role: userData.role,
            });
          }
        }
      } catch (err) {
        console.error('Auth error:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        (async () => {
          const { data: userData } = await supabase
            .from('users')
            .select('id, email, role')
            .eq('id', session.user.id)
            .maybeSingle();

          if (userData) {
            setUser({
              id: userData.id,
              email: userData.email,
              role: userData.role,
            });
          }
        })();
      } else {
        setUser(null);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, role: 'student' | 'instructor' = 'student') => {
    setError(null);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Sign up failed');

      const { error: userError } = await supabase
        .from('users')
        .insert([{
          id: authData.user.id,
          email,
          full_name: fullName,
          role,
          status: 'active',
          facial_data_registered: false,
        }]);

      if (userError) throw userError;

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign up failed';
      setError(message);
      return { success: false, error: message };
    }
  };

  const signIn = async (email: string, password: string) => {
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign in failed';
      setError(message);
      return { success: false, error: message };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  return { user, loading, error, signUp, signIn, signOut };
}
