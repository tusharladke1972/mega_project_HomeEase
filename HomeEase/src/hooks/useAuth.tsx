import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { clearProviderCache } from '@/lib/providerCache';

interface UserProfile {
  id: string;
  full_name: string;
  phone: string | null;
  role: 'customer' | 'service_provider' | 'admin';
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string, phone: string, role: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        return null;
      }

      if (!data) {
        return null;
      }

      return data as UserProfile;
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
      return null;
    }
  };

  const ensureServiceProviderRecord = async (userId: string) => {
    const { data: existingProviders, error } = await supabase
      .from('service_providers')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (error) {
      console.error('Error checking provider profile:', error);
      return;
    }

    if (!existingProviders || existingProviders.length === 0) {
      const { error: insertError } = await supabase.from('service_providers').insert({
        user_id: userId,
        business_name: '',
      });

      if (insertError) {
        console.error('Error creating provider profile:', insertError);
      }
    }
  };

  const ensureProfile = async (session: Session) => {
    console.log("[AuthHook] starting ensureProfile for user:", session.user.id);
    const existingProfile = await fetchProfile(session.user.id);
    console.log("[AuthHook] fetched existingProfile:", existingProfile);
    const rawRole = session.user.user_metadata?.role as string | undefined;
    console.log("[AuthHook] raw role in session user_metadata:", rawRole);
    const normalizedRole =
      rawRole === 'service_provider' || rawRole === 'admin' ? rawRole : 'customer';
    console.log("[AuthHook] normalized role:", normalizedRole);

    if (existingProfile) {
      // Self-heal: If trigger defaulted to customer, update database to correct role
      if (existingProfile.role !== normalizedRole) {
        console.log(`[AuthHook] Self-healing profile role mismatch: updating from ${existingProfile.role} to ${normalizedRole}`);
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ role: normalizedRole })
          .eq('id', session.user.id);

        if (!updateError) {
          existingProfile.role = normalizedRole;
        } else {
          console.error('Error updating profile role:', updateError);
        }
      }

      setProfile(existingProfile);
      if (existingProfile.role === 'service_provider') {
        await ensureServiceProviderRecord(session.user.id);
      }
      return;
    }

    const fullName = (session.user.user_metadata?.full_name as string) ?? '';
    const phone = (session.user.user_metadata?.phone as string) ?? null;

    const { error } = await supabase.from('profiles').upsert(
      {
        id: session.user.id,
        full_name: fullName,
        phone,
        role: normalizedRole,
      },
      { onConflict: 'id' }
    );

    if (error) {
      console.error('Error creating profile:', error);
      setProfile(null);
      return;
    }

    const createdProfile = await fetchProfile(session.user.id);
    setProfile(createdProfile);

    if (normalizedRole === 'service_provider') {
      await ensureServiceProviderRecord(session.user.id);
    }
  };

  const handleAuthStateChange = async (session: Session | null) => {
    if (session?.user) {
      setUser(session.user);
      setSession(session);
      await ensureProfile(session);
    } else {
      setUser(null);
      setSession(null);
      setProfile(null);
      clearProviderCache();
    }

    setLoading(false);
  };

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        void handleAuthStateChange(session);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, phone: string, role: string) => {
    setLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            phone: phone,
            role: role,
          }
        }
      });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setProfile(null);
      clearProviderCache();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      loading,
      signIn,
      signUp,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
