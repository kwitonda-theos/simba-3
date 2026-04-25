import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

function normalizeUserRole(rawRole) {
  // Database uses underscores, but frontend uses hyphens for URLs/state consistency
  if (rawRole === 'branch_manager' || rawRole === 'branch-manager') return 'branch-manager';
  if (rawRole === 'branch_staff' || rawRole === 'branch-staff') return 'branch-staff';
  return 'customer';
}

function getRoleVariants(role) {
  // Strictly try the database validated values (probed)
  if (!role || role === 'customer') return ['customer'];
  if (role === 'branch-manager' || role === 'branch_manager') {
    return ['branch_manager'];
  }
  if (role === 'branch-staff' || role === 'branch_staff') {
    return ['branch_staff'];
  }
  return [role];
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ensureProfile = async (sessionUser) => {
      if (!sessionUser) return;
      try {
        const { data: profile, error: fetchError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', sessionUser.id)
          .maybeSingle();

        if (fetchError) {
          console.error('Error fetching profile:', fetchError.message);
          return;
        }

        if (!profile) {
          console.log('Profile missing, creating...');
          const { error: insertError } = await supabase.from('profiles').insert({
            id: sessionUser.id,
            full_name: sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.name || sessionUser.email?.split('@')[0] || 'User',
            role: sessionUser.user_metadata?.role || 'customer',
            primary_branch_id: sessionUser.user_metadata?.primary_branch_id || null
          });
          
          if (insertError) {
            console.error('Failed to auto-create profile:', insertError.message);
          } else {
            console.log('Profile created successfully.');
          }
        }
      } catch (err) {
        console.error('Critical failure in ensureProfile:', err);
      }
    };

    // Check for existing session on page load
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (session) {
          setUser({
            ...session.user,
            name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0],
            role: normalizeUserRole(session.user.user_metadata?.role),
          });
          ensureProfile(session.user);
        }
      } catch (err) {
        console.error('Session check failed:', err.message);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        const userObj = {
          ...session.user,
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0],
          role: normalizeUserRole(session.user.user_metadata?.role),
        };
        setUser(userObj);
        
        if (event === 'SIGNED_IN') {
          ensureProfile(session.user);
        }
      } else {
        setUser(null);
      }
      
      // Only force loading false on critical events if not already handled by checkSession
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signup = async ({ email, password, name, role, branches, metadata }) => {
    try {
      let dbRole = 'customer';
      if (role === 'branch-manager' || role === 'branch_manager') dbRole = 'branch_manager';
      if (role === 'branch-staff' || role === 'branch_staff') dbRole = 'branch_staff';
      
      const primaryBranchId = branches && branches.length > 0 ? branches[0] : null;

      const userData = {
        full_name: name || email.split('@')[0],
        role: dbRole,
        primary_branch_id: primaryBranchId,
        ...(metadata || {}),
      };

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });

      // If we get a 500 error, the user might actually have been created (trigger crash after user creation)
      if (error && error.status === 500) {
        console.warn('Signup trigger likely crashed, attempting to verify if user was created...');
        const { data: loginData, error: loginError } = await login(email, password);
        if (!loginError) {
          return { data: loginData, error: null };
        }
        throw error; // If login also fails, throw original signup error
      }

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.error('Signup error:', err.message);
      return { data: null, error: err.message };
    }
  };

  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;

      // SAFETY: If profile trigger failed, we ensure profile exists now
      if (data?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .maybeSingle();

        if (!profile) {
          console.log('Profile missing, creating manually...');
          await supabase.from('profiles').insert({
            id: data.user.id,
            full_name: data.user.user_metadata?.full_name || email.split('@')[0],
            role: data.user.user_metadata?.role || 'customer',
            primary_branch_id: data.user.user_metadata?.primary_branch_id || null
          });
        }
      }

      return { data, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  };

  const loginWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  };

  const resetPassword = async (email) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  };

  const updatePassword = async (newPassword) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      signup,
      logout,
      loginWithGoogle,
      resetPassword,
      updatePassword,
      isAuthenticated: !!user,
      isBranchManager: user?.role === 'branch-manager' || user?.role === 'branch_manager',
      isBranchStaff: user?.role === 'branch-staff' || user?.role === 'branch_staff',
      isStaff: user?.role === 'branch-manager' || user?.role === 'branch_manager' || user?.role === 'branch-staff' || user?.role === 'branch_staff',
      branches: user?.user_metadata?.branches || [],
    }}>
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100%', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }} />
            <p style={{ fontWeight: 600 }}>Authenticating...</p>
          </div>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
